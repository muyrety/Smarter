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
        if (parameters.get("temp") === null) {
            sessionStorage.setItem("temporary", JSON.stringify(false));
        }
        else {
            sessionStorage.setItem("temporary", JSON.stringify(true));
        }
        window.location.replace("/question-sets/add/opentdb");
    }
    else if (sessionStorage.length == 0) {
        window.location.replace("/question-sets/add");
    }
}

async function submitSet() {
    const questions = JSON.parse(sessionStorage.getItem("otdb_questions")).length +
        JSON.parse(sessionStorage.getItem("user_question_ids")).length;
    if (questions < 5) {
        document.getElementById("notEnoughQuestions").classList.remove("d-none");
        return;
    }

    let data = new FormData();
    data.append("name", sessionStorage.getItem("name"));
    data.append("temporary", sessionStorage.getItem("temporary"));
    data.append("otdb_questions", sessionStorage.getItem("otdb_questions"));
    data.append("user_questions", sessionStorage.getItem("user_question_ids"));

    const response = await fetch("/question-sets/submit", {
        method: "POST",
        body: data
    });
    if (response.ok) {
        window.location.replace(response.url);
    }

}

function hideAlert() {
    document.getElementById("notEnoughQuestions").classList.add("d-none");
}

export { setButtonText, submitSet, hideAlert, configureSessionStorage };
