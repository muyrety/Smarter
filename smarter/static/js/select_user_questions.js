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
            const addQuestion = !form.elements.submitButton.classList.contains("d-none");
            const id = form.elements.id.value;
            if (addQuestion) {
                if (ids.length + otdb_questions.length >= 50) {
                    document.getElementById("tooManyQuestions").classList.remove("d-none");
                }
                else if (ids.includes(id)) {
                    form.elements.submitButton.disabled = true;
                    form.elements.removeButton.disabled = false;
                    form.elements.submitButton.classList.add("d-none");
                    form.elements.removeButton.classList.remove("d-none");
                }
                else {
                    // Add the ID to session storage
                    ids.push(id);
                    sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
                    form.elements.submitButton.disabled = true;
                    form.elements.removeButton.disabled = false;
                    form.elements.submitButton.classList.add("d-none");
                    form.elements.removeButton.classList.remove("d-none");
                    setButtonText(document.getElementById("submitSet"), ids, otdb_questions);
                }
            }
            else {
                // Delete the id from the array
                ids.splice(ids.indexOf(id), 1);
                sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
                form.elements.removeButton.disabled = true;
                form.elements.submitButton.disabled = false;
                form.elements.removeButton.classList.add("d-none");
                form.elements.submitButton.classList.remove("d-none");
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
                // and show the remove button instead
                const formElements = row.getElementsByClassName("selectQuestion")[0].elements;
                formElements.submitButton.disabled = true;
                formElements.submitButton.classList.add("d-none");
                formElements.removeButton.classList.remove("d-none");
                formElements.removeButton.disabled = false;
            }
        }
    }

    const idForm = document.getElementById("IDSubmitionForm");
    idForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const id = idForm.elements.id.value;
        if (ids.includes(id)) {
            const idAlert = document.getElementById("questionChosenAlert");
            idAlert.classList.remove("d-none");
            return;
        }

        let response;
        try {
            response = await fetch(`/question-sets/check_question/${id}`);
        }
        catch (e) {
            console.log(e);
            const idAlert = document.getElementById("serverFailAlert");
            idAlert.classList.remove("d-none");
            return;
        }
        if (!response.ok) {
            const idAlert = document.getElementById("serverFailAlert");
            idAlert.classList.remove("d-none");
            return;
        }
        response = await response.json();
        if (!response["id_ok"]) {
            const idAlert = document.getElementById("questionNotValidAlert");
            idAlert.classList.remove("d-none");
        }
        else {
            idForm.elements.id.value = "";
            const idAlert = document.getElementById("successAlert");
            idAlert.classList.remove("d-none");

            // Add the ID to session storage
            ids.push(id);
            sessionStorage.setItem("user_question_ids", JSON.stringify(ids));
            const form = Array.from(forms).find(function(form) {
                return form.elements.id.value === id;
            });
            form.elements.submitButton.disabled = true;
            form.elements.removeButton.disabled = false;
            form.elements.submitButton.classList.add("d-none");
            form.elements.removeButton.classList.remove("d-none");
            setButtonText(document.getElementById("submitSet"), ids, otdb_questions);
        }
    });

    document.getElementById("questionChosenAlertDismiss").
        addEventListener("click", function() {
            const idAlert = document.getElementById("questionChosenAlert");
            idAlert.classList.add("d-none");
        });

    document.getElementById("questionNotValidAlertDismiss").
        addEventListener("click", function() {
            const idAlert = document.getElementById("questionNotValidAlert");
            idAlert.classList.add("d-none");
        });

    document.getElementById("successAlertDismiss").
        addEventListener("click", function() {
            const idAlert = document.getElementById("successAlert");
            idAlert.classList.add("d-none");
        });

    document.getElementById("serverFailAlertDismiss").
        addEventListener("click", function() {
            const idAlert = document.getElementById("serverFailAlert");
            idAlert.classList.add("d-none");
        });
});
