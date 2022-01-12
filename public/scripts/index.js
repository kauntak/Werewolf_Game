let ID = "";
let userName = "";
var createdRoom = false;
var currentRoom = "";
var currentRole = "";
var roomSize = 0;
var socket = io();
var justJoined = false;
let players = [];
let teamMembers = [];
let gameStarted = false;
let isAlive = true;
let isAwakened = false;
let currentRound = "";
let allVoted = false;
let voteOptions;
let previousPseudoVote = null;
let currentPseudoVote = null;
let voted = false;
let timerStarted = false;

var selectedLanguage = document.getElementById("selected-language");
var languageList = ["en", "ja"];
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

function changeHTML(id, innerHTML, option, language) {
    if (!language) {
        language = {};
    }
    for (let i in languageList) {
        if (!language[languageList[i]]) language[languageList[i]] = innerHTML;
        if (!option) {
            document.getElementById(id + "-" + languageList[i]).innerHTML =
                language[languageList[i]];
        } else {
            document.getElementById(id + "-" + languageList[i]).option =
                language[languageList[i]];
        }
    }
}
function addHTML(id, innerHTML, language) {
    if (!language) {
        language = {};
    }
    for (let i in languageList) {
        if (!language[languageList[i]]) language[languageList[i]] = innerHTML;
        document.getElementById(id + "-" + languageList[i]).innerHTML +=
            language[languageList[i]];
    }
}

function addToRoomList(data) {
    let roomHtml1 = `<input label="${data.roomSize}`;
    let roomHtml2 = `${data.roomName}" type="radio" name="radio-roomName" class="radio-roomName ${data.roomName}" value="${data.roomName}" required><br/>`;

    addHTML("room-list-content", undefined, {
        en: roomHtml1 + " players - " + roomHtml2,
        ja: roomHtml1 + "人 - " + roomHtml2,
    });
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

socket.on("initiate", (data) => {
    ID = data.id;
    for (let i in data.rooms) {
        addToRoomList(data.rooms[i]);
    }
});

let helpModal = document.getElementById("help-modal");
function openHelp() {
    helpModal.style.display = "block";
}
document.getElementById("help-close").onclick = () => {
    helpModal.style.display = "none";
};
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
        let startButtons = document.getElementsByClassName("start-button");
        for (let i = 0; i < startButtons.length; i++) {
            startButtons[i].style.display = "inline-block";
        }
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
    } else if (event.target == helpModal) {
        helpModal.style.display = "none";
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
        name: userName,
        roomName: currentRoom,
    });
    document.getElementById("message-text").value = "";
}

socket.on("chat message", (data) => {
    displayMessage(data);
});

let lastReadMessage = null;
function displayMessage(data) {
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
function clearMessages() {
    let messages = document.getElementById("messages");
    messages.innerHTML = "";
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
        <p class="message-sender">${data.name}</p>
        <p class="message-content">${data.message}</p>
        <p class="message-time">${moment().format("hh:mm")}</p>`;
    return div;
}

function createSystemMessageDiv(data, div) {
    div.className = "system-message";
    let innerHTML = "";
    switch (data.event) {
        case "joined":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${data.name} has joined.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }が部屋に入りました</p>`;
            break;
        case "left":
            innerHTML = `
                <p class="language en" ${getLanguageDisplayStyle("en")}>${
                data.name
            } has left.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }が夕日に向かって去りました。</p>`;
            break;
        case "start":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>Let the hunt begin!!</p>
                <p class="language ja" ${getLanguageDisplayStyle(
                    "ja"
                )}>ゲームが始まりました。</p>`;
            break;
        case "knight true":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>You valiantly protected ${data.name}!!</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }を守り切った！!</p>`;
            break;
        case "knight false":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>You protected the wrong person...</p>
                <p class="language ja" ${getLanguageDisplayStyle(
                    "ja"
                )}>違う人を守ってたら。。。</p>`;
            break;
        case "summon":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${data.name} was a ${data.result ? "werewolf" : "human"}.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }は ${data.result ? "人狼" : "人間"}でした。</p>`;
            break;
        case "prophecy":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${data.name} is a ${data.result ? "werewolf" : "human"}</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }は ${data.result ? "人狼" : "人間"}です！</p>`;
            break;
        case "werewolf attack":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${data.name} was mauled to death by werewolves...</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }は人狼に食い殺されました。。。</p>`;
            break;
        case "died":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>You have died.</p>
                <p class="language ja" ${getLanguageDisplayStyle(
                    "ja"
                )}>死にました。</p>`;
            break;
        case "werewolf fail":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>Dawn came with no casualties.</p>
                <p class="language ja" ${getLanguageDisplayStyle(
                    "ja"
                )}>夜は誰も亡くならず静かに夜が明けました。</p>`;
            break;
        case "you betrayed":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>You have joined the werewolves.</p>
                <p class="language ja" ${getLanguageDisplayStyle(
                    "ja"
                )}>人狼と接触し手を組んだ。</p>`;
            break;
        case "betrayal":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${data.name} has decided to join you.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }は人狼の一味になった。</p>`;
            break;
        case "hang":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${data.name} has been hanged.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.name
            }は処刑されました。</p>`;
            break;
        case "win":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${
                data.side == "werewolf" ? "Team Werewolves" : "The villagers"
            } have won.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.side == "werewolf" ? "人狼側" : "村人側"
            }の勝ちです</p>`;
            break;
        case "lose":
            innerHTML = `<p class="language en" ${getLanguageDisplayStyle(
                "en"
            )}>${
                data.side == "werewolf" ? "Team Werewolves" : "The villagers"
            } have lost.</p>
                <p class="language ja" ${getLanguageDisplayStyle("ja")}>${
                data.side == "werewolf" ? "人狼側" : "村人側"
            }の負けです。</p>`;
            break;
    }
    div.innerHTML = innerHTML;
    return div;
}
function getLanguageDisplayStyle(language) {
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
    socket.emit("leave room", {
        roomName: currentRoom,
        name: userName,
        id: ID,
    });
    currentRoom = "";
    updateCurrentRoomSize(0);
    cancelLeaveLobby();
    clearMessages();
    slidePanel("room", true);
}
socket.on("leave room", (data) => {
    if (gameStarted) {
        updateLivingPlayers(data.id);
    }
    displayMessage({ id: null, event: "left", name: data.name });
});

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

