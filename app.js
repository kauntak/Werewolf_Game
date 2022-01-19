const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const rooms = require("./rooms");
const jinrou = require("./jinrouGame");
const port = process.env.port || 8080;

// app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    console.log(req.headers);
    res.sendFile(__dirname + "/public/index.html");
});

let connections = [];

io.on("connection", (socket) => {
    connections.push({
        id: socket.id,
        socket: socket,
        roomName: "",
        isAlive: true,
    });
    socket.emit("initiate", { id: socket.id, rooms: rooms.getRooms() });
    console.log("Connected", socket.id);

    socket.on("set name", (name) => {
        let index = getConnectionIndex(socket.id);
        if (index == -1) return;
        connections[index].name = name;
    });

    socket.on("create room", (data) => {
        let result = rooms.createRoom(data.roomName, socket.id, data.password);
        if (result === false) socket.emit("create failed");
        else {
            socket.join(data.roomName);
            let index = getConnectionIndex(socket.id);
            connections[index].roomName = data.roomName;
            connections[index].isAlive = true;
            io.emit("room created", data.roomName);
        }
    });

    socket.on("join room", (data) => {
        let result = rooms.joinRoom(data.roomName, socket.id, data.password);
        if (result === false) socket.emit("join failed");
        else {
            socket.join(data.roomName);
            socket.emit("room joined", result);
            let index = getConnectionIndex(socket.id);
            connections[index].roomName = data.roomName;
            connections[index].isAlive = true;
            connections[index].role = "";
            io.in(result.roomName).emit("chat message", {
                id: null,
                event: "joined",
                name: connections[index].name,
            });
            io.emit("room size", {
                roomName: result.roomName,
                roomSize: result.roomSize,
            });
        }
    });

    socket.on("leave room", (data) => {
        console.log("Data", data);
        io.in(data.roomName).emit("leave room", data);
        let result = rooms.leaveRoom(data.roomName, data.id);
        socket.rooms.forEach((room) => socket.leave(room));
        console.log(socket.rooms);
        io.emit("room size", {
            roomName: result.roomName,
            roomSize: result.roomSize,
        });
    });

    socket.on("start game", (roomName) => {
        let players = connections.filter(
            (connection) => connection.roomName == roomName
        );
        let clientPlayerList = players.map((player) => {
            return {
                isAlive: player.isAlive,
                id: player.id,
                name: player.name,
            };
        });
        console.log("start game: " + roomName);
        jinrou.assignRoles(players);
        for (let i in players) {
            let teamMembers = [players[i].id];
            if (players[i].role == "werewolf") {
                teamMembers = players
                    .filter((player) => player.role == "werewolf")
                    .map((player) => player.id);
            } else if (
                players[i].role == "shaman" ||
                players[i].role == "traitor" ||
                players[i].role == "villager"
            ) {
                players[i].socket.join(
                    `${players[i].roomName}~~~~~villagerSide`
                );
            }
            players[i].socket.emit("your game started", {
                role: players[i].role,
                players: clientPlayerList,
                teamMembers: teamMembers,
            });
            players[i].socket.join(
                `${players[i].roomName}~~~~~${players[i].role}`
            );
        }
        rooms.startGame(roomName);
        io.in(roomName).emit("chat message", { id: null, event: "start" });
        io.emit("game started", { roomName: roomName });
        startRound(roomName);
    });
    function startRound(roomName) {
        let round = jinrou.getNextRound(rooms.getCurrentRound(roomName));
        rooms.setCurrentRound(roomName, round);
        let players = connections
            .filter(
                (connection) =>
                    connection.roomName == roomName && connection.isAlive
            )
            .map((player) => {
                return { id: player.id, name: player.name, role: player.role };
            });
        console.log(players);
        console.log(round);
        let countDownTime = jinrou.getCountDownTime(round, players.length);
        let countDownMilliSeconds = countDownTime - new Date().getTime() + 2000;
        console.log(countDownTime, countDownMilliSeconds / 1000);
        io.in(roomName).emit("round start", {
            roundType: round,
            time: countDownTime,
        });
        rooms.startVote(roomName);
        rooms.setTimer(roomName, countDownMilliSeconds, async () => {
            console.log("timer done");
            if (round == "day") {
                startRound(roomName);
                return;
            }
            let votes = rooms.getVoteResults(roomName);
            let dataToSend = jinrou.processVotes(votes, players);
            if (round == "night") {
                let lastHangedPlayerData = rooms.getLastHangedPlayer(roomName);
                if (lastHangedPlayerData) {
                    dataToSend["shaman"] = {
                        result: lastHangedPlayerData.role == "werewolf",
                        name: lastHangedPlayerData.name,
                    };
                }
            }
            console.log("data to send", dataToSend);
            for (let i in dataToSend) {
                let sendToRoom = roomName;
                if (i == "traitor") {
                    let connectionIndex = getConnectionIndex(dataToSend[i].id);
                    connections[connectionIndex].socket.leave(
                        sendToRoom + "~~~~~villagerSide"
                    );
                    sendToRoom += "~~~~~werewolf";
                    connections[connectionIndex].socket.join(sendToRoom);
                    let wolfTeam = getIdsInRoom(sendToRoom);
                    dataToSend[i].teamMembers = wolfTeam;
                    io.in(sendToRoom).emit("awakened", dataToSend[i]);
                    continue;
                } else if (i != "werewolf" && i != "villager") {
                    sendToRoom += "~~~~~" + i;
                    io.in(sendToRoom).emit("vote result", dataToSend[i]);
                    continue;
                } else {
                    killPlayer(
                        dataToSend[i],
                        i == "villager" ? roomName : undefined
                    );
                    io.in(sendToRoom).emit("kill result", dataToSend[i]);
                }
            }
            let alivePlayers = connections.filter(
                (connection) =>
                    connection.roomName == roomName && connection.isAlive
            );
            let roundResult = jinrou.checkIfFinished(alivePlayers);
            if (roundResult.isFinished) {
                io.in(roomName).emit(
                    `${roundResult.humansWin ? "humans" : "werewolves"} win`
                );
            } else
                setTimeout(() => {
                    startRound(roomName);
                }, 5000);
        });
    }
    socket.on("vote", (data) => {
        console.log("vote data", data);
        data.voteData = rooms.vote(data);
        let sendToRoom =
            data.target == data.roomName
                ? data.roomName
                : `${data.roomName}~~~~~${data.role}`;
        let delayTime = 0;
        if(data.timerStarted){
            let delayTime = 1500;
            let remainingTime = rooms.getRemainingTime(data.roomName);
            if(remainingTime <= delayTime){
                delayTime = remainingTime - 20;
            }
            delayTime = Math.floor(Math.random() * delayTime);
            
        }
        setTimeout(() => io.in(sendToRoom).emit("update vote", data), delayTime);
        if (!data.timerStarted) return;
        let allVoted = rooms.allVoted(data.roomName);
        if (allVoted) {
            io.in(data.roomName).emit("all voted");
            rooms.cancelTimer(data.roomName);
        }
    });

    socket.on("chat message", (data) => {
        console.log("Msg received", data);
        data.id = socket.id;
        io.in(data.roomName).emit("chat message", data);
    });

    function getIdsInRoom(roomName) {
        const socketList = io.sockets.adapter.rooms.get(roomName);
        const returnList = [];
        socketList.forEach((element) => {
            returnList.push(element);
        });
        return returnList;
    }

    socket.on("disconnect", () => {
        const playerIndex = getConnectionIndex(socket.id);
        if (playerIndex == -1) return;
        const player = connections[playerIndex];
        connections.splice(playerIndex, 1);
        console.log(player.name, "disconnected.");
        if (player.roomName == "") return;
        let result = rooms.leaveRoom(player.roomName, player.id);
        io.emit("room size", {
            roomName: result.roomName,
            roomSize: result.roomSize,
        });
        io.in(player.roomName).emit("leave room", {
            id: player.id,
            name: player.name,
        });
    });
});

http.listen(port, () => {
    console.log("Server started on port:", port);
});

function getConnectionIndex(id) {
    return connections.findIndex((connection) => connection.id == id);
}

function killPlayer(data, roomName) {
    const connectionIndex = getConnectionIndex(data.id);
    if (connectionIndex == -1) return;
    const player = connections[connectionIndex];
    player.isAlive = false;
    player.socket.rooms.forEach((room) => player.socket.leave(room));
    player.socket.join(player.roomName);
    player.socket.join(`${player.roomName}~~~~~dead`);
    if (roomName)
        rooms.hangPlayer(roomName, {
            role: player.role,
            id: player.id,
            name: player.name,
        });
}
