let users = [];

function addUser(socketId, userName, roomName){
    const user = {
        socketID: socketId,
        userName: userName,
        roomName: roomName
    };
    users.push(user);
    return user;
}

function removeUser(id){
    const index = users.findIndex(user => user.socketID === id);
    if( index != -1)
        return users.splice(index, 1)[0];
}

