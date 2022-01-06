var selectedLanguage = document.getElementById("selected-language");
var currentLanguage = "en";
function selectLang(event, language) {
    event.preventDefault();
    currentLanguage = language;
    selectedLanguage.className = language + "-list selected-language";
    selectedLanguage.innerHTML = event.target.innerHTML;
    let languageList = document.getElementsByClassName("language");
    for (let i = 0; i < languageList.length; i++) {
        if (languageList[i].classList.contains(language))
            languageList[i].style.display = "initial";
        else languageList[i].style.display = "none";
    }
}

let passwordCheckboxes = document.getElementsByClassName(
    "require-password-checkbox"
);
for (let i = 0; i < passwordCheckboxes.length; i++) {
    passwordCheckboxes[i].addEventListener("onchange", togglePassword);
}

function togglePassword(event) {
    let passwordDiv = document.getElementsByClassName("password");
    for (let i = 0; i < passwordCheckboxes.length; i++) {
        passwordCheckboxes[i].checked = event.currentTarget.checked;
    }
    for (let i = 0; i < passwordDiv.length; i++) {
        if (event.currentTarget.checked == true) {
            //passwordDiv[i].style.display = "block";
            passwordDiv[i].style.maxHeight = "25px";
        } else {
            //passwordDiv[i].style.display = "none";
            passwordDiv[i].style.maxHeight = "0px";
        }
    }
}

function changeHTML(id, innerHTML, option, en, ja) {
    if (!en) en = innerHTML;
    if (!ja) ja = innerHTML;
    if (!option) {
        document.getElementById(id + "-en").innerHTML = en;
        document.getElementById(id + "-ja").innerHTML = ja;
    } else {
        document.getElementById(id + "-en")[option] = en;
        document.getElementById(id + "-ja")[option] = ja;
    }
}
function addHTML(id, innerHTML, en, ja) {
    if (!en) en = innerHTML;
    if (!ja) ja = innerHTML;
    document.getElementById(id + "-en").innerHTML += en;
    document.getElementById(id + "-ja").innerHTML += ja;
}

function addToRoomList(data) {
    let roomHtml1 = `<input label="${data.roomSize}`;
    let roomHtml2 = `${data.roomName}" type="radio" name="radio-roomName" class="radio-roomName ${data.roomName}" value="${data.roomName}" required><br/>`;

    addHTML(
        "room-list-content",
        undefined,
        roomHtml1 + " players - " + roomHtml2,
        roomHtml1 + "人 - " + roomHtml2
    );
    changeHTML("select-room", false, "disabled");
}
function removeFromRoomList(data) {
    let elements = document.getElementsByClassName(
        `radio-roomName ${data.roomName}`
    );
    for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].remove();
    }
}
function updateRoomList(data) {
    let elements = document.getElementsByClassName(
        `radio-roomName ${data.roomName}`
    );
    for (let i = elements.length - 1; i >= 0; i--) {
        if (data.roomSize != 0) {
            if ((elements[i].parentElement.id = "room-list-content-en")) {
                $(elements[i]).attr(
                    "label",
                    `${data.roomSize} players - ${data.roomName}`
                );
            } else if (
                (elements[i].parentElement.id = "room-list-content-ja")
            ) {
                $(elements[i]).attr(
                    "label",
                    `${data.roomSize}人 - ${data.roomName}`
                );
            }
        } else {
            elements[i].remove();
        }
    }
}

function slidePanel(panelId, isReverse) {
    let panel = document.getElementById(panelId);
    let marginLeft = "-350%";
    if (isReverse === true) {
        marginLeft = "";
        panel.style.display = "";
    } else {
        panel.addEventListener(
            "transitionend",
            () => {
                panel.style.display = "none";
            },
            { once: true }
        );
    }
    panel.style.marginLeft = marginLeft;
}

let ID = "";
let userName = "";
var createdRoom = false;
var currentRoom = "";
var currentRole = "";
var roomSize = 0;
var socket = io();
var justJoined = false;
let players = [];
socket.on("initiate", (data) => {
    ID = data.id;
    for (let i in data.rooms) {
        addToRoomList(data.rooms[i]);
    }
});

