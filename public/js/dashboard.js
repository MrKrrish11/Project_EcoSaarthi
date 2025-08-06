document.addEventListener('DOMContentLoaded', () => {
    const PROFILE_DATABASE = { /* (Copy the same PROFILE_DATABASE object here) */ };
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');

    // Check who is logged in
    const loggedInUserKey = localStorage.getItem('loggedInUserKey');

    if (loggedInUserKey && PROFILE_DATABASE[loggedInUserKey]) {
        // If a user is found, display a personalized welcome message
        const userTitle = PROFILE_DATABASE[loggedInUserKey].title;
        welcomeMessage.textContent = `Welcome, ${userTitle}!`;
    } else {
        // If no one is logged in, redirect to the login page
        window.location.href = '/login.html';
    }

    // Handle logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedInUserKey'); // Clear the stored user
        window.location.href = '/login.html';
    });
});