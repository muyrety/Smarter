document.addEventListener("DOMContentLoaded", function() {
    // Toggle the type attribute and icon
    document.getElementById("togglePassword").addEventListener("click", function() {
        const passwordInput = document.getElementById("password");
        const icon = document.getElementById("passwordIcon");

        const isPassword = passwordInput.getAttribute("type") === "password";

        // Toggle the attribute
        passwordInput.setAttribute("type", isPassword ? "text" : "password");

        // Toggle the eye icon classes using Bootstrap Icons
        icon.classList.toggle("bi-eye");
        icon.classList.toggle("bi-eye-slash");
    });
});
