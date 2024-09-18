var token_g;

document.addEventListener("DOMContentLoaded", async function () {
    token_g = await getSessionToken();

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

    let tbl_body = await initQuestionTable();

    document.getElementById("load_questions").addEventListener("click", function () {
        expandTable(tbl_body);
    });
});

async function expandTable(tbl_body) {

    // Get data from the API
    try {
        const question_response = await fetch("https://opentdb.com/api.php?amount=50&token=" + token_g);
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

    // Add data to the table
    for (let i of questions) {
        const row = document.createElement("tr");
        for (let j of ["category", "difficulty", "question"]) {
            const data = document.createElement("td");
            data.innerHTML = i[j];
            row.appendChild(data);
        }
        tbl_body.appendChild(row);
    }
    return tbl_body;
}
        
async function initQuestionTable() {
    let table = document.getElementById("table");

    // Create table header
    const tbl_head = document.createElement("thead");
    const head_row = document.createElement("tr");
    for (let i of ["Category", "Difficulty", "Question"]) {
        const column = document.createElement("th");
        column.appendChild(document.createTextNode(i));
        column.setAttribute("scope", "col");
        head_row.appendChild(column);
    }
    tbl_head.appendChild(head_row);
    table.appendChild(tbl_head);

    let tbl_body = await expandTable(document.createElement("tbody"));
    table.appendChild(tbl_body);
    return tbl_body;
}

async function getSessionToken() {
    
    // Get session token from the API
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

