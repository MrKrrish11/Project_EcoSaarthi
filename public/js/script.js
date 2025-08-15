document.addEventListener("DOMContentLoaded", function() {

    // --- Fade-in on Scroll Animation for Features ---
    const featureRows = document.querySelectorAll('.feature-row');

    if (featureRows.length > 0) {
        const observerOptions = {
            root: null, // observes intersections relative to the viewport
            rootMargin: '0px',
            threshold: 0.1 // Triggers when 10% of the element is visible
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // If the element is intersecting (visible)
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing the element once it's visible
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Start observing each feature row
        featureRows.forEach(row => {
            observer.observe(row);
        });
    }

});