document.addEventListener("DOMContentLoaded", function() {
    const socket = io();

    document.getElementById("deleteGame").addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this game?")) {
            socket.emit("delete_game", function() {
                window.location.replace("/");
            });
        }
    });

    document.getElementById("beginAnswering").addEventListener("click", function() {
        socket.emit("load_next_question", function() {
            // Handle question display
            const nextQuestionH = document.getElementById("nextQuestionH");
            const nextQuestion = document.getElementById("nextQuestion");
            const currQuestionH = document.getElementById("currentQuestionH");
            const currQuestion = document.getElementById("currentQuestion");
            nextQuestionH.classList.add("d-none");
            currQuestionH.classList.remove("d-none");
            currQuestion.textContent = nextQuestion.textContent;

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
        socket.emit("stop_answering", function(progressNr, question) {
            // Correct the progress indicator
            const currQuestionNr = document.getElementById("currentQuestionNr");
            currQuestionNr.textContent = progressNr;

            // Handle question display
            const nextQuestionH = document.getElementById("nextQuestionH");
            const nextQuestion = document.getElementById("nextQuestion");
            const currQuestionH = document.getElementById("currentQuestionH");
            nextQuestionH.classList.remove("d-none");
            currQuestionH.classList.add("d-none");
            nextQuestion.textContent = question;

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