let leaveGameQuestionModal = document.getElementById("leave-game-modal");
function leaveGameQuestion() {
    leaveGameQuestionModal.style.display = "block";
}
function cancelLeaveGame() {
    leaveGameQuestionModal.style.display = "none";
}
function leaveGame() {
    socket.emit("leave room", {
        id: ID,
        name: userName,
        roomName: currentRoom,
    });
    currentRoom = "";
    gameStarted = false;
    isAlive = true;
    isAwakened = false;
    teamMembers = [];
    players = [];
    currentRound = "";
    currentRole = "";
    document.getElementById("leave-game-button").style.display = "";
    updateCurrentRoomSize(0);
    cancelLeaveGame();
    clearMessages();
    slidePanel("game-lobby", true);
    slidePanel("room", true);
}
socket.on("your game started", (data) => {
    updateRole(data.role);
    gameStarted = true;
    isAlive = true;
    createPlayerList(data.players);
    updateTeamMembers(data.teamMembers);
    slidePanel("game-lobby");
});

function createPlayerList(newPlayers) {
    players = newPlayers;
    let playersDiv = document.getElementById("players-list");
    playersDiv.innerHTML = "";
    for (let i in players) {
        playersDiv.innerHTML += `
            <p id="player-${players[i].id}" class="player-list">${players[i].name}</p>`;
    }
}

function updateTeamMembers(newTeam) {
    teamMembers = newTeam;
    let teamDiv = document.getElementById("team-members");
    teamDiv.innerHTML = "";
    for (let i in teamMembers) {
        let player = players.find((player) => player.id == teamMembers[i]);
        teamDiv.innerHTML += `
        <p id="team-${teamMembers[i]}" class="team-member${
            player.isAlive ? "" : " dead"
        }">${player.name}</p>`;
    }
}

function updateRole(role) {
    currentRole = role;
    updateRoleImage(role);
}
function updateRoleImage(role) {
    let roleImage = document.getElementById("role-image");
    roleImage.innerHTML = `<img src="./images/${role}.png" alt="${role} card">`;
}
socket.on("game started", (data) => {
    removeFromRoomList(data);
});
let audio = document.getElementById("round-audio");
function mute(){
    let muteButton = document.getElementById("mute-button");
    audio.muted = !audio.muted;
    if(audio.muted){
        muteButton.innerHTML = `<i class="fas fa-volume-mute"></i>`;
    } else {
        muteButton.innerHTML = `<i class="fas fa-volume-up"></i>`;
    }
}
socket.on("round start", (data) => {
    currentRound = data.roundType;
    audio.src = `./media/${currentRound}`;
    audio.play();
    voted = false;
    allVoted = false;
    document.getElementById("vote-options-container").innerHTML = "";
    createVoteOptions();
    setCountDownTime(data.time);
});

function createVoteOptions() {
    let voteList = getVoteList();
    currentPseudoVote = null;
    previousPseudoVote = null;
    updateVoteTitle();
    buildVoteRadioButtons(voteList);
}

