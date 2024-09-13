// Returns true if the username is in use
async function checkUsername(username) {
    const url = "api/check_username";
    let form = new FormData();
    form.append("username", username);

    try {
        const response = await fetch(url, {
            method: "POST",
            body: form
        });
        const data = await response.json();
        return data.taken;
    } 
    catch (error) {
        console.error("Error checking username:", error);
    }
}
