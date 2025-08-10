// public/js/dashboard.js - DEFINITIVE & PROFESSIONAL VERSION

import { PROFILE_DATABASE } from './common/data.js';

const elements = {
    // Header Info
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    // Profile Photo
    profilePhoto: document.getElementById('profile-photo'),
    photoUpload: document.getElementById('photo-upload'),
    changePhotoBtn: document.getElementById('change-photo-btn'),
    // View Mode Spans
    viewFirstName: document.getElementById('view-firstName'),
    viewLastName: document.getElementById('view-lastName'),
    viewPhone: document.getElementById('view-phone'),
    viewCurrentRole: document.getElementById('view-currentRole'),
    viewMonthlyIncome: document.getElementById('view-monthlyIncome'),
    // Edit Mode Inputs
    editFirstName: document.getElementById('edit-firstName'),
    editLastName: document.getElementById('edit-lastName'),
    editPhone: document.getElementById('edit-phone'),
    editCurrentRole: document.getElementById('edit-currentRole'),
    editMonthlyIncome: document.getElementById('edit-monthlyIncome'),
    // Controls
    profileForm: document.getElementById('profile-form'),
    viewModeDiv: document.getElementById('profile-view-mode'),
    editModeDiv: document.getElementById('profile-edit-mode'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    profileMessage: document.getElementById('profile-message'),
};

let currentUserData = {};

function populateRoleDropdown() {
    for (const key in PROFILE_DATABASE) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PROFILE_DATABASE[key].title;
        elements.editCurrentRole.appendChild(option);
    }
}

function displayProfileData(user) {
    currentUserData = user;
    elements.userName.textContent = `${user.firstName} ${user.lastName}`;
    elements.userEmail.textContent = user.email;
    elements.profilePhoto.src = user.photoUrl || '/images/default-avatar.png';
    // View Mode
    elements.viewFirstName.textContent = user.firstName;
    elements.viewLastName.textContent = user.lastName;
    elements.viewPhone.textContent = user.phone;
    elements.viewCurrentRole.textContent = PROFILE_DATABASE[user.currentRole]?.title || user.currentRole;
    elements.viewMonthlyIncome.textContent = `₹${parseInt(user.monthlyIncome).toLocaleString()}`;
    // Edit Mode (pre-fill)
    elements.editFirstName.value = user.firstName;
    elements.editLastName.value = user.lastName;
    elements.editPhone.value = user.phone;
    elements.editCurrentRole.value = user.currentRole;
    elements.editMonthlyIncome.value = user.monthlyIncome;
}

function toggleEditMode(isEdit) {
    if (isEdit) {
        elements.viewModeDiv.classList.add('hidden');
        elements.editModeDiv.classList.remove('hidden');
    } else {
        elements.viewModeDiv.classList.remove('hidden');
        elements.editModeDiv.classList.add('hidden');
        elements.profileMessage.textContent = '';
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
            // If token is invalid or expired, redirect to login
            window.location.href = '/login.html';
            return;
        }
        const user = await response.json();
        displayProfileData(user);
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        window.location.href = '/login.html';
    }
}

async function handleProfileSave(e) {
    e.preventDefault();
    const updatedData = {
        firstName: elements.editFirstName.value,
        lastName: elements.editLastName.value,
        phone: elements.editPhone.value,
        currentRole: elements.editCurrentRole.value,
        monthlyIncome: elements.editMonthlyIncome.value,
    };
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        // Update local data and UI
        displayProfileData({ ...currentUserData, ...updatedData });
        toggleEditMode(false);
        elements.profileMessage.textContent = result.message;
        elements.profileMessage.classList.remove('error-message');

    } catch (error) {
        elements.profileMessage.textContent = error.message;
        elements.profileMessage.classList.add('error-message');
    }
}

async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePhoto', file);
    
    try {
        const response = await fetch('/api/user/upload-photo', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        // Update the image on the page
        elements.profilePhoto.src = result.photoUrl;
        elements.profileMessage.textContent = result.message;

    } catch (error) {
        elements.profileMessage.textContent = error.message;
        elements.profileMessage.classList.add('error-message');
    }
}

function init() {
    populateRoleDropdown();
    fetchUserProfile();

    elements.editProfileBtn.addEventListener('click', () => toggleEditMode(true));
    elements.cancelEditBtn.addEventListener('click', () => toggleEditMode(false));
    elements.profileForm.addEventListener('submit', handleProfileSave);
    elements.changePhotoBtn.addEventListener('click', () => elements.photoUpload.click());
    elements.photoUpload.addEventListener('change', handlePhotoUpload);
}

init();