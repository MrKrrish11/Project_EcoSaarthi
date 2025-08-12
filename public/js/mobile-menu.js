// public/js/mobile-menu.js
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions'); // For index page

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            if (navMenu) {
                navMenu.classList.toggle('active');
            }
            if (navActions) {
                navActions.classList.toggle('active');
            }
        });
    }
});