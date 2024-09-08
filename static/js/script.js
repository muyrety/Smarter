document.addEventListener("DOMContentLoaded", function() {
    let usernameField = document.getElementById("username");
    let usernameTakenField = document.getElementById("usernameTakenField");
    let submitButton = document.getElementById("registerButton");
    username.addEventListener("input", function() {
        const username = usernameField.value.trim(); 
        if (username) {
            checkUsername(username);
        }
        else {
            usernameTakenField.style.display = "none"; 
            submitButton.removeAttribute("disabled");
        }
    });

    async function checkUsername(username) {
        try {
            const response = await fetch("/api/check_username", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username: username })
            });
            const data = await response.json();
            if (!data.available) {
                usernameTakenField.style.display = "block";
                submitButton.setAttribute("disabled", "");
            } 
            else {
                usernameTakenField.style.display = "none";
                submitButton.removeAttribute("disabled");
            }
        } 
        catch (error) {
            console.error("Error checking username:", error);
        }
    }
});