function getVoteList() {
    let playerVoteList = players.filter((player) => player.isAlive);
    return playerVoteList;
}
function updateVoteTitle(title) {
    if (!title) {
        title = getVoteTitle();
    }
    changeHTML("vote-title", undefined, undefined, title);
}
function getVoteTitle() {
    if (currentRound == "day") {
        return { en: "Discussion Time", ja: "人狼あぶり出し会議" };
    }
    if (currentRound == "evening") {
        if (isAlive)
            return {
                en: "Who will be hanged?",
                ja: "誰を処刑台に送りますか？",
            };
        else
            return {
                en: "Who do you think will be hanged?",
                ja: "誰が処刑台に送られると思いますか？",
            };
    }
    let title = {};
    let pseudoRole = currentRole;
    if (!isAwakened && pseudoRole == "traitor") pseudoRole = "villager";
    switch (pseudoRole) {
        case "traitor":
        case "werewolf":
            title = {
                en: "Who will you attack tonight?",
                ja: "今夜は誰を襲いますか？",
            };
            if (isAlive) break;
        case "prophet":
            title = {
                en: "Who will you prophesize tonight?",
                ja: "今夜は誰を占いますか？",
            };
            if (isAlive) break;
        case "shaman":
        default:
            title = {
                en: "Who do you think will be attacked tonight?",
                ja: "今夜は誰が襲われると思いますか？",
            };
            break;
    }
    return title;
}
function buildVoteRadioButtons(list) {
    let voteContainer = document.getElementById("vote-options-container");
    voteContainer.innerHTML = "";
    if (currentRound == "day") {
        updateVoteButtonSettings(true, false);
        return;
    }
    for (let i in list) {
        voteContainer.innerHTML += `
        <div class="vote-group">
            <input id="vote-${
                list[i].id
            }" name="radio-vote" type="radio" class="radio-vote" required onchange="changeVote(event)"${voteIsDisabled(
            list[i].id,
            list[i].name
        )}>
            <label for="vote-${list[i].id}" id="vote-label-${list[i].id}">${
            list[i].name
        }</label>
        </div>`;
    }
    voted = false;
    updateVoteButtonSettings(false, true);
}
function voteIsDisabled(id, name) {
    const index = teamMembers.includes(id);
    console.log(name, index);
    if (teamMembers.includes(id)) return " disabled";
    return "";
}
function changeVote(event) {
    console.log("vote selected", event);
    if (voted) return;
    previousPseudoVote = currentPseudoVote;
    currentPseudoVote = event.currentTarget.id.substr(5);
    vote(true);
}
let voteButtons = document.getElementsByClassName("vote-button");
function voteButtonClicked() {
    if (currentPseudoVote == null) return;
    vote();
    voted = true;
    updateVoteButtonSettings(true);
}
function vote(isPseudoVote) {
    if (currentRound == "day") return;
    let shareRole;
    let target;
    if (isAlive) {
        if (currentRound == "evening") {
            shareRole = "villager";
            target = currentRoom;
        } else {
            if (
                currentRole == "werewolf" ||
                currentRole == "knight" ||
                currentRole == "prophet"
            ) {
                shareRole = currentRole;
                target = currentRole;
            } else if (currentRole == "traitor" && isAwakened) {
                shareRole = "werewolf";
                target = shareRole;
            } else {
                shareRole = "villagerSide";
                target = "villagerSide";
            }
        }
    } else {
        shareRole = "dead";
        target = "dead";
    }
    let ballot = {
        roomName: currentRoom,
        target: target,
        role: shareRole,
        id: ID,
        roomName: currentRoom,
        timerStarted: timerStarted,
    };
    if (isPseudoVote) {
        ballot.pseudoVote = currentPseudoVote;
        ballot.previousPseudoVote = previousPseudoVote;
    } else {
        ballot.vote = currentPseudoVote;
        ballot.pseudoVote = currentPseudoVote;
    }
    socket.emit("vote", ballot);
}
function updateVoteButtonSettings(isDisabled, isDisplayed) {
    for (let j = 0; j < voteButtons.length; j++) {
        if (isDisabled != undefined) {
            voteButtons[j].disabled = isDisabled;
        }
        if (isDisplayed === true) {
            voteButtons[j].style.display = "";
        } else if (isDisplayed === false) {
            voteButtons[j].style.display = "none";
        }
    }
}
socket.on("update vote", (data) => {
    console.log("update Vote", data);
    if (data.target == currentRoom && !isAlive) return;
    for (let i in data.voteData) {
        let label = document.getElementById(
            `vote-label-${data.voteData[i].id}`
        );
        let name = label.innerText;
        let checks = "";
        for (let j = 0; j < data.voteData[i].votes.vote; j++) {
            checks += `<i class="fas fa-check vote-checkmark"></i>`;
        }
        for (let j = 0; j < data.voteData[i].votes.pseudoVote; j++) {
            checks += `<i class="fas fa-check pseudo-checkmark">`;
        }
        label.innerHTML = name + checks;
    }
});
socket.on("all voted", () => {
    allVoted = true;
});
function setCountDownTime(countDownTime) {
    let timerElement = document.getElementById("count-down");
    timerElement.style.color = "";
    let timer = setInterval(() => {
        timerStarted = true;
        let now = new Date().getTime();
        let difference = countDownTime - now;
        let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((difference % (1000 * 60)) / 1000);
        let displayTime = "";
        if (minutes > 0) {
            displayTime += `${minutes}:`;
        }
        if (seconds < 10) {
            if (minutes != 0) displayTime += "0";
            else timerElement.style.color = "red";
        }
        if (seconds >= 0) {
            displayTime += seconds;
        }
        timerElement.innerHTML = displayTime;
        timerElement.style.visibility = "";
        if (difference <= 0 || allVoted) {
            clearInterval(timer);
            updateVoteButtonSettings(true);
            timerStarted = false;
            setTimeout(() => {
                timerElement.style.visibility = "none";
            }, 1000);
            if (currentRound == "day") return;
            if (!allVoted && !voted) {
                voted = true;
                currentPseudoVote = autoSelectVote();
                vote();
            }
        }
    }, 1000);
}

