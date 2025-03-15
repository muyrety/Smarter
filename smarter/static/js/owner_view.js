document.addEventListener("DOMContentLoaded", function() {
    const socket = io("/join");

    document.getElementById("deleteGame").addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this game?")) {
            socket.emit("delete_game");
            window.location.replace("/");
        }
    });
});
