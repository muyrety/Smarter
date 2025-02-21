document.addEventListener("DOMContentLoaded", function() {
    const gameID = document.getElementById("gameID").textContent;
    const joinURL = window.location.origin + "/join/" + gameID;
    new QRCode("qrCode", joinURL);
});