document
    .getElementById("welcome-form-en")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        userName = new FormData(event.target).get("username");
        socket.emit("set name", userName);
        slidePanel("welcome");
        return false;
    });
document
    .getElementById("welcome-form-ja")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        userName = new FormData(event.target).get("username");
        socket.emit("set name", userName);
        slidePanel("welcome");
        return false;
    });

function openSelectOrCreateRoom(event, option) {
    if (event.target.className.search("active") != -1) return;
    let oppositeOption = "select-room";
    if (option == "select-room") oppositeOption = "create-room";
    let elements = document.getElementsByClassName(oppositeOption);
    let eventTriggered = false;
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.maxHeight = "0px";
        elements[i].addEventListener(
            "transitionend",
            () => {
                if (eventTriggered) return;
                eventTriggered = true;
                let optionElements = document.getElementsByClassName(option);
                for (let i = 0; i < optionElements.length; i++)
                    optionElements[i].style.maxHeight = "50vh";
            },
            { once: true }
        );
    }
    elements = document.getElementsByClassName(oppositeOption + "-tab-button");
    for (let i = 0; i < elements.length; i++) {
        elements[i].className = elements[i].className.replace(" active", "");
    }
    elements = document.getElementsByClassName(option + "-tab-button");
    for (let i = 0; i < elements.length; i++) {
        elements[i].className += " active";
    }
}

document
    .getElementById("room-creation-form-en")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        let formData = new FormData(event.target);
        socket.emit("create room", {
            roomName: formData.get("new-room-name-en"),
            password: formData.get("new-room-password-en"),
        });
        createdRoom = true;
        return false;
    });
document
    .getElementById("room-creation-form-ja")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        let formData = new FormData(event.target);
        socket.emit("create room", {
            roomName: formData.get("new-room-name-ja"),
            password: formData.get("new-room-password-ja"),
        });
        createdRoom = true;
        return false;
    });

socket.on("create failed", () => {
    if (selectedLanguage.innerHTML == "English")
        alert("Room Could not be created. Please try again.");
    else if (selectedLanguage.innerHTML == "日本語")
        alert("部屋の作成に失敗しました、また作成してください。");
    createdRoom = false;
});
//socket.emit("Join Room", {roomName: roomName});

socket.on("room created", (roomName) => {
    if (createdRoom) {
        updateCurrentRoomSize(1);
        currentRoom = roomName;
        slidePanel("room");
        createdRoom = false;
    }
    addToRoomList({ roomName: roomName, roomSize: 1 });
});

function updateCurrentRoomSize(newRoomSize) {
    roomSize = newRoomSize;
    changeHTML("number-of-players", newRoomSize);
    updateHouses(newRoomSize);
}
document
    .getElementById("room-selection-form-en")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        let formData = new FormData(event.target);
        socket.emit("join room", {
            roomName: formData.get("radio-roomName"),
            password: formData.get("room-password-en"),
        });
    });
document
    .getElementById("room-selection-form-ja")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        let formData = new FormData(event.target);
        socket.emit("join room", {
            roomName: formData.get("radio-roomName"),
            password: formData.get("room-password-ja"),
        });
    });

socket.on("join failed", () => {
    if (selectedLanguage.innerHTML == "English")
        alert("Could not join room. Please try again.");
    else if (selectedLanguage.innerHTML == "日本語")
        alert("部屋に入れませんでした。もう一度お願い致します。");
});

socket.on("room joined", (data) => {
    currentRoom = data.roomName;
    justJoined = true;
    updateCurrentRoomSize(data.roomSize);
    slidePanel("room");
});

socket.on("room size", (data) => {
    updateRoomList(data);
    if (currentRoom == data.roomName) {
        updateCurrentRoomSize(data.roomSize);
    }
});

function updateHouses(houseNumber) {
    let turnOn = true;
    for (let i = 1; i <= 8; i++) {
        if (i > houseNumber) turnOn = false;
        updateWindows(
            document.getElementById("house" + i),
            turnOn,
            houseNumber
        );
    }
}
function updateWindows(element, turnOn, houseCount) {
    let children = element.children;
    for (let i = 0; i < children.length; i++) {
        if (children[i].nodeName === "SPAN") {
            if (turnOn) {
                children[i].style["background-color"] = "yellow";
                element.style.display = "block";
            } else {
                children[i].style["background-color"] = "rgb(31, 21, 17)";
                if (houseCount > 4) {
                    element.style.display = "none";
                }
            }
        }
    }
}

