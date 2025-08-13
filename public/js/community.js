// public/js/community.js

document.addEventListener('DOMContentLoaded', () => {
    // Establish a connection to the server's Socket.IO
    const socket = io();

    const messages = document.getElementById('messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    // Function to append a message to the chat window
    function appendMessage(msg) {
        const item = document.createElement('li');
        
        const authorSpan = document.createElement('span');
        authorSpan.className = 'message-author';
        authorSpan.textContent = msg.authorName + ': ';

        const contentSpan = document.createElement('span');
        contentSpan.className = 'message-content';
        contentSpan.textContent = msg.content;
        
        item.appendChild(authorSpan);
        item.appendChild(contentSpan);
        
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight; // Auto-scroll to the bottom
    }
    
    // Listen for the form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {

            console.log('CLIENT: Sending message:', input.value); 
            // Send the message content to the server
            socket.emit('chat message', input.value);
            input.value = ''; // Clear the input field
        }
    });

    // Listen for incoming messages from the server
    socket.on('chat message', (msg) => {
        console.log('CLIENT: Received message from server:', msg); 
        appendMessage(msg);
    });

    // Listen for historical messages from the server on connect
    socket.on('load history', (history) => {
        messages.innerHTML = ''; // Clear the list before loading
        history.forEach(msg => {
            appendMessage(msg);
        });
    });

    // Handle connection errors (e.g., if user is not logged in)
    socket.on('connect_error', (err) => {
        console.error('Connection Failed:', err.message);
        const container = document.querySelector('.chat-container');
        container.innerHTML = '<h1>Authentication Failed</h1><p>You must be logged in to access the community chat. Please <a href="/login.html">log in</a>.</p>';
    });
});