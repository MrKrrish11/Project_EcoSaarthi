// Imports the profile data from our shared file
import { PROFILE_DATABASE } from './common/data.js';

document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('user-profile');
    const loginForm = document.getElementById('login-form');

    if (!loginForm) return;

    // Populate the dropdown with profiles
    for (const key in PROFILE_DATABASE) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PROFILE_DATABASE[key].title;
        dropdown.appendChild(option);
    }

    // Handle the login form submission
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedProfileKey = dropdown.value;
        localStorage.setItem('loggedInUserKey', selectedProfileKey);
        window.location.href = '/dashboard.html';
    });
});