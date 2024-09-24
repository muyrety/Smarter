document.addEventListener("DOMContentLoaded", async function () {
    const token = await getSessionToken();
    if (!token) {
        alert("Something went wrong while contacting the API. Try refreshing the page.");
    }

    let table_config = {
        "category" : "any",
        "difficulty" : "any"
    }

    const otdb_button = document.getElementById("otdbButton");
    const user_button = document.getElementById("userButton");
    otdb_button.addEventListener("click", function () {
        otdb_button.setAttribute("disabled", "");
        user_button.removeAttribute("disabled");
    });

    user_button.addEventListener("click", function () {
        otdb_button.removeAttribute("disabled");
        user_button.setAttribute("disabled", "");
    });

    // Initialize the table with information
    let otdb_tbl_body = await expandOTDBTable(document.createElement("tbody"),
                                                table_config, token);

    document.getElementById("opentdbTable").appendChild(otdb_tbl_body);

    document.getElementById("loadOTDBQuestions").addEventListener("click", function () {
        expandOTDBTable(otdb_tbl_body, table_config, token);
    });

    const opentdbForm = document.getElementById("opentdbForm");
    opentdbForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // Get the elements from the form
        category = opentdbForm.elements["category"].value;
        difficulty = opentdbForm.elements["difficulty"].value;

        // Configure the table, so that future extends make use of user config
        table_config["category"] = category;
        table_config["difficulty"] = difficulty;

        // Refresh the table
        otdb_tbl_body = document.createElement("tbody");
        /*
        otdb_tbl_body = await expandOTDBTable(document.createElement("tbody"),
                                                    table_config, token);
        */
    });

});

async function expandOTDBTable(tbl_body, config, token) {

    const rate_limit_code = "5"; 
    // Get data from the API
    let questions;
    try {
        const base_url = "https://opentdb.com/api.php?amount=50";
        const category = config["category"] !== "any" ? "&category=" + config["category"] : "";
        const difficulty = config["difficulty"] !== "any" ? "&difficulty=" + config["difficulty"] : "";
        
        const question_response = await fetch(`${base_url}${category}${difficulty}&token=${token}`);
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

