// Track how many questions are loaded. Resets on category/difficulty change.
let questions_loaded = 0;

const errors = {
    no_questions_left: "All available questions already loaded",
    getQuestions_http: "HTTP error when requesting questions: ",
    too_many_requests_code: "429"
};

document.addEventListener("DOMContentLoaded", async function() {
    let table_config = {
        category: "any",
        difficulty: "any"
    };

    let token;
    try {
        token = await getSessionToken();
    }
    catch (error) {
        logErrors(error);
        return;
    }

    // Track questions available. Changes accordingly on category/difficulty change.
    let questions_available;
    try {
        questions_available = await getQuestionCount(table_config);
    }
    catch (error) {
        logErrors(error);
    }

    // Initialize the table with information
    let tbl_body = await expandTable(document.createElement("tbody"), table_config, token, questions_available);
    document.getElementById("questionTable").appendChild(tbl_body);

    document.getElementById("loadQuestions").addEventListener("click", function() {
        expandTable(tbl_body, table_config, token, questions_available);
    });

    const configForm = document.getElementById("configurationForm");
    const formButton = document.getElementById("formButton");
    configForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        formButton.setAttribute("disabled", "");

        // Configure the table, so that future extends make use of user config
        table_config.category = configForm.elements.category.value;
        table_config.difficulty = configForm.elements.difficulty.value;

        try {
            await resetToken(token)
            questions_available = await getQuestionCount(table_config);
            questions_loaded = 0;
            changeButton(true);

            const tmp = await expandTable(document.createElement("tbody"), table_config, token, questions_available);
            tbl_body.replaceWith(tmp);
            tbl_body = tmp;
        }
        catch (error) {
            logErrors(error);
        }
        formButton.removeAttribute("disabled");
    });

});

async function getQuestionCount(config) {
    const question_cap = 1000;
    const bad_parameter_error = "Unexpected error: invalid config parameter passed to getQuestionCount()";

    if (config.category !== "any") {
        category_int = Number(config.category);
        if (!Number.isInteger(category_int) || category_int < 9 || category_int > 32) {
            throw new Error(bad_parameter_error)
        }

        const response = await fetch(`https://opentdb.com/api_count.php?category=${config.category}`);
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
                throw new Error(bad_parameter_error)
        }
        return total > question_cap ? question_cap : total;
    }
    else {
        return question_cap;
    }
}

async function getQuestions(config, token, questions_available) {
    const base_url = "https://opentdb.com/api.php?";

    // Get data from the API
    let amount = questions_available - questions_loaded;
    amount = amount > 50 ? 50 : amount;
    if (amount <= 0) {
        throw new Error(errors.no_questions_left);
    }

    const category = config.category === "any" ? "" : `&category=${config.category}`;
    const difficulty = config.difficulty === "any" ? "" : `&difficulty=${config.difficulty}`;

    const response = await fetch(`${base_url}amount=${amount}${category}${difficulty}&token=${token}`);

    if (!response.ok) {
        throw new Error(`${errors.getQuestions_http}${response.status}`);
    }

    const response_json = await response.json();
    if (response_json.response_code != 0) {
        throw new Error(`Bad response code to question request: ${response_json.response_code}`);
    }
    return response_json.results;
}

// Helper function to parse API data
function HTMLToText(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent;
}

async function expandTable(tbl_body, config, token, questions_available) {
    let questions;
    try {
        questions = await getQuestions(config, token, questions_available);
    }
    // Retain the already loaded questions if getQuestions() fails
    catch (error) {
        logErrors(error);
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

    if (questions_loaded >= questions_available) {
        changeButton(false);
    }

    return tbl_body;
}

// Get session token from the API
async function getSessionToken() {
    const response = await fetch("https://opentdb.com/api_token.php?command=request");
    if (!response.ok) {
        throw new Error(`HTTP error when requesting token: ${response.status}`);
    }
    const response_json = await response.json();
    if (response_json.response_code != 0) {
        throw new Error(`Bad response code to token request: ${response_json.response_code}`);
    }
    return response_json.token;
}

// Reset the API token
async function resetToken(token) {
    const response = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
    if (!response.ok) {
        throw new Error(`HTTP error when reseting token: ${response.status}`);
    }
    const response_json = await response.json();
    if (response_json.response_code != 0) {
        throw new Error(`Bad response code to token reset request: ${response_json.response_code}`);
    }
}

function logErrors(error) {
    console.error(error);

    if (error.message === `${errors.getQuestions_http}${errors.too_many_requests_code}`) {
        alert("You have made too many question requests. Please wait at least 5 seconds before loading more questions.");
    }
    else {
        alert("An unexpected error occured, try refreshing the page");
    }
}

function changeButton(enable) {
    let end_reached = document.getElementById("endReached");
    let button = document.getElementById("loadQuestions");
    if (enable) {
        end_reached.classList.toggle("d-none", true);
        button.classList.toggle("d-none", false);
    }
    else {
        end_reached.classList.toggle("d-none", false);
        button.classList.toggle("d-none", true);
    }
}
