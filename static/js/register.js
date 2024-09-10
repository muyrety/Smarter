document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");
    const usernameTakenField = document.getElementById("usernameTakenField");
    const registerButton = document.getElementById("registerButton");

    usernameField.addEventListener("input", function() {
        const username = usernameField.value.trim(); 
        if (username) {
            checkUsername(username);
        }
        else {
            usernameTakenField.style.display = "none"; 
            registerButton.removeAttribute("disabled");
        }
    });

    async function checkUsername(username) {
        const url = "api/check_username";
        let form = new FormData()
        form.append("username", username)

        try {
            const response = await fetch(url, {
                method: "POST",
                body: form,
            });
            const data = await response.json();
            if (!data.available) {
                usernameTakenField.style.display = "block";
                registerButton.setAttribute("disabled", "");
            } 
            else {
                usernameTakenField.style.display = "none";
                registerButton.removeAttribute("disabled");
            }
        } 
        catch (error) {
            console.error("Error checking username:", error);
        }
    }
});

