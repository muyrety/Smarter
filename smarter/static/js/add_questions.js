document.addEventListener("DOMContentLoaded", function () {
    const question_type = document.getElementById("type");

    // Needed to counteract selection caching between page refreshes
    checkFormTemplate(question_type.value);

    question_type.addEventListener("change", function () {
        checkFormTemplate(question_type.value);
    });
});

// Display different options when question is True/False and multiple choice
function checkFormTemplate(question_type) {
    const correct_bool_div = document.getElementById("correctAnswerBoolean").parentNode;
    const correct_multiple_div = document.getElementById("correctAnswerMultiple").parentNode;
    const incorrect_answers = document.getElementsByName("incorrectAnswers");
    if (question_type === "multiple") {
        correct_bool_div.classList.toggle("d-none", true);
        correct_multiple_div.classList.toggle("d-none", false);

        // Make the answers parent nodes (divs) visible
        for (const incorrect_answer of incorrect_answers) {
            incorrect_answer.parentNode.classList.toggle("d-none", false);
        }
    }
    else if (question_type === "boolean") {
        correct_bool_div.classList.toggle("d-none", false);
        correct_multiple_div.classList.toggle("d-none", true);

        // Make the answers parent nodes (divs) invisible
        for (const incorrect_answer of incorrect_answers) {
            incorrect_answer.parentNode.classList.toggle("d-none", true);
        }
    }
}
