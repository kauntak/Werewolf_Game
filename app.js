const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const rooms = require("./rooms");
const jinrou = require("./jinrouGame");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    console.log(req.headers);
    res.sendFile(__dirname + "/public/index.html");
});

let connections = [];

io.on("connection", (socket) => {
    connections.push({ id: socket.id, socket: socket, roomName: "" });
    socket.emit("initiate", { id: socket.id, rooms:rooms.getRooms() });
    console.log("Connected", socket.id);

    socket.on("set name", (name) => {
        let index = getConnectionIndex(socket.id);
        if(index == -1) return;
        connections[index].name = name;
    });

    socket.on("create room", (data) => {
        let result = rooms.createRoom(data.roomName, socket.id, data.password);
        if (result === false) socket.emit("create failed");
        else {
            socket.join(data.roomName);
            let index = getConnectionIndex(socket.id);
            connections[index].roomName = data.roomName;
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
            io.to(result.roomName).emit("chat message", {id:null, event:"joined", user:connections[index].name});
            io.emit("room size", {
                roomName: result.roomName,
                roomSize: result.roomSize,
            });
        }
    });

    socket.on("leave room", data => {
        console.log("Data", data);
        io.to(data.roomName).emit("chat message", {id:null, event:"left", user:data.user});
        let result = rooms.leaveRoom(data.roomName, socket.id);
        io.emit("room size", {
            roomName: result.roomName,
            roomSize: result.roomSize,
        });
    });

    socket.on("start game", roomName => {
        let players = connections.filter(connection => connection.roomName == roomName);
        let clientPlayerList = players.map(player => {
            return {isAlive:true, id:player.id, name:player.name};
        });
        console.log("start game: " + roomName);
        jinrou.assignRoles(players);
        
        console.log(players);
        for(let i in players){
            players[i].socket.emit("your game started", {role:players[i].role, players:clientPlayerList});
            players[i].socket.join(`${players[i].room}~~~~~${players[i].role}`);
        }
        rooms.startGame(roomName);
        io.to(roomName).emit("chat message", {id:null, event:"start"})
        io.emit("game start", {roomName:roomName});
    });

    socket.on("pseudo vote", data => {
        let voteData = jinrou.vote(true, data);
        io.to(data.target).emit("pseudo vote", data);
    });
    socket.on("vote", (data) => {});

    socket.on("chat message", (data) => {
        console.log("Msg received", data);
        data.id = socket.id;
        io.to(data.roomName).emit("chat message", data);
    });

    socket.on("disconnect", () => {
        // const user = users.removeUser(socket.id);
        // if (user) console.log(user.userName + " has left.");
        console.log("disconnected");
    });
});

http.listen(3000, () => {
    console.log("Server started");
});

function getConnectionIndex(id){
    return connections.findIndex(connection => connection.id == id);
}


