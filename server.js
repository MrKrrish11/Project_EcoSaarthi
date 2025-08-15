require('dotenv').config();

// --- 1. SETUP AND IMPORTS ---
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');

// --- 2. INITIALIZATION & CONFIGURATION ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
const USERS_DB_PATH = path.join(__dirname, 'data', 'users.json');
const { PROFILE_DATABASE } = require('./public/js/common/data');

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
    content: String,
    authorName: String,
    authorId: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// --- 4. MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

// --- 5. HELPER FUNCTIONS ---
const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeUsers = (data) => fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));

async function generateAiAdvice(userProfile, targetJob) {
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
        console.error("Gemini API Error:", error);
        return "Could not generate AI advice at this time. The AI service may be experiencing high demand.";
    }
}

// --- 6. AUTH & UPLOAD CONFIGURATION ---
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

const protectRoute = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// --- 7. SOCKET.IO MIDDLEWARE & EVENTS ---
io.use((socket, next) => {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) return next(new Error('Authentication error: No cookie provided.'));
    const token = cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) return next(new Error('Authentication error: No token found.'));

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: Invalid token.'));
        const users = readUsers();
        const user = users.find(u => u.id === decoded.id);
        if (!user) return next(new Error('Authentication error: User not found.'));
        socket.user = { id: user.id, firstName: user.firstName };
        next();
    });
});

