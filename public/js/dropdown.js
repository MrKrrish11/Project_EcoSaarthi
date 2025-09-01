document.addEventListener("DOMContentLoaded", function() {
    const dropdownBtn = document.getElementById('features-dropdown-btn');
    const dropdownMenu = dropdownBtn.nextElementSibling;

    if (dropdownBtn && dropdownMenu) {
        // --- Logic to toggle the dropdown on button click ---
        dropdownBtn.addEventListener('click', function(event) {
            // Stop the click from bubbling up to the document,
            // which would immediately close the menu.
            event.stopPropagation();
            
            // Toggle the 'active' class to show/hide the menu
            dropdownMenu.classList.toggle('active');
        });

        // --- Logic to close the dropdown if user clicks anywhere else ---
        document.addEventListener('click', function(event) {
            // If the dropdown is active AND the click was outside of it and its button
            if (dropdownMenu.classList.contains('active') && !dropdownBtn.contains(event.target)) {
                dropdownMenu.classList.remove('active');
            }
        });

        // --- Optional: Logic to close the dropdown on 'Escape' key press ---
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && dropdownMenu.classList.contains('active')) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
});