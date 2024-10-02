// Track how many questions are loaded. Resets on category/difficulty change.
let questions_loaded = 0;

document.addEventListener("DOMContentLoaded", async function () {
    let table_config = {
        category: "any",
        difficulty: "any"
    };

    let token = await getSessionToken();

    // Track questions available. Changes accordingly on category/difficulty change.
    let questions_available = await getQuestionCount(table_config);
    
    // Initialize the table with information
    let tbl_body = await expandTable(document.createElement("tbody"), table_config, token, questions_available);
    document.getElementById("questionTable").appendChild(tbl_body);

    document.getElementById("loadQuestions").addEventListener("click", function () {
        expandTable(tbl_body, table_config, token, questions_available);
    });

    const configForm = document.getElementById("configurationForm");
    configForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // Get the elements from the form
        category = configForm.elements.category.value;
        difficulty = configForm.elements.difficulty.value;

        // Backup of program state in case category change fails
        const backup = {
            token: token,
            category: table_config.category,
            difficulty: table_config.difficulty,
            questions_loaded: questions_loaded,
            questions_available: questions_available
        };

        // Configure the table, so that future extends make use of user config
        table_config.category = category;
        table_config.difficulty = difficulty;

        token = await getSessionToken();

        // Only request counts again if the category or difficulty were changed
        if (table_config.category !== category || table_config.difficulty !== difficulty) {
            questions_available = await getQuestionCount(table_config);
        }

        questions_loaded = 0;
        const tmp = await expandTable(document.createElement("tbody"), table_config, token, questions_available);

        // Only refresh the table if some questions were loaded
        // tmp.children.legnth is used here instead of questions_loaded
        // because different instances of this function can't change it
        // (questions_loaded is a global variable)
        if (tmp.children.length > 0) {
            tbl_body.replaceWith(tmp);
            tbl_body = tmp;
        }
        else {
            token = backup.token;
            table_config.category = backup.category;
            table_config.difficulty = backup.difficulty;
            questions_loaded = backup.questions_loaded;
            questions_available = backup.questions_available;
        }
        
    });

});

async function getQuestionCount(config) {
    const question_cap = 1000;

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
                throw new Error("Unexpected error: invalid config parameter passed to getQuestionCount()")
        }
        return total > question_cap ? question_cap : total;
    }
    else {
        return question_cap;
    }
}

async function getQuestions(config, token, questions_available) {
    const base_url = "https://opentdb.com/api.php?";
    const http_error_message = "HTTP error when requesting questions: ";
    const http_too_many_requests = "429";
    const no_questions_left_message = "All available questions already loaded";

    // Get data from the API
    try {
        let amount = questions_available - questions_loaded;
        amount = amount > 50 ? 50 : amount;
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

async function expandTable(tbl_body, config, token, questions_available) {
    const questions = await getQuestions(config, token, questions_available);

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
