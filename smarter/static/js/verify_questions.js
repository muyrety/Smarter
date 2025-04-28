document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("confirmDeleteModal");
    modal.addEventListener("show.bs.modal", function(event) {
        const button = event.relatedTarget;
        const questionId = button.getAttribute("data-bs-question-id");

        const modalForm = document.getElementById("confirmDeleteForm");
        modalForm.action = `/admin/remove/${questionId}`;
    })
});
