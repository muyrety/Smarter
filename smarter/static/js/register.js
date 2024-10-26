document.addEventListener("DOMContentLoaded", function() {
    const passwordField = document.getElementById("password");
    const repeatPasswordField = document.getElementById("repeatPassword");

    const badPasswordField = document.getElementById("badPasswordField");
    const registerButton = document.getElementById("registerButton");

    passwordField.addEventListener("input", checkPassword);
    repeatPasswordField.addEventListener("input", checkPassword);

    function checkPassword() {
        if (repeatPasswordField.value !== passwordField.value) {
            // Show the message
            badPasswordField.classList.toggle("d-none", false);

            // Disable register button
            registerButton.setAttribute("disabled", "");
        }
        else {
            // Hide the message
            badPasswordField.classList.toggle("d-none", true);

            // Enable register button
            registerButton.removeAttribute("disabled")
        }
    }
});

