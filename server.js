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

// In server.js, replace ONLY this specific route.

// Route to fetch DEFINITIVE HISTORICAL economic data
app.get('/api/economic-data', async (req, res) => {
    const FRED_API_KEY = '4ed2fb1b3c5416d4b1ae9dc2463903d0';
    
    const year = req.query.year || new Date().getFullYear() - 1;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // --- USING YOUR PROVIDED GDP DATA ---
    const GDP_DATA = {
        "2024": "6.5", "2023": "8.15", "2022": "6.99", "2021": "9.69",
        "2020": "-5.78", "2019": "3.87", "2018": "6.45", "2017": "6.8",
        "2016": "8.26", "2015": "8.0"
    };

    const seriesIds = {
        inflation: 'CPALTT01INM659N', // Monthly Inflation YoY
        inr_usd: 'DEXINUS',
        usd_eur: 'DEXUSEU',
        usd_jpy: 'DEXJPUS',
        usd_gbp: 'DEXUSUK',
        usd_aud: 'DEXUSAL',
        interestRate: 'INREPO'
    };

    const fredUrl = (seriesId) => `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDate}&observation_end=${endDate}&sort_order=desc`;

    try {
        const responses = await Promise.all(Object.values(seriesIds).map(id => fetch(fredUrl(id))));
        const [
            inflationData, inrUsdData, usdEurData, usdJpyData, 
            usdGbpData, usdAudData, interestRateData
        ] = await Promise.all(responses.map(r => r.json()));
        
        const results = {
            inflation: (inflationData.observations?.[0] || { value: "N/A" }).value,
            interestRate: (interestRateData.observations?.[0] || { value: "N/A" }).value,
            inr_usd: parseFloat((inrUsdData.observations?.[0] || { value: 0 }).value),
            usd_eur: parseFloat((usdEurData.observations?.[0] || { value: 0 }).value),
            usd_jpy: parseFloat((usdJpyData.observations?.[0] || { value: 0 }).value),
            usd_gbp: parseFloat((usdGbpData.observations?.[0] || { value: 0 }).value),
            usd_aud: parseFloat((usdAudData.observations?.[0] || { value: 0 }).value),
        };

        const economicSummary = {
            inflation: results.inflation,
            gdp: GDP_DATA[year] || "Not Available", // Use your hardcoded data
            interestRate: results.interestRate,
            exchangeRates: {
                usd: results.inr_usd,
                eur: results.inr_usd * results.usd_eur,
                jpy: results.inr_usd / results.usd_jpy,
                gbp: results.inr_usd * results.usd_gbp,
                aud: results.inr_usd * results.usd_aud
            }
        };
        
        let aiExplanation = "AI analysis could not be generated.";
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const prompt = `Analyze India's economy for ${year}. Data: Inflation ${economicSummary.inflation}%, GDP Growth ${economicSummary.gdp}%. Explain the impact on the average person. Be concise.`;
            const result = await model.generateContent(prompt);
            aiExplanation = (await result.response).text();
        } catch (aiError) { console.error("GEMINI API FAILED:", aiError.message); }
        
        res.json({ data: economicSummary, explanation: aiExplanation });

    } catch (error) {
        console.error("CRITICAL Error in /api/economic-data route:", error);
        res.status(500).json({ error: "Failed to fetch primary economic data." });
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

// In server.js, in the API ROUTES section, add this entire new route:

app.post('/api/tax-advice', async (req, res) => {
    try {
        const { profession } = req.body;
        if (!profession) {
            return res.status(400).json({ error: 'Profession is required.' });
        }

        const model = genAI.getGenerModel({ model: 'gemini-pro' });
        
        const prompt = `
            You are "EcoSaerthi AI," an expert tax advisor for freelancers in India.
            A user with the profession "${profession}" has asked for help finding tax deductions.
            List 4-5 common, often-missed tax deductions relevant to this profession.
            For each deduction, provide a brief, one-sentence explanation.
            Keep the tone helpful and professional. Use markdown for bolding category headers.

            Example for "Photographer":
            **Home Office Expenses:** A portion of your rent and electricity bills can be claimed if you work from home.
            **Depreciation on Equipment:** You can claim depreciation on your cameras, lenses, and computer each year.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ advice: response.text() });

    } catch (error) {
        console.error("Error in /api/tax-advice route:", error);
        res.status(500).json({ error: "Failed to generate AI tax advice." });
    }
});

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Ready to receive requests at /api/schemes and /api/jobs');
});

