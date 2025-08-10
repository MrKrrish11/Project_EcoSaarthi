// public/js/signup.js - DEFINITIVE & WORKING VERSION

import { PROFILE_DATABASE } from './common/data.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const roleSelect = document.getElementById('currentRole');
    const errorMessage = document.getElementById('error-message');

    // Populate roles dropdown
    for (const key in PROFILE_DATABASE) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PROFILE_DATABASE[key].title;
        roleSelect.appendChild(option);
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const data = {
            firstName: form.querySelector('#firstName').value,
            lastName: form.querySelector('#lastName').value,
            email: form.querySelector('#email').value,
            phone: form.querySelector('#phone').value,
            password: form.querySelector('#password').value,
            currentRole: form.querySelector('#currentRole').value,
            monthlyIncome: form.querySelector('#monthlyIncome').value
        };

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            // --- THE FIX: Redirect to the index page ---
            alert('Welcome to EcoSaerthi! You are now logged in.');
            window.location.href = 'index.html';
            // --- END OF FIX ---

        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
});