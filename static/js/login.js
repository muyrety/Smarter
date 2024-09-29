// This file requires check_username.js in order to run
document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");

    usernameField.addEventListener("input", async function() {
        const badUsernameField = document.getElementById("badUsernameField");
        const loginButton = document.getElementById("loginButton");
        const username = usernameField.value.trim(); 

        if (username && !(await checkUsername(username))) {
            badUsernameField.style.display = "block";
            loginButton.setAttribute("disabled", "");
        }
        else {
            badUsernameField.style.display = "none"; 
            loginButton.removeAttribute("disabled");
        }
    });
});
