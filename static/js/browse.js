document.addEventListener("DOMContentLoaded", async function () {
    let token;
    try {
        token = await getSessionToken();
    }
    catch (error) {
        console.error(error);
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
        
        try {
            await resetToken(token);
        }
        catch (error) {
            console.error(error);
            alert("Something went wrong while contacting the API. Try refreshing the page.");
        }

        // Refresh the table
        let tmp = await expandOTDBTable(document.createElement("tbody"), table_config, token);
        otdb_tbl_body.replaceWith(tmp);
        otdb_tbl_body = tmp;
    });

});

async function getQuestionAmount(category, difficulty) {
    if (category !== "any") {
        try {
            const available_questions = 
                await fetch(`https://opentdb.com/api_count.php?category=${category}`);
            if (!available_questions.ok) {
                throw new Error(`HTTP error! status: ${available_questions.status}`);
            }

            const question_data = await available_questions.json();

            switch (difficulty) {
                case "any":
                    return question_data.category_question_count.total_question_count; 

                case "easy":
                    return question_data.category_question_count.total_easy_question_count; 

                case "medium":
                    return question_data.category_question_count.total_medium_question_count; 

                case "hard":
                    return question_data.category_question_count.total_hard_question_count; 

                default:
                    throw new Error("Unexpected error: invalid difficulty paramater passed to getQuestionAmount()")
            }
        }
        catch (error) {
            throw error;
        }
    }
    else {
        return "50";
    }
}

async function getQuestions(config, token) {
    const base_url = "https://opentdb.com/api.php?";
    const api_error_message = "Bad response code to question request:"; 
    const api_errors = {
        rate_limit : "5",
        no_results : "1",
        token_empty : "4"
    }

    // Get data from the API
    try {
        let amount = await getQuestionAmount(config["category"], config["difficulty"]);
        amount = "amount=" + amount;
        const category = config["category"] !== "any" ? "&category=" + config["category"] : "";
        const difficulty = config["difficulty"] !== "any" ? "&difficulty=" + config["difficulty"] : "";
        
        const question_response = await fetch(`${base_url}${amount}${category}${difficulty}&token=${token}`);
        if (!question_response.ok && question_response.status != 429) {
            throw new Error(`HTTP error! status: ${question_response.status}`);
        }

        const questions_json = await question_response.json();
        if (questions_json.response_code != 0) {
            throw new Error(api_error_message + questions_json.response_code);
        }
        return questions_json.results;
    }
    catch (error) {
        throw error;
        if (error.message === api_error_message + api_errors["no_results"] ||
            error.message === api_error_message + api_errors["token_empty"]) {
            alert("You have exhausted all the questions. Please refresh the page to browse.");
        }
        else if (error.message === api_error_message + api_errors["rate_limit"]) {
            alert("You have made too many question requests. Please wait at least 5 seconds before loading more questions.");
        }
        else {
            alert("An unexpected error occured, try refreshing the page");
        }
        return error;
    }
}

async function expandOTDBTable(tbl_body, config, token) {
    let questions;
    try {
        questions = await getQuestions(config, token);
    }
    catch (error) {
        console.error(error.cause);
        alert("ERROR WHILE GETTING QUESTIONS");
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
        if (!session_response.ok) {
            throw new Error(`HTTP error! status: ${session_response.status}`);
        }
        const session = await session_response.json();
        if (session.response_code != 0)
        {
            throw new Error("Bad response code to token request:" + session.response_code);
        }
        return session.token;
    }
    catch (error) {
        throw error;
    }
}

async function resetToken(token) {
    try {
        const response = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const response_json = await response.json();
        if (response_json.response_code != 0) {
            throw new Error("Bad API return code" + response_json.response_code);
        }
    }
    catch (error) {
        throw error;
    }
}