let chatBoxModal = document.getElementById("chat-box-modal");
function openChat() {
    chatBoxModal.style.display = "block";
    lastReadMessage = null;
}

document.getElementById("chat-box-close").onclick = () => {
    chatBoxModal.style.display = "none";
};
window.onresize = () => {
    if (window.innerWidth > 800) {
        chatBoxModal.style.display = "initial";
    } else {
        chatBoxModal.style.display = "none";
    }
};
window.onclick = (event) => {
    if (event.target == leaveGameQuestionModal) {
        leaveGameQuestionModal.style.display = "none";
    } else if (event.target == leaveLobbyQuestionModal) {
        leaveLobbyQuestionModal.style.display = "none";
    } else {
        if (window.innerWidth > 800) return;
        if (event.target == chatBoxModal) {
            chatBoxModal.style.display = "none";
        }
    }
};

function sendMessage() {
    console.log("Msg: ", document.getElementById("message-text").value);
    socket.emit("chat message", {
        message: document.getElementById("message-text").value,
        user: userName,
        roomName: currentRoom,
    });
    document.getElementById("message-text").value = "";
}

socket.on("chat message", (data) => {
    displayMessage(data);
});

let lastReadMessage = null;
function displayMessage(data) {
    console.log(data);
    const div = document.createElement("div");
    if (data.id != null) {
        createUserMessageDiv(data, div);
    } else {
        createSystemMessageDiv(data, div);
    }
    const li = document.createElement("li");
    li.appendChild(div);
    let messages = document.getElementById("messages");
    messages.appendChild(li);
    if (lastReadMessage == null) div.scrollIntoView();
    else lastReadMessage.scrollIntoView();
}

function createUserMessageDiv(data, div) {
    let divClass = "othersDiv";
    if (data.id == ID) {
        divClass = "myDiv";
    }
    div.className = divClass;
    if (document.hidden == false && chatBoxModal.style.display != "none")
        lastReadMessage = null;
    if (
        (chatBoxModal.style.display == "none" || document.hidden == true) &&
        lastReadMessage == null
    ) {
        lastReadMessage = div;
    }
    div.innerHTML = `
        <p class="message-sender">${data.user}</p>
        <p class="message-content">${data.message}</p>
        <p class="message-time">${moment().format("hh:mm")}</p>`;
    return div;
}

function createSystemMessageDiv(data, div) {
    div.className = "system-message";
    let innerHTML = "";
    switch (data.event) {
        case "joined":
            innerHTML = `<p class="language en" ${getSystemMessageStyle(
                "en"
            )}>${data.user} has joined.</p>
                <p class="language ja" ${getSystemMessageStyle("ja")}>${
                data.user
            }が部屋に入りました</p>`;
            break;
        case "left":
            innerHTML = `
                <p class="language en" ${getSystemMessageStyle("en")}>${
                data.user
            } has left.</p>
                <p class="language ja" ${getSystemMessageStyle("ja")}>${
                data.user
            }が夕日に向かって去りました。</p>`;
            break;
        case "start":
            innerHTML = `<p class="language en" ${getSystemMessageStyle(
                "en"
            )}>Let the hunt begin!!</p>
                <p class="language ja" ${getSystemMessageStyle(
                    "ja"
                )}>ゲームが始まりました。</p>`;
            break;
    }
    div.innerHTML = innerHTML;
    return div;
}
function getSystemMessageStyle(language) {
    return ` style="display:${
        currentLanguage == language ? "initial" : "none"
    };"`;
}
let leaveLobbyQuestionModal = document.getElementById("leave-lobby-modal");
function leaveLobbyQuestion() {
    console.log("Leave lobby?");
    leaveLobbyQuestionModal.style.display = "block";
}
function cancelLeaveLobby() {
    leaveLobbyQuestionModal.style.display = "none";
}
function leaveLobby() {
    socket.emit("leave room", { roomName: currentRoom, user: userName });
    currentRoom = "";
    updateCurrentRoomSize(0);
    cancelLeaveLobby();
    slidePanel("room", true);
}
function startGame() {
    console.log("Start Game Button Pushed");
    if (roomSize < 4) {
        if (selectedLanguage.innerHTML == "English")
            alert("Please wait for 4 players or more!");
        else if (selectedLanguage.innerHTML == "日本語")
            alert("４人集まるまで待って下さい。");
    } else {
        socket.emit("start game", currentRoom);
    }
}

