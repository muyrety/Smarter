import { setButtonText, submitSet, configureSessionStorage } from "./modules/question_set_shared.js";

document.addEventListener("DOMContentLoaded", function() {
    configureSessionStorage();
    if (!JSON.parse(sessionStorage.getItem("temporary"))) {
        document.getElementById("otdblink").classList.add("d-none");
    }
    const ids = JSON.parse(sessionStorage.getItem("user_question_ids"));
    const otdb_questions = JSON.parse(sessionStorage.getItem("otdb_questions"));
    const submitSetButton = document.getElementById("submitSet");
    setButtonText(submitSetButton, ids, otdb_questions);
    submitSetButton.addEventListener("click", submitSet);
    disableSelected(ids);

    const forms = document.getElementsByClassName("selectQuestion");

    // Add an event listener to each form
    Array.from(forms).forEach(function(form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            if (ids.length + otdb_questions.length < 50) {
                ids.push(form.elements.id.value);
                // Add the ID to session storage
                sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
                form.elements.submitButton.disabled = true;
                setButtonText(document.getElementById("submitSet"), ids, otdb_questions);
            }
            else {
                document.getElementById("tooManyQuestions").classList.remove("d-none");
            }
        });
    });

    // Disable buttons with the selected IDs
    function disableSelected(ids) {
        const table = document.getElementById("questionTableBody");
        const id_col = 0;
        for (const row of table.children) {
            if (ids.includes(row.children[id_col].textContent)) {
                // Select the rows form and disable it's submit button
                row.getElementsByClassName("selectQuestion")[0].elements.submitButton.disabled = true;
            }
        }
    }

});
