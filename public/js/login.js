document.addEventListener('DOMContentLoaded', () => {
    // This is the same profile data from your main script.js
    const PROFILE_DATABASE = {
        'student': { title: 'Student / New Graduate' },
        'data analyst': { title: 'Data Analyst' },
        'economist': { title: 'Economist' },
        'software developer': { title: 'Software Developer' },
        'accountant': { title: 'Accountant' },
        'product manager': { title: 'Product Manager' }
    };

    const dropdown = document.getElementById('user-profile');
    const loginForm = document.getElementById('login-form');

    // Populate the dropdown with profiles
    for (const key in PROFILE_DATABASE) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PROFILE_DATABASE[key].title;
        dropdown.appendChild(option);
    }

    // Handle the login form submission
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent page reload
        const selectedProfileKey = dropdown.value;
        
        // Save the selected profile key to the browser's local storage
        localStorage.setItem('loggedInUserKey', selectedProfileKey);
        
        // Redirect the user to their dashboard
        window.location.href = '/dashboard.html';
    });
});