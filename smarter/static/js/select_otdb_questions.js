document.addEventListener("tableChanged", function() {
    const parameters = new URLSearchParams(window.location.search);
    // If this page is loaded just after adding a question_set, load the neccessary values
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
    }

    const forms = document.getElementsByClassName("selectQuestion");

    let questions = JSON.parse(sessionStorage.getItem("otdb_questions"));
    Array.from(forms).forEach(function(form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            // Convert the form's incorrect answer elements to an array of their values
            const incorrect_answers = Array.from(form.elements.incorrect_answers).map(x => x.value);

            questions.push({
                type: form.elements.type.value,
                difficulty: form.elements.difficulty.value,
                category: form.elements.category.value,
                question: form.elements.question.value,
                correct_answer: form.elements.correct_answer.value,
                incorrect_answers: incorrect_answers
            });

            sessionStorage.setItem("otdb_questions", JSON.stringify(questions));
            form.elements.submitButton.setAttribute("disabled", "");
        });
    });

    function disableSelected(questions) { // TODO: Implement function

    }

});
