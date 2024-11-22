import { setButtonText, submitSet, hideAlert, configureSessionStorage } from "./modules/question_set_shared.js";

document.addEventListener("DOMContentLoaded", function() {
    configureSessionStorage();
    const ids = JSON.parse(sessionStorage.getItem("user_question_ids"));
    const submitSetButton = document.getElementById("submitSet");
    setButtonText(submitSetButton, ids, JSON.parse(sessionStorage.getItem("otdb_questions")));
    submitSetButton.addEventListener("click", submitSet);
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

    document.getElementById("notEnoughQuestionsDismiss").addEventListener("click", hideAlert);

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

});
