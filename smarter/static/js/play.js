document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("reconnectAlertDismiss").addEventListener("click", function() {
        document.getElementById("reconnectAlert").classList.add("d-none");
    });

    const socket = io();

    socket.io.on("reconnect", function(n) {
        document.getElementById("reconnectAlert").classList.remove("d-none");
    });

    document.getElementById("leaveGame").addEventListener("click", function() {
        socket.emit("leave_game", function() {
            window.location.replace("/");
        });
    });

    socket.on("game_deleted", function() {
        alert("This game has been deleted by the owner");
        window.location.replace("/");
    });
});
