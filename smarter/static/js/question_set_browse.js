document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("confirmDeleteModal");
    modal.addEventListener("show.bs.modal", function(event) {
        const button = event.relatedTarget;
        const setId = button.getAttribute("data-bs-set-id");

        const modalForm = document.getElementById("confirmDeleteForm");
        modalForm.action = `/question-sets/remove/${setId}`;
    })
});
