import {checkUsername} from "./modules/check_username.js";

document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");

    usernameField.addEventListener("input", async function() {
        const badUsernameField = document.getElementById("badUsernameField");
        const loginButton = document.getElementById("loginButton");
        const username = usernameField.value.trim(); 

        if (username && !(await checkUsername(username))) {
            badUsernameField.classList.toggle("d-none", false);
            loginButton.setAttribute("disabled", "");
        }
        else {
            badUsernameField.classList.toggle("d-none", true);
            loginButton.removeAttribute("disabled");
        }
    });
});
