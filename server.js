// server.js - THE COMPLETE AND FINAL VERSION

// --- 1. SETUP AND IMPORTS ---
const express = require('express');
const path = require('path');
const fs = require('fs');
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
            'X-RapidAPI-Key': '6a0c5614e3msh4ebfeaf69679eadp115b05jsn5359c439f42c', // <-- PASTE YOUR KEY HERE
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
    };

    console.log('--- ATTEMPTING TO FETCH JOBS ---');
    console.log('URL:', url);
    
    try {
        const apiResponse = await fetch(url, options);
        
        if (!apiResponse.ok) {
            console.error(`RapidAPI responded with status: ${apiResponse.status}`);
            const errorBody = await apiResponse.text();
            console.error(`Response body from RapidAPI: ${errorBody}`);
            return res.status(apiResponse.status).json({ error: `RapidAPI Error: ${errorBody}` });
        }

        const jobsData = await apiResponse.json();

        if (jobsData && jobsData.data) {
            res.json(jobsData.data);
        } else {
            console.error('JSearch API did not return the expected .data structure.');
            res.status(500).json({ error: 'Unexpected API response structure.' });
        }

    } catch (error) {
        console.error('!!! FETCH FAILED - A NETWORK-LEVEL ERROR OCCURRED !!!');
        console.error('The full error object is:', error);
        res.status(500).json({ error: 'Failed to fetch job data due to a network or fetch error.' });
    }
});

// --- 5. START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});