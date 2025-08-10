// server.js - THE DEFINITIVE & COMPLETE VERSION FOR THE ENTIRE PROJECT

// --- 1. SETUP AND IMPORTS ---
const express = require('express');
const path = require('path');
const fs = require('fs');
// Ensure you have run "npm install node-fetch@2"
const fetch = require('node-fetch'); 
// Ensure you have run "npm install @google/generative-ai"
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


// --- 2. INITIALIZATION & CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: This needs to be configured with your key
const genAI = new GoogleGenerativeAI('AIzaSyCjZaoR-SAXjFg-EwgOHZEzS7Y0IMaYjhI');

const JWT_SECRET = 'your-super-secret-key-that-should-be-in-an-env-file'; // For production, use environment variables
const USERS_DB_PATH = path.join(__dirname, 'data', 'users.json');


// --- 3. MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Required for all POST requests to work

app.use(cookieParser()); // Middleware to parse cookies

// --- 4. DATABASE HELPER FUNCTIONS ---
const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return []; // If the file doesn't exist or is empty, return an empty array
    }
};
const writeUsers = (data) => fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));



// --- 5. AI HELPER FUNCTION (REQUIRED FOR CAREER COMPASS) ---
// This was the function that was missing, causing the crash.
async function generateAiAdvice(userProfile, targetJob) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
        return "Could not generate AI advice at this time. This can happen due to high demand or API limits. Please try again in a moment.";
    }
}


// --- 6. API ROUTES ---


// == THIS IS THE UPGRADED SIGNUP ROUTE ==
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, currentRole, monthlyIncome } = req.body;
        if (!firstName || !lastName || !email || !password || !currentRole || !monthlyIncome) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        
        const users = readUsers();
        if (users.find(user => user.email === email)) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: Date.now().toString(),
            firstName, lastName, email, phone, hashedPassword, currentRole, monthlyIncome
        };
        users.push(newUser);
        writeUsers(users);

        // --- THE FIX: Immediately create a token and log the user in ---
        const token = jwt.sign({ id: newUser.id, role: newUser.currentRole, income: newUser.monthlyIncome }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 }); // Set the cookie
        // --- END OF FIX ---

        // Send a success message
        res.status(201).json({ message: 'User created successfully and logged in!' });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});


// == LOGIN ROUTE ==
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = readUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Create JWT
        const token = jwt.sign({ id: user.id, role: user.currentRole, income: user.monthlyIncome }, JWT_SECRET, { expiresIn: '1h' });

        // Send JWT as a secure, httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true, // Prevents JS access
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 3600000 // 1 hour
        });

        res.json({ message: 'Logged in successfully!' });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});



// == Opportunity Engine Route (Powered by Serper.dev) ==
app.get('/api/schemes', async (req, res) => {
    const SERPER_API_KEY = 'f6429ad00b6855a0b7559344b93fa24508ff2b6b';
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Search query is required.' });
    }
    const searchQuery = `${query} government scheme site:gov.in OR site:nic.in`;
    const apiUrl = 'https://google.serper.dev/search';
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: searchQuery })
        });
        const searchResults = await apiResponse.json();
        if (!apiResponse.ok) throw new Error(searchResults.message || 'Error from Serper API');
        const transformedData = (searchResults.organic || []).map(result => ({
            scheme_name: result.title,
            brief: result.snippet,
            official_website: result.link
        }));
        res.json({ data: transformedData });
    } catch (error) {
        console.error("Error fetching schemes from Serper.dev:", error.message);
        res.status(500).json({ error: `Failed to perform scheme search. Reason: ${error.message}` });
    }
});

// == Career Compass Route ==
app.get('/api/jobs', async (req, res) => {
    try {
        const { query, location, userProfile } = req.query;
        const JSEARCH_API_KEY = '6a0c5614e3msh4ebfeaf69679eadp115b05jsn5359c439f42c';
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)} in ${encodeURIComponent(location)}`;
        const options = { headers: { 'X-RapidAPI-Key': JSEARCH_API_KEY, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' } };
        const jobsResponse = await fetch(url, options);
        const jobsData = await jobsResponse.json();
        if (!jobsResponse.ok) throw new Error(jobsData.message);
        const jobs = jobsData.data;
        let aiAdvice = "AI analysis could not be generated.";
        if (jobs && jobs.length > 0 && userProfile) {
            const parsedProfile = JSON.parse(userProfile);
            // This line now works because the helper function exists
            aiAdvice = await generateAiAdvice(parsedProfile, jobs[0]);
        }
        res.json({ jobs, aiAdvice });
    } catch (error) {
        console.error("Error in /api/jobs", error);
        res.status(500).json({ error: 'Failed to fetch job data.' });
    }
});

// In server.js, replace ONLY the /api/economic-data route with this one.

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

    // All necessary series for the page to function
    const seriesIds = {
        inflation: 'CPALTT01INM659N',
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

// == Pocket CFO Route ==
app.post('/api/financial-advice', async (req, res) => {
    try {
        const { spendingData } = req.body;
        if (!spendingData) return res.status(400).json({ error: 'Invalid spending data.' });
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Analyze this user's spending and give 2-3 actionable saving tips. Data: ${JSON.stringify(spendingData)}`;
        const result = await model.generateContent(prompt);
        res.json({ advice: (await result.response).text() });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate AI financial advice." });
    }
});

// == Tax Buddy Route ==
app.post('/api/tax-advice', async (req, res) => {
    try {
        const { profession } = req.body;
        if (!profession) return res.status(400).json({ error: 'Profession is required.' });
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `List 4-5 common tax deductions for a freelancer in India whose profession is "${profession}".`;
        const result = await model.generateContent(prompt);
        res.json({ advice: (await result.response).text() });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate AI tax advice." });
    }
});

// == Future Wealth Builder Routes ==
app.post('/api/stock-data', async (req, res) => {
    const { symbol } = req.body;
    const FINNHUB_API_KEY = 'd2b36jpr01qrj4ik48q0d2b36jpr01qrj4ik48qg';
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error('Finnhub API error');
        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stock data.' });
    }
});
app.post('/api/crypto-data', async (req, res) => {
    const { id } = req.body;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=inr&include_24hr_change=true`;
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error('CoinGecko API error');
        const data = await apiResponse.json();
        res.json(data[id]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch crypto data.' });
    }
});

// --- 7. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("All routes are active and ready.");
});