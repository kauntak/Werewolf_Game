module.exports = {assignRoles};

var rolesCount = {
    4:{werewolf:1, villager:2, prophet:1},
    5:{werewolf:1, villager:3, prophet:1},
    6:{werewolf:2, villager:2, prophet:1, knight:1},
    7:{werewolf:2, villager:3, prophet:1, knight:1},
    8:{werewolf:2, villager:3, prophet:1, knight:1, traitor:1},
    9:{werewolf:2, villager:3, prophet:1, knight:1, traitor:1, shaman:1},
    10:{werewolf:2, villager:4, prophet:1, knight:1, traitor:1, shaman:1},
    11:{werewolf:3, villager:4, prophet:1, knight:1, traitor:1, shaman:1},
    12:{werewolf:3, villager:5, prophet:1, knight:1, traitor:1, shaman:1},
    13:{werewolf:3, villager:5, prophet:1, knight:1, traitor:2, shaman:1},
    14:{werewolf:3, villager:6, prophet:1, knight:1, traitor:2, shaman:1},
    15:{werewolf:4, villager:6, prophet:1, knight:1, traitor:2, shaman:1}
}


function assignRoles(players){
    var roles = getRoles(players.length);
    for(let i in players){
        players[i].role = getRandomRole(roles);
    }
}

function getRoles(count){
    let roles;
    if(count <= 15){
        roles = rolesCount[count];
    } else{
        roles = rolesCount[15];
        let rolesLeft = count - 15;
        while(rolesLeft > 0){
            let roleSum = rolesSum(roles);
            if(rolesSide.citizenSide - roleSum.wolfSide == 2){
                roles.werewolf++;
            } else {
                roles.villager++;
            }
            rolesLeft--;
        }
    }
    let rolesList = [];
    for(let i in roles){
        for(let j = 0; j < roles[i]; j++){
            rolesList.push(i);
        }
    }
    return rolesList;
}
function rolesSum(roles){
    return {wolfSide:(roles.werewolf + roles.traitor),  citizenSide:(roles.villager + roles.prophet + roles.knight + roles.shaman)};
}

function getRandomRole(roles){
    let index = Math.floor(Math.random() * roles.length);
    return roles.splice(index, 1)[0];
}

