document.addEventListener("DOMContentLoaded", function() {
    const parameters = new URLSearchParams(window.location.search);
    // If this page is loaded just after adding a question_set, load the neccessary values
    if (parameters.get("name")) {
        sessionStorage.clear();
        sessionStorage.setItem("name", parameters.get("name"));
        sessionStorage.setItem("user_question_ids", JSON.stringify([]));
        if (parameters.get("temp") === null) {
            sessionStorage.setItem("temporary", JSON.stringify(false));
        }
        else {
            sessionStorage.setItem("temporary", JSON.stringify(true));
        }
    }

    ids = JSON.parse(sessionStorage.getItem("user_question_ids"));
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
        });
    });

    // Disable buttons with the selected IDs
    function disableSelected(ids) {
        const table = document.getElementById("questionTableBody");
        const id_col = 0;
        const form_col = 5;
        for (const row of table.children) {
            if (row.children[id_col].textContent in ids) {
                // Select the rows form and disable it's submit button
                row.children[form_col].children[0].elements.submitButton.setAttribute("disabled", "");
            }
        }
    }

});
