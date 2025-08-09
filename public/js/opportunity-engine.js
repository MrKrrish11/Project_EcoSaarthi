// public/js/opportunity-engine.js - V6 (DEFINITIVE & CHATBOT-POWERED)

const elements = {
    chatWindow: document.getElementById('chat-window'),
    chatInput: document.getElementById('chat-input'),
    sendBtn: document.getElementById('send-chat-btn'),
};

function displayMessage(text, sender, contentHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    if (contentHtml) {
        messageDiv.innerHTML = text;
    } else {
        messageDiv.textContent = text;
    }
    
    elements.chatWindow.appendChild(messageDiv);
    // Auto-scroll to the bottom
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
}

function showTypingIndicator() {
    const indicatorHtml = `
        <div class="chat-message bot typing-indicator" id="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    elements.chatWindow.insertAdjacentHTML('beforeend', indicatorHtml);
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function handleSendMessage() {
    const query = elements.chatInput.value.trim();
    if (!query) return;

    // 1. Display the user's message immediately
    displayMessage(query, 'user');
    elements.chatInput.value = '';

    // 2. Show the "typing..." indicator
    showTypingIndicator();

    try {
        // 3. Call the backend API
        const response = await fetch(`/api/schemes?query=${query}`);
        const result = await response.json();

        // 4. Remove the indicator
        removeTypingIndicator();

        if (!response.ok) {
            throw new Error(result.error || 'An unknown server error occurred.');
        }

        const schemes = result.data;

        // 5. Display the bot's response
        if (!schemes || schemes.length === 0) {
            displayMessage("I couldn't find any specific schemes for that query on official sites. Could you try being more specific, perhaps with a term like 'agricultural loan' or 'women's startup grant'?", 'bot');
        } else {
            displayMessage(`I found ${schemes.length} relevant schemes for "${query}":`, 'bot');
            schemes.forEach(scheme => {
                const schemeHtml = `
                    <h4>${scheme.scheme_name}</h4>
                    <p>${scheme.brief || 'No summary available.'}</p>
                    <a href="${scheme.official_website}" target="_blank">Visit Official Site &rarr;</a>
                `;
                displayMessage(schemeHtml, 'bot', true);
            });
        }

    } catch (error) {
        console.error("Error fetching/rendering schemes:", error);
        removeTypingIndicator();
        displayMessage(`Sorry, I ran into an error. Reason: ${error.message}`, 'bot');
    }
}

function initialize() {
    // Add initial welcome message
    displayMessage("Hello! How can I help you find a government scheme today? Try asking about a 'loan for students' or 'scholarship for girls'.", 'bot');

    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.chatInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    });
}

initialize();