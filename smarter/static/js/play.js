document.addEventListener("DOMContentLoaded", function() {
    const socket = io();

    socket.on("game_deleted", function() {
        alert("This game has been deleted by the owner");
        window.location.replace("/");
    });
});
