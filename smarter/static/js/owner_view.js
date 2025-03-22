document.addEventListener("DOMContentLoaded", function() {
    const socket = io();

    document.getElementById("deleteGame").addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this game?")) {
            socket.emit("delete_game");
            window.location.replace("/");
        }
    });

    socket.on("player_left", function(data) {
        // NOTE: Update the player list
    });
});
