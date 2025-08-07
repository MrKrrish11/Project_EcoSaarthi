// public/js/login.js - UPGRADED TO SAVE INCOME

import { PROFILE_DATABASE } from './common/data.js';

document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('user-profile');
    const incomeInput = document.getElementById('user-income');
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
        const userIncome = parseFloat(incomeInput.value);

        if (isNaN(userIncome) || userIncome < 0) {
            alert('Please enter a valid monthly income.');
            return;
        }

        // Save BOTH pieces of data to the browser's local storage
        localStorage.setItem('loggedInUserKey', selectedProfileKey);
        localStorage.setItem('userIncome', userIncome); // Save income
        
        window.location.href = 'dashboard.html';
    });
});