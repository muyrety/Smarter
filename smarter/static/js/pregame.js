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
});
