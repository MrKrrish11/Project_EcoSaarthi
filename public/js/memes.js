document.addEventListener('DOMContentLoaded', () => {
    // Get the elements from the HTML
    const generateBtn = document.getElementById('random-meme-btn');
    const memeDisplayArea = document.getElementById('meme-display-area');
    
    // Get all the source meme cards. The .querySelectorAll returns a list of all matching elements.
    const memeSources = document.querySelectorAll('#meme-source-container .meme-card');

    // Make sure the button exists before adding a listener
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            if (memeSources.length === 0) {
                memeDisplayArea.innerHTML = '<p>No memes found!</p>';
                return;
            }

            // 1. Generate a random number between 0 and the number of memes available
            const randomIndex = Math.floor(Math.random() * memeSources.length);

            // 2. Get the HTML content of the randomly selected meme card
            const randomMemeHtml = memeSources[randomIndex].outerHTML;

            // 3. Display the random meme in the display area
            memeDisplayArea.innerHTML = randomMemeHtml;
        });
    }
});