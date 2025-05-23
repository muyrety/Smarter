document.getElementById("notEnoughQuestionsDismiss").addEventListener("click", function() {
    document.getElementById("notEnoughQuestions").classList.add("d-none");
});

document.getElementById("tooManyQuestionsDismiss").addEventListener("click", function() {
    document.getElementById("tooManyQuestions").classList.add("d-none");
});

function setButtonText(button, user_questions, otdb_questions) {
    let questionCount = user_questions.length + otdb_questions.length;
    button.textContent = `Submit question set (${questionCount} questions selected)`;
}

function configureSessionStorage() {
    const parameters = new URLSearchParams(window.location.search);
    // If this page is loaded just after adding a question_set, load the neccessary values
    // and change the URL so that refreshes don't reset sessionStorage data
    if (parameters.get("name")) {
        sessionStorage.clear();
        sessionStorage.setItem("name", parameters.get("name"));
        sessionStorage.setItem("user_question_ids", JSON.stringify([]));
        sessionStorage.setItem("otdb_questions", JSON.stringify([]));
        if (parameters.get("private") === null) {
            sessionStorage.setItem("private", JSON.stringify(false));
        }
        else {
            sessionStorage.setItem("private", JSON.stringify(true));
        }
        // Remove the arguments from the url, so that page refreshes don't reset sessionStorage
        window.location.replace("/question-sets/add/user-generated");
    }
    // If someone tries to access the /add/opentdb|user-generated routes
    // without creating a question-set first, redirect them to create a question-set
    else if (sessionStorage.length === 0) {
        window.location.replace("/question-sets/add");
    }
}

async function submitSet() {
    const minQuestions = 5;
    const questionCount = JSON.parse(sessionStorage.getItem("otdb_questions")).length +
        JSON.parse(sessionStorage.getItem("user_question_ids")).length;
    if (questionCount < minQuestions) {
        document.getElementById("notEnoughQuestions").classList.remove("d-none");
        return;
    }

    const data = {
        name: sessionStorage.getItem("name"),
        private: JSON.parse(sessionStorage.getItem("private")),
        otdb_questions: JSON.parse(sessionStorage.getItem("otdb_questions")),
        user_questions: JSON.parse(sessionStorage.getItem("user_question_ids"))
    }

    try {
        const response = await fetch("/question-sets/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const response_json = await response.json();
            if (response_json.success) {
                window.location.replace("/");
            }
            else {
                window.location.replace("/question-sets/add");
            }
        }
        else {
            new bootstrap.Modal("#serverErrorModal").show();
        }
    }
    catch {
        new bootstrap.Modal("#serverErrorModal").show();
    }
}

export { setButtonText, submitSet, configureSessionStorage };
