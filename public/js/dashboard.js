import { PROFILE_DATABASE } from './common/data.js';

document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');

    const loggedInUserKey = localStorage.getItem('loggedInUserKey');

    if (loggedInUserKey && PROFILE_DATABASE[loggedInUserKey]) {
        const userTitle = PROFILE_DATABASE[loggedInUserKey].title;
        welcomeMessage.textContent = `Welcome, ${userTitle}!`;
    } else {
        // If no one is logged in, protect this page
        window.location.href = '/login.html';
    }

    // Handle logout button click
    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('loggedInUserKey');
            window.location.href = '/login.html';
        });
    }
});