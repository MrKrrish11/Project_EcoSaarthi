// server.js - FINAL VERSION WITH GEMINI AI INTEGRATION

// --- 1. SETUP AND IMPORTS ---
const express = require('express');
const path = require('path');
const fs = require('fs');
// Make sure you have run "npm install node-fetch@2"
const fetch = require('node-fetch'); 
// Make sure you have run "npm install @google/generative-ai"
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- 2. INITIALIZATION & CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the Gemini client with your API key.
// For a real-world app, you would store this key securely as an environment variable.
const genAI = new GoogleGenerativeAI('AIzaSyARtA4Gdr3gN-wx1j7udMPb4HXBZGk_yJo');

// --- 3. MIDDLEWARE ---
// This serves all static files (HTML, CSS, JS) from the 'public' folder.
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. AI HELPER FUNCTION ---
// This function cleanly separates the AI logic from our main route.
async function generateAiAdvice(userProfile, targetJob) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // DYNAMIC PROMPT ENGINEERING: This is the core of the feature.
        // We create a detailed, specific prompt for the AI based on live data.
        const prompt = `
            You are an expert career advisor named "EcoSaerthi AI".
            A user with the current profile is considering a new job. Provide a short, encouraging, and insightful analysis for them in 3 short paragraphs.

            **User's Current Profile ("From"):**
            - Title: ${userProfile.title}
            - Current Skills: ${userProfile.skills.join(', ')}

            **Target Job ("To"):**
            - Title: ${targetJob.job_title}
            - Description: ${targetJob.job_description.substring(0, 1000)}

            **Your Analysis (Use markdown for bolding):**
            1.  **Profitability & Shift Analysis:** Briefly comment on the career shift. Is it a logical step up? Is this field generally considered profitable and in demand?
            2.  **Future Scope:** Based on the job title and description, what is the likely 5-year scope or career trajectory in this field? Mention automation or AI trends if relevant.
            3.  **Salary & Final Advice:** Give a realistic estimated average salary range for this role in the job's location (e.g., "$80,000 - $110,000 USD per year"). Conclude with a single sentence of positive advice.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI advice:", error);
        // Return a helpful fallback message if the AI call fails for any reason.
        return "Could not generate AI advice at this time. This can happen due to high demand or API limits. Please try again in a moment.";
    }
}

// --- 5. API ROUTES ---

// Route for the Opportunity Engine
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

// The main route for the Career Compass, now with AI orchestration
app.get('/api/jobs', async (req, res) => {
    try {
        // Get data from the frontend request
        const query = req.query.query || 'developer';
        const location = req.query.location || 'remote';
        const userProfile = JSON.parse(req.query.userProfile);

        // Prepare and call the JSearch API to get job listings
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)} in ${encodeURIComponent(location)}`;
        const options = {
            method: 'GET',
            headers: {
                // !!! IMPORTANT: PASTE YOUR JSEARCH API KEY HERE !!!
                'X-RapidAPI-Key': '6a0c5614e3msh4ebfeaf69679eadp115b05jsn5359c439f42c',
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        };

        const jobsResponse = await fetch(url, options);
        const jobsData = await jobsResponse.json();
        
        if (!jobsResponse.ok) {
            // If JSearch gives an error, pass it to the catch block
            throw new Error(jobsData.message || `JSearch API responded with status: ${jobsResponse.status}`);
        }
        
        const jobs = jobsData.data;
        let aiAdvice = "Analysis will appear here. Search for a job to begin.";

        // If we got jobs, call our AI helper function with the top result
        if (jobs && jobs.length > 0) {
            aiAdvice = await generateAiAdvice(userProfile, jobs[0]);
        }

        // Send a single, combined response back to the frontend
        res.json({ jobs: jobs, aiAdvice: aiAdvice });

    } catch (error) {
        console.error('Error in /api/jobs route:', error);
        res.status(500).json({ error: 'Failed to fetch data. The external API may be down.' });
    }
});

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Ready to receive requests at /api/schemes and /api/jobs');
});