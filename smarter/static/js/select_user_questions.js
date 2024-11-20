document.addEventListener("DOMContentLoaded", function() {
    const parameters = new URLSearchParams(window.location.search);
    // If this page is loaded just after adding a question_set, load the neccessary values
    // and change the URL so page refreshes don't interact with sessionStorage data
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
        window.location.href = '/question-sets/add/user-generated';
    }

    const ids = JSON.parse(sessionStorage.getItem("user_question_ids"));
    setButtonText(document.getElementById("submitSet"), ids,
        JSON.parse(sessionStorage.getItem("otdb_questions")));
    disableSelected(ids);

    const forms = document.getElementsByClassName("selectQuestion");

    // Add an event listener to each form
    Array.from(forms).forEach(function(form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            ids.push(form.elements.id.value);
            // Add the ID to session storage
            sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
            form.elements.submitButton.setAttribute("disabled", "");
            setButtonText(document.getElementById("submitSet"), ids,
                JSON.parse(sessionStorage.getItem("otdb_questions")));
        });
    });

    // Disable buttons with the selected IDs
    function disableSelected(ids) {
        const table = document.getElementById("questionTableBody");
        const id_col = 0;
        for (const row of table.children) {
            if (ids.includes(row.children[id_col].textContent)) {
                // Select the rows form and disable it's submit button
                row.getElementsByClassName("selectQuestion")[0].elements.submitButton.setAttribute("disabled", "");
            }
        }
    }

    function setButtonText(button, user_questions, otdb_questions) {
        let questionCount = user_questions.length + otdb_questions.length;
        button.textContent = `Submit question set (${questionCount} questions selected)`;
    }

});
