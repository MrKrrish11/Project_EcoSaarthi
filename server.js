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

const multer = require('multer');
require('dotenv').config();

// --- 2. INITIALIZATION & CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: This needs to be configured with your key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// --- 5. MULTER CONFIG FOR FILE UPLOADS ---
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        // Use user ID to ensure unique filenames
        cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// --- 6. AUTH MIDDLEWARE (To protect routes) ---
const protectRoute = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user payload to the request
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};




// In server.js, replace ONLY the generateAiAdvice function with this one.

// --- 3. HELPER FUNCTIONS (YOUR EXISTING FUNCTIONS) ---
// readUsers(), writeUsers(), etc.
const { PROFILE_DATABASE } = require('./public/js/common/data'); // Make sure path is correct

// --- 4. AI HELPER FUNCTION (YOUR EXISTING FUNCTION - NO CHANGES NEEDED) ---
async function generateAiAdvice(userProfile, targetJob) {
    // This function can now correctly access the 'genAI' object
    try {
        const fullUserProfile = PROFILE_DATABASE[userProfile.currentRole] || { title: userProfile.currentRole, skills: [] };
        const safeTargetTitle = targetJob?.job_title || 'the target job';
        const safeTargetDescription = targetJob?.job_description?.substring(0, 1000) || 'No detailed description was provided for this job listing.';

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
            You are an expert career advisor.
            A user with the current profile is considering a new job. Provide a short, 3-paragraph analysis.

            **User's Current Profile ("From"):**
            - Title: ${fullUserProfile.title}
            - Current Skills: ${fullUserProfile.skills.join(', ')}

            **Target Job ("To"):**
            - Title: ${safeTargetTitle}
            - Description: ${safeTargetDescription}
        `;
        const result = await model.generateContent(prompt);
        return (await result.response).text();
    } catch (error) {
        // --- IMPORTANT: Let's log the REAL error for debugging ---
        console.error("Gemini API Error:", error); 
        return "Could not generate AI advice at this time. The AI service may be experiencing high demand.";
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

// == NEW USER PROFILE ROUTES ==
app.get('/api/user/profile', protectRoute, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // IMPORTANT: Never send the hashed password to the frontend
    const { hashedPassword, ...userProfile } = user;
    res.json(userProfile);
});

app.put('/api/user/profile', protectRoute, (req, res) => {
    const { firstName, lastName, phone, currentRole, monthlyIncome } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    // Update user data
    users[userIndex] = { ...users[userIndex], firstName, lastName, phone, currentRole, monthlyIncome };
    writeUsers(users);
    res.json({ message: 'Profile updated successfully!' });
});

app.post('/api/user/upload-photo', protectRoute, upload.single('profilePhoto'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    // Save the path to the uploaded file
    const photoPath = `/uploads/${req.file.filename}`;
    users[userIndex].photoUrl = photoPath;
    writeUsers(users);

    res.json({ message: 'Photo uploaded successfully!', photoUrl: photoPath });
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



// In server.js

// == AI Career Analysis Route (NEW & CORRECT) ==
app.post('/api/ai/career-analysis', protectRoute, async (req, res) => {
    try {
        const { desiredJobTitle, location } = req.body; // Get data from POST body
        const JSEARCH_API_KEY = '6a0c5614e3msh4ebfeaf69679eadp115b05jsn5359c439f42c';

        // 1. Find the user's profile
        const users = readUsers();
        const userProfile = users.find(u => u.id === req.user.id);
        if (!userProfile) {
            return res.status(404).json({ message: "User profile not found." });
        }

        // 2. Fetch the top job result to provide context to the AI
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(desiredJobTitle)} in ${encodeURIComponent(location)}`;
        const options = { headers: { 'X-RapidAPI-Key': JSEARCH_API_KEY, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' } };
        
        const jobsResponse = await fetch(url, options);
        const jobsData = await jobsResponse.json();

        if (!jobsResponse.ok) {
            throw new Error(jobsData.message || 'JSearch API Error');
        }

        const topJob = jobsData.data?.[0]; // Safely get the first job
        if (!topJob) {
            return res.status(404).json({ message: "Could not find any jobs for that title to analyze. Please try a different search." });
        }

        // 3. Generate the AI advice using your existing helper
        const advice = await generateAiAdvice(userProfile, topJob);

        // 4. Send the advice back to the client
        res.json({ advice });

    } catch (error) {
        console.error("Error in /api/ai/career-analysis:", error);
        res.status(500).json({ message: `Failed to generate AI analysis. Server error: ${error.message}` });
    }
});




// In server.js

// == Career Compass Route (CLEANED UP) ==
app.get('/api/jobs', protectRoute, async (req, res) => {
    try {
        const { query, location } = req.query;
        const JSEARCH_API_KEY = '6a0c5614e3msh4ebfeaf69679eadp115b05jsn5359c439f42c';
        
        // Find the user's profile to pass to the frontend for the non-AI analysis
        const users = readUsers();
        const userProfile = users.find(u => u.id === req.user.id);
        if (!userProfile) throw new Error("User profile not found.");

        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)} in ${encodeURIComponent(location)}`;
        const options = { headers: { 'X-RapidAPI-Key': JSEARCH_API_KEY, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' } };
        
        const jobsResponse = await fetch(url, options);
        const jobsData = await jobsResponse.json();
        
        if (!jobsResponse.ok) throw new Error(jobsData.message || 'JSearch API Error');
        
        // This route now ONLY returns jobs and the user profile. No AI part.
        res.json({ jobs: jobsData.data, userProfile });

    } catch (error) { 
        res.status(500).json({ error: `Failed to fetch job data. Server error: ${error.message}` }); 
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
        
        let aiExplanation = "AI analysis could not be generated due to an API error.";
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `You are an economist explaining the situation in India for the year ${year}. Data: Inflation ${economicSummary.inflation}%, GDP Growth ${economicSummary.gdp}%. Explain the impact on the average person. Be concise.`;
            const result = await model.generateContent(prompt);
            aiExplanation = (await result.response).text();
        } catch (aiError) {
            console.error("GEMINI API FAILED:", aiError.message);
        }
        
        res.json({ data: economicSummary, explanation: aiExplanation });

    } catch (error) {
        console.error("Error in /api/economic-data:", error);
        res.status(500).json({ error: 'Failed to fetch economic data.' });
    }

});

// == Pocket CFO Route ==
app.post('/api/financial-advice', async (req, res) => {
    try {
        const { spendingData } = req.body;
        if (!spendingData) return res.status(400).json({ error: 'Invalid spending data.' });
        
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a friendly financial coach. A user's monthly income is ₹${spendingData.income} and their recent transactions are ${JSON.stringify(spendingData.transactions)}. Analyze their spending and provide 2-3 actionable saving tips in a bulleted list.`;
        
        const result = await model.generateContent(prompt);
        res.json({ advice: (await result.response).text() });
    } catch (error) {
        console.error("Error in /api/financial-advice:", error);
        res.status(500).json({ error: "Failed to generate AI financial advice." });
    }
});

// == Tax Buddy Route ==
app.post('/api/tax-advice', async (req, res) => {
    try {
        const { profession } = req.body;
        if (!profession) return res.status(400).json({ error: 'Profession is required.' });
        
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are an expert tax advisor for freelancers in India. A user's profession is "${profession}". List 4-5 common, often-missed tax deductions relevant to this profession. For each, provide a brief, one-sentence explanation. Use markdown for bolding.`;
        
        const result = await model.generateContent(prompt);
        res.json({ advice: (await result.response).text() });
    } catch (error) {
        console.error("Error in /api/tax-advice:", error);
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