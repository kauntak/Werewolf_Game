module.exports = {
    assignRoles,
    getCountDownTime,
    processVotes,
    getNextRound,
    checkIfFinished,
};

var rolesCount = {
    4: { werewolf: 1, villager: 2, prophet: 1 },
    5: { werewolf: 1, villager: 2, prophet: 1, traitor: 1 },
    6: { werewolf: 2, villager: 2, prophet: 1, knight: 1 },
    7: { werewolf: 2, villager: 2, prophet: 1, knight: 1, traitor: 1 },
    8: {
        werewolf: 2,
        villager: 2,
        prophet: 1,
        knight: 1,
        traitor: 1,
        shaman: 1,
    },
    9: {
        werewolf: 2,
        villager: 3,
        prophet: 1,
        knight: 1,
        traitor: 1,
        shaman: 1,
    },
    10: {
        werewolf: 2,
        villager: 3,
        prophet: 1,
        knight: 1,
        traitor: 2,
        shaman: 1,
    },
    11: {
        werewolf: 2,
        villager: 4,
        prophet: 1,
        knight: 1,
        traitor: 2,
        shaman: 1,
    },
    12: {
        werewolf: 3,
        villager: 4,
        prophet: 1,
        knight: 1,
        traitor: 2,
        shaman: 1,
    },
    13: {
        werewolf: 3,
        villager: 5,
        prophet: 1,
        knight: 1,
        traitor: 2,
        shaman: 1,
    },
    14: {
        werewolf: 3,
        villager: 6,
        prophet: 1,
        knight: 1,
        traitor: 2,
        shaman: 1,
    },
    15: {
        werewolf: 4,
        villager: 6,
        prophet: 1,
        knight: 1,
        traitor: 2,
        shaman: 1,
    },
};

/**
 * TODO: SETTINGS: Change discussion time
 * TODO: SETTINGS: change role counts
 * TODO: SETTINGS: Set whether first round is day or night
 * TODO: SETTINGS: If first round is night werewolf attack or not
 * TODO: SETTINGS: If first round is night is there is a prophecy or not, OR one random villager will know one random other villager
 * TODO: SETTINGS: Vote view style: Don't see other player's votes, see others' votes, see others' votes AND names
 * TODO: SETTINGS: Evening Vote tie breaker: no hanging, re-vote on tied players, select random
 * TODO: Lobby, japanese rooms not updating
 * TODO: Game end, return to lobby, intead of room selection
 */

const roundTypes = ["day", "evening", "night"];
const voteTime = 20;

function assignRoles(players) {
    var roles = getRoles(players.length);
    for (let i in players) {
        players[i].role = getRandomRole(roles);
    }
}

function getRoles(count) {
    let roles;
    if (count <= 15) {
        roles = rolesCount[count];
    } else {
        roles = rolesCount[15];
        let rolesLeft = count - 15;
        while (rolesLeft > 0) {
            let roleSum = rolesSum(roles);
            if (rolesSide.citizenSide - roleSum.wolfSide == 2) {
                roles.werewolf++;
            } else {
                roles.villager++;
            }
            rolesLeft--;
        }
    }
    let rolesList = [];
    for (let i in roles) {
        for (let j = 0; j < roles[i]; j++) {
            rolesList.push(i);
        }
    }
    return rolesList;
}
function rolesSum(roles) {
    return {
        wolfSide: roles.werewolf + roles.traitor,
        citizenSide:
            roles.villager + roles.prophet + roles.knight + roles.shaman,
    };
}

function getRandomRole(roles) {
    let index = Math.floor(Math.random() * roles.length);
    return roles.splice(index, 1)[0];
}

function processVotes(votes, players) {
    if (votes["knight"]) {
        if (votes["knight"] == votes["werewolf"]) {
            votes["werewolf"] = null;
            votes["knight"] = { result: true, id: votes["knight"] };
        } else {
            votes["knight"] = { result: false, id: votes["knight"] };
        }
    }
    if (votes["werewolf"]) {
        let index = players.findIndex(
            (player) => player.id == votes["werewolf"]
        );
        if (players[index].role == "traitor") {
            votes["traitor"] = votes["werewolf"];
            votes["werewolf"] = null;
        }
    }
    for (let i in votes) {
        if (votes[i] == null) {
            votes[i] = { id: null, name: null };
            continue;
        }
        let playerIndex = players.findIndex((player) => {
            if (votes[i].id) return player.id == votes[i].id;
            return player.id == votes[i];
        });
        let name = players[playerIndex].name;
        if (i == "prophet") {
            votes[i] = {
                result: players[playerIndex].role == "werewolf",
                name: name,
            };
        } else if (i == "knight") {
            votes[i].name = name;
        } else {
            votes[i] = { id: votes[i], name: name };
        }
    }
    console.log("votes", votes);
    return votes;
}

function getCountDownTime(round, playerCount) {
    let countDownTime = new Date();
    if (round == "day") {
        countDownTime.setSeconds(
            countDownTime.getSeconds() + getDiscussionTime(playerCount)
        );
    } else {
        countDownTime.setSeconds(countDownTime.getSeconds() + voteTime);
    }
    countDownTime = countDownTime.getTime();
    return countDownTime;
}

function getDiscussionTime(playerCount) {
    let discussionSeconds = 180;
    for (let i = playerCount; i > 4; i--) {
        discussionSeconds += 45;
    }
    return 10;
    return discussionSeconds;
}

function getNextRound(currentRound) {
    if (!currentRound) return "day";
    let index = roundTypes.findIndex((round) => round == currentRound);
    index++;
    if (index == roundTypes.length) index = 0;
    return roundTypes[index];
}

function checkIfFinished(players) {
    let wolfSide = players.filter((player) => player.role == "werewolf");
    if (wolfSide.length == 0) {
        return { isFinished: true, humansWin: true };
    } else if (players.length - wolfSide.length <= wolfSide.length) {
        return { isFinished: true, humansWin: false };
    } else {
        return { isFinished: false };
    }
}
