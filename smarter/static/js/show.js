import { addUser, getPlayerList, removeUser } from "./modules/list_manip.js";

const listName = "playerList";

document.addEventListener("DOMContentLoaded", async function() {
    const gameID = document.getElementById("gameID").textContent;
    const joinURL = window.location.origin + "/join/" + gameID;
    new QRCode("qrCode", {
        text: joinURL,
        colorLight: "#cff4fc",
        colorDark: "#052c65"
    });

    document.getElementById("reconnectAlertDismiss").addEventListener("click", function() {
        document.getElementById("reconnectAlert").classList.add("d-none");
    });

    const socket = io();

    socket.io.on("reconnect", function(n) {
        document.getElementById("reconnectAlert").classList.remove("d-none");
    });

    document.getElementById("errorAlertDismiss").addEventListener("click", function() {
        document.getElementById("errorAlert").classList.add("d-none");
    });

    document.getElementById("deleteGame").addEventListener("click", function() {
        socket.emit("delete_game", function() {
            window.location.replace("/");
        });
    });

    document.getElementById("startGame").addEventListener("click", function() {
        socket.emit("start_game", function(data) {
            if (data.ok) {
                window.location.replace(data.url);
            }
            else {
                const errorMessage = document.getElementById("errorMessage");
                errorMessage.textContent = data.error;

                const errorAlert = document.getElementById("errorAlert");
                errorAlert.classList.remove("d-none");
            }
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
