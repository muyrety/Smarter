document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");
    const usernameTakenField = document.getElementById("usernameTakenField");
    const submitButton = document.getElementById("registerButton");

    usernameField.addEventListener("input", function() {
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
        const url = "api/check_username";
        try {
            const response = await fetch(url, {
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

