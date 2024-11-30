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
            badPasswordField.classList.remove("d-none");

            // Disable register button
            registerButton.disabled = true;
        }
        else {
            // Hide the message
            badPasswordField.classList.add("d-none");

            // Enable register button
            registerButton.disabled = false;
        }
    }
});
