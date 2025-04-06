import { addUser, getPlayerList, removeUser } from "./modules/list_manip.js";

const listName = "playerList";

document.addEventListener("DOMContentLoaded", async function() {
    const gameID = document.getElementById("gameID").textContent;
    const joinURL = window.location.origin + "/join/" + gameID;
    new QRCode("qrCode", joinURL);

    const socket = io();

    document.getElementById("deleteGame").addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this game?")) {
            socket.emit("delete_game", function() {
                window.location.replace("/");
            });
        }
    });

    document.getElementById("startGame").addEventListener("click", function() {
        socket.emit("start_game", function(url) {
            window.location.replace(url);
        });
    });

    const playerList = getPlayerList(listName);

    socket.on("user_connected", function(data) {
        if (!playerList.includes(data.username)) {
            addUser(data.username, listName);
            playerList.push(data.username);
        }
    });

    socket.on("player_left", function(data) {
        removeUser(data.username, listName);
        const index = playerList.indexOf(data.username);
        if (index > -1) {
            playerList.splice(index, 1);
        }
    });
});
