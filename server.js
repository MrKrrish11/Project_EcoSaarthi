// server.js - THE COMPLETE AND FINAL VERSION

// --- 1. SETUP AND IMPORTS ---
const express = require('express');
const path = require('path');
const fs = require('fs');
// Make sure you have run "npm install node-fetch@2"
const fetch = require('node-fetch'); 

// --- 2. INITIALIZE THE APP ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 3. MIDDLEWARE ---
// This serves all static files (HTML, CSS, JS) from the 'public' folder.
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. API ROUTES ---

// API Endpoint for Government Schemes
app.get('/api/schemes', (req, res) => {
    try {
        const dbPath = path.join(__dirname, 'data', 'db.json');
        const jsonData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        res.json(jsonData.schemes);
    } catch (error) {
        console.error("Error reading schemes from db.json:", error);
        res.status(500).json({ error: "Could not load scheme data." });
    }
});

// API Endpoint for Career Compass
app.get('/api/jobs', async (req, res) => {
    const query = req.query.query || 'developer';
    const location = req.query.location || 'remote';
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)} in ${encodeURIComponent(location)}`;
    
    const options = {
        method: 'GET',
        headers: {
            // !!! IMPORTANT: PASTE YOUR REAL API KEY HERE !!!
            'X-RapidAPI-Key': '6a0c5614e3msh4ebfeaf69679eadp115b05jsn5359c439f42c', 
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
    };

    try {
        const apiResponse = await fetch(url, options);
        const jobsData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`RapidAPI returned an error: ${apiResponse.status}`);
            console.error('Response Body:', jobsData);
            return res.status(apiResponse.status).json({ error: `RapidAPI Error: ${jobsData.message}` });
        }
        
        // The API returns the job list inside a 'data' property
        res.json(jobsData.data);

    } catch (error) {
        console.error('!!! A CRITICAL NETWORK-LEVEL ERROR OCCURRED !!!');
        console.error('The full error object is:', error);
        res.status(500).json({ error: 'Failed to fetch job data due to a network or fetch error.' });
    }
});

// --- 5. START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Ready to receive requests at /api/schemes and /api/jobs');
});