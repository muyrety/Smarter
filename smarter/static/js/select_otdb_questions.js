import { setButtonText, submitSet, hideAlert } from "./modules/question_set_shared.js";

document.addEventListener("tableChanged", function() {
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
        window.location.href = '/question-sets/add/opentdb';
    }

    const forms = document.getElementsByClassName("selectQuestion");
    let questions = JSON.parse(sessionStorage.getItem("otdb_questions"));
    const submitSetButton = document.getElementById("submitSet");
    setButtonText(submitSetButton, JSON.parse(sessionStorage.getItem("user_question_ids")), questions);
    submitSetButton.addEventListener("click", submitSet);
    disableSelected(questions, forms);

    Array.from(forms).forEach(function(form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            questions.push(getQuestionData(form));

            sessionStorage.setItem("otdb_questions", JSON.stringify(questions));
            form.elements.submitButton.setAttribute("disabled", "");
            setButtonText(submitSetButton, JSON.parse(sessionStorage.getItem("user_question_ids")), questions);
        });
    });

    document.getElementById("notEnoughQuestionsDismiss").addEventListener("click", hideAlert);

    // Disable selected questions' buttons
    function disableSelected(questions, forms) {
        for (const form of forms) {
            for (const question of questions) {
                if (JSON.stringify(getQuestionData(form)) === JSON.stringify(question)) {
                    form.elements.submitButton.setAttribute("disabled", "");
                }
            }
        }
    }

    // Get the question data from the row's form
    function getQuestionData(form) {
        // Convert the form's incorrect answer elements to an array of their values
        const incorrect_answers = Array.from(
            // Use querySelectorAll instead of form.elements to get an iterable every time,
            // even if there is only one "incorrect_answers" element
            form.querySelectorAll('input[name="incorrect_answers"]'),
            function(element) {
                return element.value;
            }
        );
        return {
            type: form.elements.type.value,
            difficulty: form.elements.difficulty.value,
            category: form.elements.category.value,
            question: form.elements.question.value,
            correct_answer: form.elements.correct_answer.value,
            incorrect_answers: incorrect_answers
        };
    }

});
