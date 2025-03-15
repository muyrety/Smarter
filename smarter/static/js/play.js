document.addEventListener("DOMContentLoaded", function() {
    const socket = io("/join");

    socket.on("game_deleted", function() {
        alert("This game has been deleted by the owner");
        window.location.replace("/");
    });
});
