function addUser(name, listName) {
    const list = document.getElementById(listName);
    const newItem = document.createElement("li");
    newItem.className = "list-group-item";
    newItem.textContent = name;
    list.append(newItem);
}

function getPlayerList(listName) {
    let playerList = document.getElementById(listName).children;
    playerList = Array.from(playerList, function(el, idx) {
        return el.textContent.trim();
    });
    playerList.shift();
    return playerList;
}

export { addUser, getPlayerList };
