document.addEventListener("DOMContentLoaded", async function () {
    const token = await  getSessionToken();

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

    loadQuestions(token);
});

async function loadQuestions(token) {
    try {
        const question_response = await fetch("https://opentdb.com/api.php?amount=50&token=" + token);
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

    // Create a table with the data from the API
    let table = document.getElementById("table");

    const tbl_head = document.createElement("thead");
    const head_row = document.createElement("tr");

    const headers = ["Category", "Difficulty", "Question"];
    for (let i of headers) {
        const column = document.createElement("th");
        column.appendChild(document.createTextNode(i));
        column.setAttribute("scope", "col");
        head_row.appendChild(column);
    }
    tbl_head.appendChild(head_row);
    table.appendChild(tbl_head);

    const tbl_body = document.createElement("tbody");
    const response_keys = ["category", "difficulty", "question"];
    for (let i of questions) {
        const row = document.createElement("tr");
        for (let j of response_keys) {
            const data = document.createElement("td");
            data.innerHTML = i[j];
            row.appendChild(data);
        }
        tbl_body.appendChild(row);
    }
    table.appendChild(tbl_body);
}

async function getSessionToken() {
    try {
        const session_response = await fetch("https://opentdb.com/api_token.php?command=request");
        const session = await session_response.json();
        if (session.response_code != 0)
        {
            throw new Error("Bad response code:" + session.response_code);
        }
        return session.token;
    }
    catch (error) {
        console.error(error);
    }
}

