function addUser(name, listName) {
    const list = document.getElementById(listName);
    const newItem = document.createElement("li");
    newItem.className = "list-group-item list-group-item-info text-success border-success-subtle";
    newItem.textContent = name;
    list.append(newItem);
}

function removeUser(name, listName) {
    const list = document.getElementById(listName);
    for (const item of list.children) {
        if (item.textContent.trim() === name) {
            item.remove();
        }
    }
}

function getPlayerList(listName) {
    let playerList = document.getElementById(listName).children;
    playerList = Array.from(playerList, function(el, idx) {
        return el.textContent.trim();
    });
    playerList.shift();
    return playerList;
}

export { addUser, getPlayerList, removeUser };
