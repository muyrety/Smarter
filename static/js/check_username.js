// Returns true if the username is in use
async function checkUsername(username) {
    const url = "api/check_username?username=" + username;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.taken;
    } 
    catch (error) {
        console.error("Error checking username:", error);
    }
}
