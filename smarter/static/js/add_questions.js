document.addEventListener("DOMContentLoaded", function() {
    const question_type = document.getElementById("type");

    // Needed to counteract selection caching between page refreshes
    checkFormTemplate(question_type.value);

    question_type.addEventListener("change", function() {
        checkFormTemplate(question_type.value);
    });
});

// Display different options when question is True/False and multiple choice
function checkFormTemplate(question_type) {
    const correct_bool = document.getElementById("correctAnswerBoolean");
    const correct_multiple = document.getElementById("correctAnswerMultiple");
    const incorrect_answers = document.getElementsByName("incorrectAnswers");
    if (question_type === "multiple") {
        // Deactivate bool options
        correct_bool.removeAttribute("required");
        correct_bool.parentNode.classList.add("d-none");

        // Activate multiple choice options
        correct_multiple.setAttribute("required", "");
        correct_multiple.parentNode.classList.remove("d-none");

        // Make the answers parent nodes (divs) visible and the input fields required
        for (const incorrect_answer of incorrect_answers) {
            incorrect_answer.setAttribute("required", "");
            incorrect_answer.parentNode.classList.remove("d-none");
        }
    }
    else if (question_type === "boolean") {
        // Activate bool options
        correct_bool.setAttribute("required", "");
        correct_bool.parentNode.classList.remove("d-none");

        // Deactivate multiple choice options
        correct_multiple.removeAttribute("required");
        correct_multiple.parentNode.classList.add("d-none");

        // Make the answers parent nodes (divs) invisible and input fields not required
        for (const incorrect_answer of incorrect_answers) {
            incorrect_answer.removeAttribute("required");
            incorrect_answer.parentNode.classList.add("d-none");
        }
    }
}
