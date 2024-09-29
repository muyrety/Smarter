// This file requires check_username.js in order to work
document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");
    const repeatPasswordField = document.getElementById("repeatPassword");
    const badUsernameField = document.getElementById("badUsernameField");
    const registerButton = document.getElementById("registerButton");

    passwordField.addEventListener("input", checkPassword);
    repeatPasswordField.addEventListener("input", checkPassword);
    usernameField.addEventListener("input", async function() {
        const username = usernameField.value; 

        // Check for username availability
        if (username && await checkUsername(username)) {
            badUsernameField.innerHTML = "This username is taken";
            badUsernameField.style.display = "block";
            registerButton.setAttribute("disabled", "");
        }
        // Check for whitespace in the username
        else if (/\s/g.test(username)) {
            badUsernameField.innerHTML = "Usernames may not contain whitespace";
            badUsernameField.style.display = "block";
            registerButton.setAttribute("disabled", "");
        }
        else {
            badUsernameField.style.display = "none"; 
            registerButton.removeAttribute("disabled");
        }
    });

    function checkPassword() {
        if (repeatPasswordField.value !== passwordField.value) {
            badPasswordField.style.display = "block";
            registerButton.setAttribute("disabled", "");
        }
        else {
            badPasswordField.style.display = "none"; 
            registerButton.removeAttribute("disabled");
        }
    }
});

