// This file requires check_username.js in order to work
document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");
    const usernameTakenField = document.getElementById("usernameTakenField");
    const registerButton = document.getElementById("registerButton");

    usernameField.addEventListener("input", async function() {
        const username = usernameField.value.trim(); 
        if (username && await checkUsername(username)) {
            usernameTakenField.style.display = "block";
            registerButton.setAttribute("disabled", "");
        }
        else {
            usernameTakenField.style.display = "none"; 
            registerButton.removeAttribute("disabled");
        }
    });
});

