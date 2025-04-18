document.addEventListener("DOMContentLoaded", function() {
    const socket = io();
    document.getElementById("deleteGame").addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this game?")) {
            socket.emit("delete_game", function() {
                window.location.replace("/");
            });
        }
    });
});
