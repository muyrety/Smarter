let token_g;

document.addEventListener("DOMContentLoaded", async function () {
    token_g = await getSessionToken();
    if (!token_g) {
        alert("Something went wrong while contacting the API. Try refreshing the page");
    }

    const otdb_button = document.getElementById("otdb_button");
    const user_button = document.getElementById("user_button");
    otdb_button.addEventListener("click", function () {
        otdb_button.setAttribute("disabled", "");
        user_button.removeAttribute("disabled");
    });

    user_button.addEventListener("click", function () {
        otdb_button.removeAttribute("disabled");
        user_button.setAttribute("disabled", "");
    });

    let otdb_tbl_body = await initOTDBTable();

    document.getElementById("load_questions").addEventListener("click", function () {
        expandOTDBTable(otdb_tbl_body);
    });
});

async function expandOTDBTable(tbl_body) {

    const rate_limit_code = "5"; 
    // Get data from the API
    let questions;
    try {
        const question_response = await fetch("https://opentdb.com/api.php?amount=50&token=" + token_g);
        const questions_json = await question_response.json();
        if (questions_json.response_code != 0)
        {
            throw new Error("Bad response code to question request:" + questions_json.response_code);
        }
        questions = questions_json.results;
    }
    catch (error) {
        if (error.message === "Bad response code to question request:" + rate_limit_code) {
            alert("You have made too many question requests. Please wait at least 5 seconds before loading more questions.");
        }
        console.error(error);
        return tbl_body;
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
        
async function initOTDBTable() {
    let table = document.getElementById("opentdb_table");

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
            throw new Error("Bad response code to token request:" + session.response_code);
        }
        return session.token;
    }
    catch (error) {
        console.error(error);
        return false;
    }
}

