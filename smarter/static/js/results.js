document.addEventListener("DOMContentLoaded", function() {
    const socket = io();
    document.getElementById("leaveGame").addEventListener("click", function() {
        socket.emit("leave_game", function() {
            window.location.replace("/");
        });
    });

    socket.on("game_deleted", function() {
        document.getElementById("gameDeletedAlert").classList.remove("d-none");
    });
});
