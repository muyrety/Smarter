document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("reconnectAlertDismiss").addEventListener("click", function() {
        document.getElementById("reconnectAlert").classList.add("d-none");
    });

    const socket = io();

    socket.io.on("reconnect", function(n) {
        document.getElementById("reconnectAlert").classList.remove("d-none");
    });

    document.getElementById("deleteGame").addEventListener("click", function() {
        socket.emit("delete_game", function() {
            window.location.replace("/");
        });
    });

    document.getElementById("beginAnswering").addEventListener("click", function() {
        socket.emit("load_next_question", function(question) {
            // Very likely that 2+ requests happened
            if (!question)
                return;
            // Reset answered status
            const leaderboard = document.getElementById("leaderboard");
            const rows = leaderboard.getElementsByTagName("tbody")[0].children;
            for (const row of rows) {
                row.getElementsByClassName("answered-data")[0].textContent = "No";
            }

            // Handle question display
            const nextQuestionH = document.getElementById("nextQuestionH");
            const nextQuestion = document.getElementById("nextQuestion");
            const currQuestionH = document.getElementById("currentQuestionH");
            const currQuestion = document.getElementById("currentQuestion");
            nextQuestionH.classList.add("d-none");
            currQuestionH.classList.remove("d-none");
            nextQuestion.textContent = "";
            currQuestion.textContent = question;

            // Change the buttons
            const beginButton = document.getElementById("beginAnswering");
            const stopButton = document.getElementById("endAnswering");
            beginButton.classList.add("d-none");
            stopButton.classList.remove("d-none");

            // Modify the table
            const answeredHeader = document.getElementById("answeredHeader");
            answeredHeader.classList.remove("d-none");
            const answeredFields = document.getElementsByClassName("answered-data");
            for (const field of answeredFields) {
                field.classList.remove("d-none");
            }
        });
    });

    document.getElementById("endAnswering").addEventListener("click", function() {
        socket.emit("stop_answering", function(data) {
            // Very likely that 2+ requests happened
            if (!data)
                return;

            if (data.gameOver) {
                window.location.replace(data.url);
                return;
            }

            // Correct the progress indicator
            const currQuestionNr = document.getElementById("currentQuestionNr");
            currQuestionNr.textContent = data.progressNr;

            // Handle question display
            const nextQuestionH = document.getElementById("nextQuestionH");
            const nextQuestion = document.getElementById("nextQuestion");
            const currQuestionH = document.getElementById("currentQuestionH");
            const currQuestion = document.getElementById("currentQuestion");
            nextQuestionH.classList.remove("d-none");
            currQuestionH.classList.add("d-none");
            nextQuestion.textContent = data.question;
            currQuestion.textContent = "";

            // Change the buttons
            const beginButton = document.getElementById("beginAnswering");
            const stopButton = document.getElementById("endAnswering");
            beginButton.classList.remove("d-none");
            stopButton.classList.add("d-none");

            // Modify the table
            const answeredHeader = document.getElementById("answeredHeader");
            answeredHeader.classList.add("d-none");
            const answeredFields = document.getElementsByClassName("answered-data");
            for (const field of answeredFields) {
                field.classList.add("d-none");
            }
        });
    });

    socket.on("player_left", function(data) {
        removePlayerFromLeaderboard(data.username);
    });

    socket.on("player_answered", function(player, correct) {
        const leaderboard = document.getElementById("leaderboard");
        const rows = leaderboard.getElementsByTagName("tbody")[0].children;

        for (const row of rows) {
            const username = row.getElementsByClassName("username")[0].textContent;
            if (username === player) {
                row.getElementsByClassName("answered-data")[0].textContent = "Yes";
                if (correct) {
                    const pointsEl = row.getElementsByClassName("points")[0];
                    const points = parseInt(pointsEl.textContent);
                    pointsEl.textContent = points + 1;
                    sortLeaderboard()
                }
            }
        }
    });

    function removePlayerFromLeaderboard(username) {
        const tableUsernames = document.getElementsByClassName("username");
        const idx = Array.from(tableUsernames).findIndex(function(el) {
            return el.textContent.trim() === username;
        });
        const rows = document.getElementById("leaderboard")
            .getElementsByTagName("tbody")[0].children;
        rows[idx].remove();
        leaderboardReorder();
    }

    function leaderboardReorder() {
        const leaderboard = document.getElementById("leaderboard");
        const rows = leaderboard.getElementsByTagName("tbody")[0].children;

        for (let i = 0; i < rows.length; ++i) {
            const position = rows[i].getElementsByClassName("position")[0];
            position.textContent = i + 1;
        }
    }

    function sortLeaderboard() {
        const leaderboard = document.getElementById("leaderboard");
        const tblBody = leaderboard.getElementsByTagName("tbody")[0];
        let rows = tblBody.children;
        rows = Array.from(rows);
        rows.sort(function(a, b) {
            let aPoints = parseInt(a.getElementsByClassName("points")[0].textContent);
            let bPoints = parseInt(b.getElementsByClassName("points")[0].textContent);
            return bPoints - aPoints;
        });
        tblBody.replaceChildren(...rows);
        leaderboardReorder();
    }
});
