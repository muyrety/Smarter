document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("reconnectAlertDismiss").addEventListener("click", function() {
        document.getElementById("reconnectAlert").classList.add("d-none");
    });

    document.getElementById("unansweredAlertDismiss").addEventListener("click", function() {
        document.getElementById("unansweredAlert").classList.add("d-none");
    });

    const socket = io();

    let answering = false;
    let hasAnswered = true;
    let gameInProgress = document.getElementById("gameInProgress");

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

    socket.on("answering_started", function(data) {
        answering = true;
        hasAnswered = false;

        // Hide unneeded elements
        if (gameInProgress !== null) {
            gameInProgress.remove();
            gameInProgress = null;
        }
        document.getElementById("nextQuestion").textContent = "";
        document.getElementById("nextQuestionH").classList.add("d-none");
        document.getElementById("waitingButton").classList.add("d-none");
        document.getElementById("answered").classList.add("d-none");

        // Show relavant elements
        document.getElementById("currentQuestion").textContent = data.question;
        document.getElementById("currentQuestionH").classList.remove("d-none");

        // The server guarantees that boolean answers will always display True first
        // False second, so the green button (answer0) will always be True and the red (answer1) False
        for (let i in data.answers) {
            document.getElementById("answer".concat(i)).textContent = data.answers[i];
        }
        if (data.answers.length === 2) {
            document.getElementById("upperRow").classList.remove("d-none");
            document.getElementById("lowerRow").classList.add("d-none");
        }
        else if (data.answers.length === 4) {
            document.getElementById("upperRow").classList.remove("d-none");
            document.getElementById("lowerRow").classList.remove("d-none");
        }
    });

    for (let i = 0; i < 4; ++i) {
        document.getElementById("answer".concat(i)).addEventListener("click", function() {
            if (answering)
                socket.emit("answered", i, function() {
                    hasAnswered = true;
                    document.getElementById("answered").classList.remove("d-none");
                    document.getElementById("waitingButton").classList.remove("d-none");

                    document.getElementById("currentQuestionH").classList.add("d-none");
                    document.getElementById("upperRow").classList.add("d-none");
                    document.getElementById("lowerRow").classList.add("d-none");
                });
        });
    }
    socket.on("answering_ended", function(data) {
        if (data.gameOver) {
            window.location.replace(data.url);
            return;
        }

        answering = false;

        // Hide unneeded elements
        if (gameInProgress !== null) {
            gameInProgress.remove();
            gameInProgress = null;
        }
        document.getElementById("answered").classList.add("d-none");
        document.getElementById("currentQuestion").textContent = "";
        document.getElementById("currentQuestionH").classList.add("d-none");
        document.getElementById("upperRow").classList.add("d-none");
        document.getElementById("lowerRow").classList.add("d-none");
        for (let i = 0; i < 4; ++i) {
            document.getElementById("answer".concat(i)).textContent = "";
        }

        // Show relevant elements
        document.getElementById("currentQuestionNr").textContent = data.currQuestionNr;
        document.getElementById("waitingButton").classList.remove("d-none");
        document.getElementById("nextQuestion").textContent = data.question;
        document.getElementById("nextQuestionH").classList.remove("d-none");
        if (!hasAnswered) {
            document.getElementById("unansweredAlert").classList.remove("d-none");
        }
    });
});
