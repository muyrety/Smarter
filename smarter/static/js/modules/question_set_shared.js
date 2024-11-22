function setButtonText(button, user_questions, otdb_questions) {
    let questionCount = user_questions.length + otdb_questions.length;
    button.textContent = `Submit question set (${questionCount} questions selected)`;
}

async function submitSet() {
    const questions = JSON.parse(sessionStorage.getItem("otdb_questions")).length +
        JSON.parse(sessionStorage.getItem("user_question_ids")).length;
    if (questions < 5) {
        document.getElementById("notEnoughQuestions").classList.remove("d-none");
        return;
    }
    const response = await fetch("/question-sets/submit", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            name: sessionStorage.getItem("name"),
            temporary: sessionStorage.getItem("temporary"),
            otdb_questions: sessionStorage.getItem("otdb_questions"),
            user_questions: sessionStorage.getItem("user_question_ids")
        })
    });
    if (response.ok) {
        window.location.replace(response.url);
    }

}

function hideAlert() {
    document.getElementById("notEnoughQuestions").classList.add("d-none");
}

export { setButtonText, submitSet, hideAlert };
