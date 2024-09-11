document.addEventListener("DOMContentLoaded", function() {
    const usernameField = document.getElementById("username");
    const badUsernameField = document.getElementById("badUsernameField");
    const loginButton = document.getElementById("loginButton");

    usernameField.addEventListener("input", function() {
        const username = usernameField.value.trim(); 
        if (username) {
            checkUsername(username);
        }
        else {
            badUsernameField.style.display = "none"; 
            loginButton.removeAttribute("disabled");
        }
    });

    async function checkUsername(username) {
        const url = "api/check_username";
        let form = new FormData()
        form.append("username", username)

        try {
            const response = await fetch(url, {
                method: "POST",
                body: form
            });
            const data = await response.json();
            if (data.available) {
                badUsernameField.style.display = "block";
                loginButton.setAttribute("disabled", "");
            } 
            else {
                badUsernameField.style.display = "none";
                loginButton.removeAttribute("disabled");
            }
        } 
        catch (error) {
            console.error("Error checking username:", error);
        }
    }
});
