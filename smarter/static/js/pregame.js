import { addUser, getPlayerList, removeUser } from "./modules/list_manip.js";

const listName = "playerList";

document.addEventListener("DOMContentLoaded", async function() {
    const socket = io();

    document.getElementById("leaveGame").addEventListener("click", function() {
        socket.emit("leave_game", function() {
            window.location.replace("/");
        });
    });

    const playerList = getPlayerList(listName);

    socket.on("user_connected", function(data) {
        if (!playerList.includes(data.username)) {
            addUser(data.username, listName);
            playerList.push(data.username);
        }
    });

    socket.on("game_deleted", function() {
        alert("This game has been deleted by the owner");
        window.location.replace("/");
    });

    socket.on("game_started", function(data) {
        window.location.replace(data.url);
    });

    socket.on("player_left", function(data) {
        removeUser(data.username, listName);
        const index = playerList.indexOf(data.username);
        if (index > -1) {
            playerList.splice(index, 1);
        }
    });
});
