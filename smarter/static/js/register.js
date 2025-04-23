document.addEventListener("DOMContentLoaded", function() {
    const passwordField = document.getElementById("password");
    const repeatPasswordField = document.getElementById("repeatPassword");

    const badPasswordField = document.getElementById("badPasswordField");
    const registerButton = document.getElementById("registerButton");

    passwordField.addEventListener("input", checkPassword);
    repeatPasswordField.addEventListener("input", checkPassword);

    document.getElementById("togglePassword").addEventListener("click", function() {
        togglePasswordVisibility(document.getElementById("password"), document.getElementById("passwordIcon"));
    });

    document.getElementById("toggleRepeatPassword").addEventListener("click", function() {
        togglePasswordVisibility(document.getElementById("repeatPassword"), document.getElementById("repeatPasswordIcon"));
    });


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

    function togglePasswordVisibility(passwordInput, icon) {
        const isPassword = passwordInput.getAttribute("type") === "password";

        // Toggle the attribute
        passwordInput.setAttribute("type", isPassword ? "text" : "password");

        // Toggle the eye icon classes using Bootstrap Icons
        icon.classList.toggle("bi-eye");
        icon.classList.toggle("bi-eye-slash");
    }
});
