import { addUser, getPlayerList } from "./modules/list_manip.js";

document.addEventListener("DOMContentLoaded", async function() {
    const socket = io("/join");

    const playerList = getPlayerList("playerList");

    socket.on("user_connected", function(data) {
        if (!playerList.includes(data.username)) {
            addUser(data.username, "playerList");
            playerList.push(data.username);
        }
    });

    socket.on("game_deleted", function() {
        alert("This game has been deleted by the owner");
        window.location.replace("/");
    });
});