socket.on("your game started", (data) => {
    updateRole(data.role);
    players = data.players;
    slidePanel("game-lobby");
    setTimeout(startDiscussion, 2000);
});
socket.on("game started", (data) => {
    removeFromRoomList(data);
});

let leaveGameQuestionModal = document.getElementById("leave-game-modal");
function leaveGameQuestion() {
    leaveGameQuestionModal.style.display = "block";
}
function cancelLeaveGame() {
    leaveGameQuestionModal.style.display = "none";
}
function leaveGame() {
    return;
}
function updateRole(role) {
    currentRole = role;
    let roleImage = document.getElementById("role-image");
    roleImage.innerHTML = `<img src="./images/${role}.png" alt="${role} card">`;
}
let isDay = true;
function startDiscussion() {
    isDay = true;
    setCountDownTime(true, () => {
        startVote();
    });
}

function startNightActivity() {
    isDay = false;
    setCountDownTime(false, () => {
        startVote();
    });
}
let allVoted = false;

function startVote() {
    createVoteOptions(isDay);
    setCountDownTime(false, () => {
        requestVoteResults();
    });
}

function seeVoteResults(){

    if (isDay) startNightActivity();
    else startDiscussion();
}
let voteOptions;
let previousPseudoVote = null;
let currentPseudoVote;
function createVoteOptions(isDay){
    let voteContainer = document.getElementById("vote-options-container");
    voteContainer.innerHTML = "";
    if(isDay){
        let livingPlayers = players.filter(player => player.isAlive && player.id != ID);
        for(let i in livingPlayers){
            voteContainer.innerHTML += `
            <div class="vote-group">
                <input id="vote-${livingPlayers[i].id}" name="radio" type="radio" class="radio-vote" required>
                <label for="vote-${livingPlayers[i].id}" id="vote-label-${livingPlayers[i].id}">${livingPlayers[i].name}</label>
            </div>`;
        }
    } else {
        voteContainer.innerHTML = getRoleHTML();
    }
    voteOptions = document.getElementsByClassName("radio-vote");
    for(let i = 0; i < voteOptions.length; i++){
        voteOptions[i].addEventListener("change", event => {
            previousPseudoVote = currentPseudoVote;
            currentPseudoVote = event.currentTarget.id.substr(5);
            socket.emit("pseudo vote", {
                roomName:currentRoom,
                target:(isDay?currentRoom:currentRole),
                id:currentPseudoVote,
                previousId:previousPseudoVote}
            );
        });
    }
}

socket.on("pseudo vote", data => {
    let label = document.getElementById(`vote-label-${data.id}`);
    let name = label.firstChild.data;

});

function getRoleHTML(){

}

function setCountDownTime(isDiscussion, callback) {
    let countDownTime = new Date();
    if (isDiscussion) {
        countDownTime.setSeconds(
            countDownTime.getSeconds + getDiscussionTime()
        );
    } else {
        countDownTime.setSeconds(countDownTime.getSeconds + 20);
    }
    countDownTime = countDownTime.getTime();
    let timer = setInterval(() => {
        let now = new Date().getTime();
        let difference = countDownTime - now;
        let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((difference % (1000 * 60)) / 1000);
        let timerElement = document.getElementById("count-down");
        timerElement.innerHTML = `${minutes}:${seconds}`;
        if (difference < 0 || allVoted) {
            if (!allVoted) {
                socket.emit("vote", "random");
            }
            clearInterval(timer);
            timerElement.innerHTML = "";
            if (callback) callback();
        }
    }, 1000);
}

function getDiscussionTime() {
    let discussionSeconds = 180;
    for (let i = livingPlayers.filter(player => player.isAlive).length; i > 4; i--) {
        discussionSeconds += 45;
    }
    return discussionSeconds;
}
