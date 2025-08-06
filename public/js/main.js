document.addEventListener('DOMContentLoaded', () => {
    // Get the navigation items from the document
    const loginNavItem = document.getElementById('login-nav-item');
    const dashboardNavItem = document.getElementById('dashboard-nav-item');
    const logoutNavItem = document.getElementById('logout-nav-item');

    // Check if a user key exists in local storage
    const loggedInUserKey = localStorage.getItem('loggedInUserKey');

    if (loggedInUserKey) {
        // --- USER IS LOGGED IN ---
        if (loginNavItem) loginNavItem.classList.add('hidden');       // Hide Login button
        if (dashboardNavItem) dashboardNavItem.classList.remove('hidden'); // Show Dashboard button
        if (logoutNavItem) logoutNavItem.classList.remove('hidden');    // Show Logout button
    } else {
        // --- USER IS LOGGED OUT ---
        if (loginNavItem) loginNavItem.classList.remove('hidden');  // Show Login button
        if (dashboardNavItem) dashboardNavItem.classList.add('hidden');   // Hide Dashboard button
        if (logoutNavItem) logoutNavItem.classList.add('hidden');     // Hide Logout button
    }

    // Attach the logout functionality to the logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('loggedInUserKey'); // Clear the user session
            alert('You have been logged out.');
            window.location.href = '/login.html'; // Redirect to login page
        });
    }
});