import { addUser, getPlayerList } from "./modules/list_manip.js";

document.addEventListener("DOMContentLoaded", async function() {
    const gameID = document.getElementById("gameID").textContent;
    const joinURL = window.location.origin + "/join/" + gameID;
    new QRCode("qrCode", joinURL);

    const socket = io();

    document.getElementById("deleteGame").addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this game?")) {
            socket.emit("delete_game");
            window.location.replace("/");
        }
    });

    document.getElementById("startGame").addEventListener("click", function() {
        socket.emit("start_game");
    });

    const playerList = getPlayerList("playerList");

    socket.on("user_connected", function(data) {
        if (!playerList.includes(data.username)) {
            addUser(data.username, "playerList");
            playerList.push(data.username);
        }
    });

    socket.on("game_started", function(data) {
        window.location.replace(data.url);
    });
});
