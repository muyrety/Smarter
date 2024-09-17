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
    let table = document.getElementById("table");
    /*
    table.innerHTML = `<thead><tr><th scope="col">Category</th>
                                  <th scope="col">Difficulty</th>
                                  <th scope="col">Question</th></tr></thead><tbody>`;
    for (let i of questions) {
        table.innerHTML += `<tr><td>${i["category"]}</td>
                                <td>${i["difficulty"]}</td>
                                <td>${i["question"]}</td></tr>`;
    }
    table.innerHTML += "</tbody>";
    */
    const table_head = table.createTHead();
    const row = table_head.insertRow();

    let category = row.insertCell().innerHTML = "Category";
    let difficulty = row.insertCell().innerHTML = "Difficulty";
    let question = row.insertCell().innerHTML = "Question";


    for (let i of questions)
    {
        const row = table.insertRow();

        row.insertCell().innerHTML = i["category"];
        row.insertCell().innerHTML = i["difficulty"];
        row.insertCell().innerHTML = i["question"];
    }
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

