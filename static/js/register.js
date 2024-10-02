import {checkUsername} from "./modules/check_username.js";

document.addEventListener("DOMContentLoaded", function() {
    const passwordField = document.getElementById("password");
    const repeatPasswordField = document.getElementById("repeatPassword");
    const usernameField = document.getElementById("username");
    const badUsernameField = document.getElementById("badUsernameField");
    const registerButton = document.getElementById("registerButton");

    passwordField.addEventListener("input", checkPassword);
    repeatPasswordField.addEventListener("input", checkPassword);

    // This is needed so that password and username checks respect each other
    // when changing the registerButton status
    let register_disabled = {
        by_username: false,
        by_password: false
    };

    usernameField.addEventListener("input", async function() {
        const username = usernameField.value; 

        // Check for username availability
        if (username && await checkUsername(username)) {
            badUsernameField.innerHTML = "This username is taken";
            badUsernameField.classList.toggle("d-none", false);
            registerButton.setAttribute("disabled", "");
            register_disabled.by_username = true;
        }
        // Check for whitespace in the username
        else if (/\s/g.test(username)) {
            badUsernameField.innerHTML = "Usernames may not contain whitespace";
            badUsernameField.classList.toggle("d-none", false);
            registerButton.setAttribute("disabled", "");
            register_disabled.by_username = true;
        }
        else {
            register_disabled.by_username = false;
            badUsernameField.classList.toggle("d-none", true);
            if (!register_disabled.by_password) {
                registerButton.removeAttribute("disabled");
            }
        }
    });

    function checkPassword() {
        if (repeatPasswordField.value !== passwordField.value) {
            badPasswordField.classList.toggle("d-none", false);
            registerButton.setAttribute("disabled", "");
            register_disabled.by_password = true;
        }
        else {
            register_disabled.by_password = false;
            badPasswordField.classList.toggle("d-none", true);
            if (!register_disabled.by_username) {
                registerButton.removeAttribute("disabled");
            }
        }
    }
});