io.on('connection', async(socket) => {
    console.log(`User connected: ${socket.user.firstName} (${socket.id})`);

    try {
        const messages = await Message.find().sort({ timestamp: -1 }).limit(50).exec();
        socket.emit('load history', messages.reverse());
    } catch (error) {
        console.error('Error fetching message history:', error);
    }

    socket.on('chat message', async(content) => {
        if (!content.trim()) return;
        const newMessage = new Message({
            content,
            authorName: socket.user.firstName,
            authorId: socket.user.id
        });
        try {
            await newMessage.save();
            io.emit('chat message', newMessage);
        } catch (error) {
            console.error('SERVER: Error saving message to database:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.firstName} (${socket.id})`);
    });
});

// --- 8. API ROUTES ---

// == Authentication Routes ==
app.post('/api/auth/signup', async(req, res) => {
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
        const newUser = { id: Date.now().toString(), firstName, lastName, email, phone, hashedPassword, currentRole, monthlyIncome };
        users.push(newUser);
        writeUsers(users);

        const token = jwt.sign({ id: newUser.id, role: newUser.currentRole, income: newUser.monthlyIncome }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
        res.status(201).json({ message: 'User created successfully and logged in!' });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

app.post('/api/auth/login', async(req, res) => {
    try {
        const { email, password } = req.body;
        const users = readUsers();
        const user = users.find(u => u.email === email);
        if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ id: user.id, role: user.currentRole, income: user.monthlyIncome }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
        res.json({ message: 'Logged in successfully!' });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// == User Profile Routes ==
app.get('/api/user/profile', protectRoute, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { hashedPassword, ...userProfile } = user;
    res.json(userProfile);
});

app.put('/api/user/profile', protectRoute, (req, res) => {
    const { firstName, lastName, phone, currentRole, monthlyIncome } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    users[userIndex] = { ...users[userIndex], firstName, lastName, phone, currentRole, monthlyIncome };
    writeUsers(users);
    res.json({ message: 'Profile updated successfully!' });
});

app.post('/api/user/upload-photo', protectRoute, upload.single('profilePhoto'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const photoPath = `/uploads/${req.file.filename}`;
    users[userIndex].photoUrl = photoPath;
    writeUsers(users);
    res.json({ message: 'Photo uploaded successfully!', photoUrl: photoPath });
});

// == Opportunity Engine Route ==
app.get('/api/schemes', async(req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query is required.' });

    const searchQuery = `${query} government scheme site:gov.in OR site:nic.in`;
    const apiUrl = 'https://google.serper.dev/search';
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
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

// server.js

// == Career Compass Route (CLEANED UP & MIGRATED TO ADZUNA) ==
app.get('/api/jobs', protectRoute, async (req, res) => {
    try {
        const { query, location } = req.query;
        const users = readUsers();
        const userProfile = users.find(u => u.id === req.user.id);
        if (!userProfile) throw new Error("User profile not found.");
        
        // Construct the Adzuna API URL
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&content-type=application/json`;
        
        const jobsResponse = await fetch(url);
        const jobsData = await jobsResponse.json();
        
        if (!jobsResponse.ok) throw new Error(jobsData.message || 'Adzuna API Error');

        // IMPORTANT: Adzuna's data structure is different, so we transform it.
        const transformedJobs = jobsData.results.map(job => ({
            employer_name: job.company.display_name,
            job_title: job.title,
            job_description: job.description,
            job_apply_link: job.redirect_url,
            job_city: job.location.display_name,
            job_country: job.location.area[0]
        }));

        res.json({ jobs: transformedJobs, userProfile });

    } catch (error) { 
        res.status(500).json({ error: `Failed to fetch job data. Server error: ${error.message}` }); 
    }
});

// == AI Career Analysis Route (MIGRATED TO ADZUNA) ==
app.post('/api/ai/career-analysis', protectRoute, async (req, res) => {
    try {
        const { desiredJobTitle, location } = req.body;
        const users = readUsers();
        const userProfile = users.find(u => u.id === req.user.id);
        if (!userProfile) {
            return res.status(404).json({ message: "User profile not found." });
        }

        // Fetch the top job result from Adzuna to provide context to the AI
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&what=${encodeURIComponent(desiredJobTitle)}&where=${encodeURIComponent(location)}&results_per_page=1&content-type=application/json`;

        const jobsResponse = await fetch(url);
        const jobsData = await jobsResponse.json();

        if (!jobsResponse.ok) throw new Error(jobsData.message || 'Adzuna API Error');

        const topJobRaw = jobsData.results?.[0];
        if (!topJobRaw) {
            return res.status(404).json({ message: "Could not find any jobs for that title to analyze. Please try a different search." });
        }

        // Transform the single job for the AI function
        const topJob = {
            job_title: topJobRaw.title,
            job_description: topJobRaw.description
        };

        // Generate the AI advice using your existing helper
        const advice = await generateAiAdvice(userProfile, topJob);

        // Send the advice back to the client
        res.json({ advice });

    } catch (error) {
        console.error("Error in /api/ai/career-analysis:", error);
        res.status(500).json({ message: `Failed to generate AI analysis. Server error: ${error.message}` });
    }
});

// == Economic & Financial Routes ==
app.get('/api/economic-data', async(req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear() - 1;
        const GDP_DATA = { "2024": "6.5", "2023": "8.15", "2022": "6.99", "2021": "9.69", "2020": "-5.78", "2019": "3.87", "2018": "6.45", "2017": "6.8", "2016": "8.26", "2015": "8.0" };
        const seriesIds = { inflation: 'CPALTT01INM659N', inr_usd: 'DEXINUS', usd_eur: 'DEXUSEU', usd_jpy: 'DEXJPUS', usd_gbp: 'DEXUSUK', usd_aud: 'DEXUSAL', interestRate: 'INREPO' };
        const fredUrl = (seriesId) => `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${process.env.FRED_API_KEY}&file_type=json&observation_start=${year}-01-01&observation_end=${year}-12-31&sort_order=desc`;

        const responses = await Promise.all(Object.values(seriesIds).map(id => fetch(fredUrl(id))));
        const [inflationData, inrUsdData, usdEurData, usdJpyData, usdGbpData, usdAudData, interestRateData] = await Promise.all(responses.map(r => r.json()));

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
            gdp: GDP_DATA[year] || "Not Available",
            interestRate: results.interestRate,
            exchangeRates: {
                usd: results.inr_usd,
                eur: results.inr_usd * results.usd_eur,
                jpy: results.inr_usd / results.usd_jpy,
                gbp: results.inr_usd * results.usd_gbp,
                aud: results.inr_usd * results.usd_aud
            }
        };

        let aiExplanation = "AI analysis is currently unavailable.";
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

app.post('/api/financial-advice', async(req, res) => {
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

app.post('/api/tax-advice', async(req, res) => {
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

// == Investment Data Routes ==
app.post('/api/stock-data', async(req, res) => {
    const { symbol } = req.body;
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) throw new Error('Finnhub API error');
        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stock data.' });
    }
});

app.post('/api/crypto-data', async(req, res) => {
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

// --- 9. START SERVER ---
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("All routes are active and ready.");
});