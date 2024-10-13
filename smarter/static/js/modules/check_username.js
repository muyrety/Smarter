// Returns true if the username is in use
export async function checkUsername(username) {
    const url = `/api/check_username?username=${username}`;
    try {
        const response = await fetch(url);
        const response_json = await response.json();
        return response_json.taken;
    } 
    catch (error) {
        console.error(error);
    }
}
