document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("joinGame");
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const uuid = form.elements.uuid.value;
        window.location.replace(`/join/${uuid}`);
    });
});
