document.addEventListener("DOMContentLoaded", function() {
    let configForm = document.getElementById("configurationForm");
    configForm.addEventListener("submit", function(e) {
        e.preventDefault();
        // Get the selected categories text
        let category = configForm.elements.category.selectedOptions[0].textContent;
        let difficulty = configForm.elements.difficulty.value;
        configureTable(category, difficulty);
    });

    function configureTable(category, difficulty) {
        tableBody = document.getElementById("questionTableBody");

        // Loop over the rows in table body
        for (const row of tableBody.children) {
            const rowCategory = row.children[1].textContent;
            const rowDifficulty = row.children[2].textContent;

            // Show the entry if both category and difficulty match
            if ((category === "Any" || rowCategory === category) &&
                (difficulty === "any" || rowDifficulty === difficulty)) {
                row.classList.toggle("d-none", false)
            }
            // Hide the entry
            else {
                row.classList.toggle("d-none", true)
            }
        }

    }
});
