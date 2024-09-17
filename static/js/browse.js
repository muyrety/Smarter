document.addEventListener("DOMContentLoaded", function () {
    const db_button = document.getElementById("db_button");
    const user_button = document.getElementById("user_button");
    db_button.addEventListener("click", function () {
        db_button.setAttribute("disabled", "");
        user_button.removeAttribute("disabled");
    });

    user_button.addEventListener("click", function () {
        db_button.removeAttribute("disabled");
        user_button.setAttribute("disabled", "");
    });

    loadQuestions();
});

async function loadQuestions() {
    try {
        const session_response = await fetch("https://opentdb.com/api_token.php?command=request");
        var session = await session_response.json();
        if (session.response_code != 0)
        {
            throw new Error("Bad response code:" + session.response_code);
        }
    }
    catch (error) {
        console.error(error);
    }

    try {
        const question_response = await fetch("https://opentdb.com/api.php?amount=50&token=" + session.token);
        const questions_json = await question_response.json();
        if (questions_json.response_code != 0)
        {
            throw new Error("Bad response code:" + questions_json.response_code);
        }
        var questions = questions_json.results;
    }
    catch (error) {
        console.error(error);
    }
}
