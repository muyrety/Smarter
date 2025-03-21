import { addUser, getPlayerList } from "./modules/list_manip.js";

document.addEventListener("DOMContentLoaded", async function() {
    const gameID = document.getElementById("gameID").textContent;
    const joinURL = window.location.origin + "/join/" + gameID;
    new QRCode("qrCode", joinURL);

    const socket = io("/join");

    const playerList = getPlayerList("playerList");

    socket.on("user_connected", function(data) {
        if (!playerList.includes(data.username)) {
            addUser(data.username, "playerList");
            playerList.push(data.username);
        }
    });

});
