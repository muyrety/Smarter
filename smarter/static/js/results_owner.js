document.addEventListener("DOMContentLoaded", function() {
    const socket = io();
    document.getElementById("deleteGame").addEventListener("click", function() {
        socket.emit("delete_game", function() {
            window.location.replace("/");
        });
    });
});
