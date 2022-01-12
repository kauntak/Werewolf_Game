module.exports = {
    createRoom,
    setRole,
    joinRoom,
    leaveRoom,
    getRooms,
    startGame,
    startVote,
    allVoted,
    vote,
    getVoteResults,
    hangPlayer,
    getLastHangedPlayer,
    getRoomStatus,
    setRoomStatus,
    getCurrentRound,
    setCurrentRound,
    setTimer,
    getRemainingTime,
    cancelTimer
};

let rooms = [];

function setRole(roomName, id, role) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    const index = rooms[roomIndex].users.findIndex(
        (user) => user.socketID == id
    );
    if (index != -1) {
        rooms[roomIndex].users[index].role = role;
        return users[index];
    }
}

function createRoom(roomName, id, password) {
    if (getRoomIndex(roomName) != -1) return false;
    let room = {
        status: "created",
        roomName: roomName,
        password: password,
        users: [id],
        currentRound: null,
        lastHanged: null
    };
    rooms.push(room);
}

function leaveRoom(roomName, id) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    const userIndex = rooms[roomIndex].users.findIndex((user) => user == id);
    if (userIndex == -1) return;
    rooms[roomIndex].users.splice(userIndex, 1);
    if (rooms[roomIndex].users.length == 0) {
        rooms.splice(roomIndex, 1);
        return { roomName: roomName, roomSize: 0 };
    } else
        return { roomName: roomName, roomSize: rooms[roomIndex].users.length };
}

function joinRoom(roomName, id, password) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1 || rooms[roomIndex].password != password) return false;
    rooms[roomIndex].users.push(id);
    return { roomName: roomName, roomSize: rooms[roomIndex].users.length };
}

function getRoomIndex(roomName) {
    return rooms.findIndex((room) => room.roomName == roomName);
}

function getRooms() {
    return rooms
        .filter((room) => room.status == "created")
        .map((room) => {
            return { roomName: room.roomName, roomSize: room.users.length };
        });
}

function getUsers(roomName) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    return rooms[roomIndex].users;
}

function startGame(roomName) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    rooms[roomIndex].status = "started";
    rooms[roomIndex].lastHanged = null;
}
function startVote(roomName) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    rooms[roomIndex].allVoted = false;
    rooms[roomIndex].votes = [];
    rooms[roomIndex].voteTally = {};
}

function allVoted(roomName){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    const votes = rooms[roomIndex].votes;
    let voteCount = votes.reduce((previousValue, currentValue) => {
        if(currentValue.vote){
            previousValue++;
        }
        return previousValue;
    }, 0);
    if(rooms[roomIndex].users.length == voteCount) return true;
    else return false;
}

function vote(data) {
    const roomIndex = getRoomIndex(data.roomName);
    if (roomIndex == -1) return;
    const votes = rooms[roomIndex].votes;
    const voteIndex = votes.findIndex((voter) => voter.id == data.id);
    if (voteIndex == -1) {
        let vote = {
            id: data.id,
            pseudo: data.pseudoVote,
            vote: data.vote,
            role: data.role,
        }
        votes.push(vote);
    } else {
        votes[voteIndex] = {
            id: data.id,
            pseudo: data.pseudoVote,
            vote: data.vote,
            role: data.role,
        };
    }
    return updateTally(data, roomIndex, data.role);
}

function updateTally(data, roomIndex, role){
    const tally = rooms[roomIndex].voteTally;
    let voteType = (data.vote? "vote": "pseudoVote");
    let returnTally = [];
    if(role in tally){
        if(data[voteType] in tally[role]){
            tally[role][data[voteType]][voteType]++;
        } else {
            tally[role][data[voteType]] = {vote: 0, pseudoVote: 0};
            tally[role][data[voteType]][voteType]++;
        }
    } else {
        tally[role] = {};
        tally[role][data[voteType]] = {vote: 0, pseudoVote: 0};
        tally[role][data[voteType]][voteType]++;
    }
    if(voteType == "vote" && data.pseudoVote){
        tally[role][data[voteType]].pseudoVote--;
    }
    returnTally.push({id: data[voteType], votes:tally[role][data[voteType]]});
    if(data.previousPseudoVote){
        tally[role][data.previousPseudoVote][voteType]--;
        returnTally.push({id:data.previousPseudoVote, votes:tally[role][data.previousPseudoVote]});
    }
    return returnTally;
}
function getVoteResults(roomName) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    const voteTally = rooms[roomIndex].voteTally;
    let voteResult = {};
    for (let i in voteTally){
        let result = "";
        let count = 0;
        for(let j in voteTally[i]){
            if(voteTally[i][j].vote > count){
                count = voteTally[i][j].votes;
                result = j;
            } else if(voteTally[i][j].vote == count){
                let random = Math.round(Math.random());
                if(random){
                    result = j;
                }
            }
        }
        voteResult[i] = result;
    }
    return voteResult;
}

function getRoomStatus(roomName) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    return rooms[roomIndex].status;
}
function setRoomStatus(roomName, newStatus) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    rooms[roomIndex].status = newStatus;
}
function getCurrentRound(roomName){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    return rooms[roomIndex].currentRound;
}

function hangPlayer(roomName, data){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    rooms[roomIndex].lastHanged = data;
}
function getLastHangedPlayer(roomName){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    return rooms[roomIndex].lastHanged;
}

function setCurrentRound(roomName, newRound){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    rooms[roomIndex].currentRound = newRound;
}
function setTimer(roomName, time, callback){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    let timerDoneAt = new Date();
    timerDoneAt.setMilliseconds(timerDoneAt.getMilliseconds() + time);
    rooms[roomIndex].timerFunction = callback;
    rooms[roomIndex].timer = setTimeout(() => callback(), time + 2000);
    rooms[roomIndex].timerDoneAt = timerDoneAt;
}

function getRemainingTime(roomName){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return 0;
    let date = new Date();
    return rooms[roomIndex].timerDoneAt.getTime() - date.getTime();
}

function cancelTimer(roomName){
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    clearTimeout(rooms[roomIndex].timer);
    rooms[roomIndex].timerFunction();
}

function endGame(roomName) {
    const roomIndex = getRoomIndex(roomName);
    if (roomIndex == -1) return;
    rooms[roomIndex].status = "finished";
}
