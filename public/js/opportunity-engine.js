function fetchAndDisplaySchemes() {
    const schemesListDiv = document.getElementById('schemes-list');
    if (!schemesListDiv) return;

    fetch('/api/schemes')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(schemes => {
            schemesListDiv.innerHTML = '';
            if (schemes.length === 0) {
                schemesListDiv.innerHTML = '<p>No schemes found.</p>';
                return;
            }
            schemes.forEach(scheme => {
                const schemeCard = document.createElement('div');
                schemeCard.className = 'card';
                schemeCard.innerHTML = `<h3>${scheme.title}</h3><p><strong>Description:</strong> ${scheme.description}</p><p><strong>Eligibility:</strong> ${scheme.eligibility}</p><a href="${scheme.link}" class="btn btn-primary" target="_blank">Learn More</a>`;
                schemesListDiv.appendChild(schemeCard);
            });
        })
        .catch(error => {
            console.error('Error fetching schemes:', error);
            schemesListDiv.innerHTML = '<p class="error-message">Failed to load schemes.</p>';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('opportunity-engine.html')) {
        fetchAndDisplaySchemes();
    }
});