function autoSelectVote() {
    if (currentPseudoVote != null) return currentPseudoVote;
    let voteContainer = document.getElementById("vote-options-container");
    let ids = [];
    for (let i = 0; i < voteContainer.children.length; i++) {
        let id = voteContainer.children[i].children[0].id.substring(5);
        if (teamMembers.includes(id)) continue;
        ids.push(id);
    }
    let random = Math.floor(Math.random() * ids.length);
    return ids[random];
}
socket.on("vote result", (data) => {
    console.log("vote result", data);
    if (currentRole == "knight") {
        displayMessage({
            id: null,
            event: "knight " + data.result,
            name: data.name,
        });
    } else if (currentRole == "prophet") {
        displayMessage({
            id: null,
            event: "prophecy",
            result: data.result,
            name: data.name,
        });
    } else if (currentRole == "shaman") {
        if (data.result != null)
            displayMessage({
                id: null,
                event: "summon",
                result: data.result,
                name: data.name,
            });
    }
});

socket.on("kill result", (data) => {
    console.log("kill result:", data);
    if (data.id == null) {
        displayMessage({ id: null, event: "werewolf fail" });
        return;
    }
    updateLivingPlayers(data.id);
    if (data.id == ID) {
        isAlive = false;
        if (currentRound != "evening") {
            let clawMarks = document.getElementById("claw-marks-container");
            clawMarks.style.display = "flex";
            setTimeout(() => {
                clawMarks.style.display = "";
            }, 1000);
        }
        displayMessage({ id: null, event: "died" });
        updateRoleImage("dead");
    } else if (currentRound == "evening") {
        displayMessage({ id: null, event: "hang", name: data.name });
    } else {
        displayMessage({ id: null, event: "werewolf attack", name: data.name });
    }
});
function updateLivingPlayers(id) {
    let playerDiv = document.getElementById("player-" + id);
    playerDiv.className += " dead";
    let teamDiv = document.getElementById("team-" + id);
    if (teamDiv) {
        teamDiv.className += " dead";
    }
    let playerIndex = players.findIndex((player) => player.id == id);
    if (playerIndex != -1) players[playerIndex].isAlive = false;
}
socket.on("awakened", (data) => {
    console.log(data);
    if (data.id == ID) {
        isAwakened = true;
        displayMessage({ id: null, event: "you betrayed" });
    } else {
        displayMessage({ id: null, event: "betrayal", name: data.name });
    }
    updateTeamMembers(data.teamMembers);
});

socket.on("werewolves win", () => {
    finishGame();
    if (currentRole == "werewolf" || currentRole == "traitor") {
        displayMessage({ id: null, event: "win", side: "werewolf" });
        updateVoteTitle({
            en: "Your team has eliminated all the villagers.",
            ja: "人狼側は村人を皆皆殺しにしました!",
        });
    } else {
        displayMessage({ id: null, event: "lose", side: "human" });
        updateVoteTitle({
            en: "Your team has been all slaughtered.",
            ja: "村人達は皆殺されました。",
        });
    }
});

socket.on("humans win", () => {
    finishGame();
    if (currentRole == "werewolf" || currentRole == "traitor") {
        updateVoteTitle({
            en: "Your team has been all hanged.",
            ja: "人狼側は全滅しました。",
        });
        displayMessage({ id: null, event: "lose", side: "werewolf" });
    } else {
        displayMessage({ id: null, event: "win", side: "human" });
        updateVoteTitle({
            en: "You have hanged all the werewolves.",
            ja: "人狼達を皆処刑できました！",
        });
    }
});

function finishGame() {
    updateVoteButtonSettings(true, false);
    document.getElementById("leave-game-button").style.display = "block";
    gameStarted = false;
}
