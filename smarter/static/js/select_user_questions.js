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
            const id = form.elements.id.value;
            if (ids.length + otdb_questions.length >= 50) {
                document.getElementById("tooManyQuestions").classList.remove("d-none");
            }
            else if (ids.includes(id)) {
                // TODO: Make nicer alert
                alert("This question is already selected")
            }
            else {
                ids.push(id);
                // Add the ID to session storage
                sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
                form.elements.submitButton.disabled = true;
                setButtonText(document.getElementById("submitSet"), ids, otdb_questions);
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

    const idForm = document.getElementById("IDSubmitionForm");
    idForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const id = idForm.elements.id.value;
        if (ids.includes(id)) {
            alert("This question is already selected");
            return;
        }

        let response = await fetch(`/question-sets/check_question/${id}`);
        if (!response.ok) {
            alert("Could not connect to the server! Try again.");
            return;
        }
        response = await response.json();
        if (!response["id_ok"]) {
            alert("The ID given does not belong to an user question");
        }
        else {
            idForm.elements.id.value = "";
            alert("Success");
            ids.push(id);
            sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
            setButtonText(document.getElementById("submitSet"), ids, otdb_questions);
            disableSelectButton(id);
        }
    });

    function disableSelectButton(id) {
        const forms = document.getElementsByClassName("selectQuestion");
        for (const form of forms) {
            if (form.elements.id.value === id)
                form.elements.submitButton.disabled = true;
        }
    }
});
