// Track how many questions were loaded. Resets on category/difficulty change.
let questions_loaded = 0;

document.addEventListener("DOMContentLoaded", async function () {
    const token = await getSessionToken();

    let table_config = {
        category: "any",
        difficulty: "any"
    };

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
    let otdb_tbl_body = await expandOTDBTable(document.createElement("tbody"), table_config, token);

    document.getElementById("opentdbTable").appendChild(otdb_tbl_body);

    document.getElementById("loadOTDBQuestions").addEventListener("click", function () {
        expandOTDBTable(otdb_tbl_body, table_config, token);
    });

    const opentdbForm = document.getElementById("opentdbForm");
    opentdbForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // Get the elements from the form
        category = opentdbForm.elements.category.value;
        difficulty = opentdbForm.elements.difficulty.value;

        // Configure the table, so that future extends make use of user config
        table_config.category = category;
        table_config.difficulty = difficulty;
        
        await resetToken(token);
        questions_loaded = 0;
        
        // Refresh the table
        const tmp = await expandOTDBTable(document.createElement("tbody"), table_config, token);
        otdb_tbl_body.replaceWith(tmp);
        otdb_tbl_body = tmp;
    });

});

async function getQuestionAmount(config) {
    const max_questions = 50;

    if (config.category !== "any") {
        const response = await fetch(`https://opentdb.com/api_count.php?category=${category}`);
        if (!response.ok) {
            throw new Error(`HTTP error while querying API for question count: ${response.status}`);
        }

        const response_json = await response.json();

        let total;
        switch (config.difficulty) {
            case "any":
                total = response_json.category_question_count.total_question_count;
                break;

            case "easy":
                total = response_json.category_question_count.total_easy_question_count; 
                break;

            case "medium":
                total = response_json.category_question_count.total_medium_question_count; 
                break;

            case "hard":
                total = response_json.category_question_count.total_hard_question_count; 
                break;

            default:
                throw new Error("Unexpected error: invalid config parameter passed to getQuestionAmount()")
        }

        const available = total - questions_loaded;
        const to_send = available > 50 ? 50 : available;
        return to_send; 
    }
    else {
        return max_questions;
    }
}

async function getQuestions(config, token) {
    const base_url = "https://opentdb.com/api.php?";
    const http_error_message = "HTTP error when requesting questions: ";
    const http_too_many_requests = "429";
    const no_questions_left_message = "All available questions already loaded";

    // Get data from the API
    try {
        const amount = await getQuestionAmount(config);
        if (amount <= 0) {
            throw new Error(no_questions_left_message);
        }
            
        const category = config.category === "any" ? "" : `&category=${config.category}`;
        const difficulty = config.difficulty === "any" ? "" : `&difficulty=${config.difficulty}`;
        
        const response = await fetch(`${base_url}amount=${amount}${category}${difficulty}&token=${token}`);

        if (!response.ok) {
            throw new Error(`${http_error_message}${response.status}`);
        }

        const response_json = await response.json();
        if (response_json.response_code != 0) {
            throw new Error(`Bad response code to question request: ${response_json.response_code}`);
        }
        return response_json.results;
    }
    catch (error) {
        console.error(error);

        if (error.message === `${http_error_message}${http_too_many_requests}`) {
            alert("You have made too many question requests. Please wait at least 5 seconds before loading more questions.");
        }
        else if (error.message === no_questions_left_message) {
            alert("You have exhausted all the questions. Please refresh the page to continue browsing.");
        }
        else {
            alert("An unexpected error occured, try refreshing the page");
        }
        return null;
    }
}

// Helper function to parse API data
function HTMLToText(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent;
}

async function expandOTDBTable(tbl_body, config, token) {
    const questions = await getQuestions(config, token);

    // Retain the already loaded questions if getQuestions() fails
    if (questions === null) {
        return tbl_body;
    }

    // Add data to the table
    for (const question of questions) {
        const row = document.createElement("tr");
        for (const attribute of ["category", "difficulty", "question"]) {
            const data = document.createElement("td");
            data.textContent = HTMLToText(question[attribute]);
            row.appendChild(data);
        }
        tbl_body.appendChild(row);
    } 
    questions_loaded += questions.length;
    return tbl_body;
}
        
// Get session token from the API
async function getSessionToken() {
    try {
        const response = await fetch("https://opentdb.com/api_token.php?command=request");
        if (!response.ok) {
            throw new Error(`HTTP error when requesting token: ${response.status}`);
        }
        const response_json = await response.json();
        if (response_json.response_code != 0)
        {
            throw new Error(`Bad response code to token request: ${response_json.response_code}`);
        }
        return response_json.token;
    }
    catch (error) {
        console.error(error);
        alert("Something went wrong while contacting the API. Try refreshing the page.");
    }
}

// Reset the API token
async function resetToken(token) {
    try {
        const response = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const response_json = await response.json();
        if (response_json.response_code != 0) {
            throw new Error(`Bad response code to token reset request: ${response_json.response_code}`);
        }
    }
    catch (error) {
        console.error(error);
        alert("Something went wrong while contacting the API. Try refreshing the page.");
    }
}
