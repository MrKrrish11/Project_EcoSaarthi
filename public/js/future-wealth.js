// public/js/future-wealth.js - FINAL DEFINITIVE VERSION - All features restored and working correctly.

// --- CONFIGURATION & DATA ---
const QUIZ_QUESTIONS = [
    { question: "When you think about investing, your primary goal is:", options: { "a": { text: "Preserving my capital and avoiding losses.", score: 1 }, "b": { text: "A balanced mix of safety and growth.", score: 2 }, "c": { text: "Maximizing my returns, even if it means taking big risks.", score: 3 } } },
    { question: "If your investments lost 20% of their value in a month, you would:", options: { "a": { text: "Sell to prevent further losses.", score: 1 }, "b": { text: "Hold and wait for the market to recover.", score: 2 }, "c": { text: "Buy more, seeing it as a great opportunity.", score: 3 } } },
    { question: "How long is your investment horizon?", options: { "a": { text: "Short-term (1-3 years)", score: 1 }, "b": { text: "Medium-term (3-10 years)", score: 2 }, "c": { text: "Long-term (10+ years)", score: 3 } } }
];
const INVESTMENT_SUGGESTIONS = {
    conservative: [ { type: 'stock', symbol: 'SPY', name: 'S&P 500 ETF (SPY)', desc: 'Invest in the 500 largest US companies.' }, { type: 'stock', symbol: 'GLD', name: 'Gold ETF (GLD)', desc: 'Digital gold, a traditional safe-haven asset.' } ],
    moderate: [ { type: 'stock', symbol: 'MSFT', name: 'Microsoft Corp.', desc: 'A diversified global technology leader.' }, { type: 'stock', symbol: 'INFY', name: 'Infosys (US Listing)', desc: 'A global leader in IT services.' }, { type: 'crypto', id: 'bitcoin', name: 'Bitcoin (Small Allocation)', desc: 'The original cryptocurrency, for growth.' } ],
    aggressive: [ { type: 'stock', symbol: 'TSLA', name: 'Tesla Inc.', desc: 'A high-growth global leader in EVs and AI.' }, { type: 'crypto', id: 'ethereum', name: 'Ethereum', desc: 'A leading blockchain platform for smart contracts.' }, { type: 'crypto', id: 'solana', name: 'Solana', desc: 'A high-speed blockchain network.' } ]
};
let state = { sips: [], riskProfile: null, retirementGoal: null };

// --- DOM ELEMENTS ---
const elements = {
    riskQuizCard: document.getElementById('risk-quiz-card'),
    riskQuizForm: document.getElementById('risk-quiz-form'),
    riskResultCard: document.getElementById('risk-result-card'),
    riskProfileResult: document.getElementById('risk-profile-result'),
    riskProfileDescription: document.getElementById('risk-profile-description'),
    retakeQuizBtn: document.getElementById('retake-quiz-btn'),
    investmentSuggestions: document.getElementById('investment-suggestions'),
    retirementCalcForm: document.getElementById('retirement-calc-form'),
    retirementResult: document.getElementById('retirement-result'),
    sipForm: document.getElementById('sip-form'),
    sipName: document.getElementById('sip-name'),
    sipAmount: document.getElementById('sip-amount'),
    sipList: document.getElementById('sip-list'),
    retirementProjectionCard: document.getElementById('retirement-projection-card'),
    retirementProjectionContent: document.getElementById('retirement-projection-content'),
};

// --- DATA PERSISTENCE ---
function saveState() { localStorage.setItem('wealthBuilderState', JSON.stringify(state)); }
function loadState() {
    const savedState = localStorage.getItem('wealthBuilderState');
    if (savedState) { state = JSON.parse(savedState); }
}

// --- RENDERING FUNCTIONS ---
function renderQuiz() {
    let quizHtml = '';
    QUIZ_QUESTIONS.forEach((q, index) => {
        quizHtml += `<div class="quiz-question"><p>${index + 1}. ${q.question}</p>`;
        for (const key in q.options) {
            quizHtml += `<label><input type="radio" name="q${index}" value="${q.options[key].score}" required> ${q.options[key].text}</label>`;
        }
        quizHtml += `</div>`;
    });
    const existingQuestions = elements.riskQuizForm.querySelectorAll('.quiz-question');
    existingQuestions.forEach(q => q.remove());
    elements.riskQuizForm.insertAdjacentHTML('afterbegin', quizHtml);
}

function renderRiskProfile() {
    if (state.riskProfile) {
        elements.riskQuizCard.classList.add('hidden');
        elements.riskResultCard.classList.remove('hidden');
        elements.riskProfileResult.textContent = state.riskProfile.charAt(0).toUpperCase() + state.riskProfile.slice(1);
        elements.riskProfileResult.className = state.riskProfile;
        let description = '';
        if (state.riskProfile === 'conservative') description = 'You prioritize capital preservation.';
        if (state.riskProfile === 'moderate') description = 'You seek a balance between growth and safety.';
        if (state.riskProfile === 'aggressive') description = 'You are willing to take on higher risk for greater returns.';
        elements.riskProfileDescription.textContent = description;
        renderInvestmentSuggestions();
    } else {
        elements.riskQuizCard.classList.remove('hidden');
        elements.riskResultCard.classList.add('hidden');
    }
}

async function renderInvestmentSuggestions() {
    if (!state.riskProfile) {
        elements.investmentSuggestions.innerHTML = '<p>Complete the risk profile quiz to unlock personalized investment ideas.</p>';
        return;
    }
    elements.investmentSuggestions.innerHTML = '<p>Loading live market data...</p>';
    const suggestions = INVESTMENT_SUGGESTIONS[state.riskProfile];
    let suggestionsHtml = '';
    for (const item of suggestions) {
        let priceHtml = '...';
        try {
            if (item.type === 'stock') {
                const response = await fetch('/api/stock-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: item.symbol }) });
                if (!response.ok) throw new Error('Stock API failed');
                const data = await response.json();
                const priceChangeClass = data.d > 0 ? 'positive' : 'negative';
                priceHtml = `<h3>$${(data.c).toFixed(2)}</h3><p class="${priceChangeClass}">${data.dp.toFixed(2)}%</p>`;
            } else if (item.type === 'crypto') {
                const response = await fetch('/api/crypto-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
                if (!response.ok) throw new Error('Crypto API failed');
                const data = await response.json();
                const priceChangeClass = data.inr_24h_change > 0 ? 'positive' : 'negative';
                priceHtml = `<h3>₹${data.inr.toLocaleString()}</h3><p class="${priceChangeClass}">${data.inr_24h_change.toFixed(2)}%</p>`;
            }
        } catch (error) {
            console.error("Failed to fetch market data for", item.name, error);
            priceHtml = '<p class="error-message">Data N/A</p>';
        }
        suggestionsHtml += `<div class="investment-card"><div class="info"><h4>${item.name}</h4><p>${item.desc}</p></div><div class="price">${priceHtml}</div></div>`;
    }
    elements.investmentSuggestions.innerHTML = suggestionsHtml;
}

function renderSips() {
    let totalSip = state.sips.reduce((sum, sip) => sum + sip.amount, 0);
    elements.sipList.innerHTML = state.sips.length === 0 
        ? '<p>No active SIPs. Add one to start tracking.</p>'
        : `<ul>${state.sips.map(sip => `<li><span>${sip.name} (₹${sip.amount.toLocaleString()}/mo)</span><button class="sip-item-remove-btn" data-id="${sip.id}">&times;</button></li>`).join('')}</ul>
           <hr><p><strong>Total Monthly SIP: ₹${totalSip.toLocaleString()}</strong></p>`;
    renderRetirementProjection();
}

function renderRetirementProjection() {
    if (!state.retirementGoal) {
        elements.retirementProjectionCard.classList.add('hidden');
        return;
    }
    const { targetCorpus, years, returnRate, currentSavings } = state.retirementGoal;
    const totalSip = state.sips.reduce((sum, sip) => sum + sip.amount, 0);
    if (totalSip === 0) {
        elements.retirementProjectionContent.innerHTML = '<p>Add an SIP to see your retirement projection.</p>';
        elements.retirementProjectionCard.classList.remove('hidden');
        return;
    }
    const n = years * 12;
    const r = (returnRate / 100) / 12;
    const futureValueOfLumpSum = currentSavings * Math.pow(1 + r, n);
    const futureValueOfSip = totalSip * ((Math.pow(1 + r, n) - 1) / r);
    const projectedCorpus = futureValueOfLumpSum + futureValueOfSip;
    const shortfall = targetCorpus - projectedCorpus;
    let contentHtml = `<div class="projection-summary">Your goal is <strong>₹${targetCorpus.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong>.<br>Based on your current SIPs, you are projected to have <strong>₹${projectedCorpus.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong>.</div>`;
    if (shortfall <= 0) {
        contentHtml += `<div class="projection-advice on-track">Congratulations! You are on track to meet your goal.</div>`;
    } else {
        const additionalSipNeeded = (shortfall * r) / (Math.pow(1 + r, n) - 1);
        contentHtml += `<div class="projection-advice off-track">You have a projected shortfall of ₹${shortfall.toLocaleString('en-IN', {maximumFractionDigits: 0})}.<br>Consider increasing your monthly SIPs by ~<strong>₹${additionalSipNeeded.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong>.</div>`;
    }
    elements.retirementProjectionContent.innerHTML = contentHtml;
    elements.retirementProjectionCard.classList.remove('hidden');
}

// --- EVENT HANDLERS ---
function handleQuizSubmit(e) {
    e.preventDefault();
    const formData = new FormData(elements.riskQuizForm);
    let totalScore = 0;
    for (const value of formData.values()) {
        totalScore += parseInt(value);
    }
    if (totalScore <= 4) state.riskProfile = 'conservative';
    else if (totalScore <= 7) state.riskProfile = 'moderate';
    else state.riskProfile = 'aggressive';
    saveState();
    renderRiskProfile();
}

function handleRetakeQuiz() {
    state.riskProfile = null;
    state.retirementGoal = null; // Also reset the goal when retaking the quiz
    saveState();
    renderRiskProfile();
    renderRetirementProjection(); // Hide the projection card
    elements.investmentSuggestions.innerHTML = '<p>Complete the risk profile quiz to unlock personalized investment ideas.</p>';
    elements.retirementResult.innerHTML = ''; // Clear old calculation results
}

function handleRetirementCalc(e) {
    e.preventDefault();
    const form = e.target;
    const currentAge = parseInt(form.querySelector('#current-age').value);
    const retirementAge = parseInt(form.querySelector('#retirement-age').value);
    const currentSavings = parseFloat(form.querySelector('#current-savings').value);
    const monthlyInvestment = parseFloat(form.querySelector('#monthly-investment').value);
    const annualReturn = parseFloat(form.querySelector('#return-rate').value);

    if (isNaN(currentAge) || isNaN(retirementAge) || isNaN(currentSavings) || isNaN(monthlyInvestment) || isNaN(annualReturn)) {
        elements.retirementResult.innerHTML = '<p class="error-message">Please fill all fields with valid numbers.</p>';
        return;
    }
    const yearsToInvest = retirementAge - currentAge;
    if (yearsToInvest <= 0) {
        elements.retirementResult.innerHTML = '<p class="error-message">Retirement age must be greater than current age.</p>';
        return;
    }
    const n = yearsToInvest * 12;
    const r = (annualReturn / 100) / 12;
    const futureValueOfLumpSum = currentSavings * Math.pow(1 + r, n);
    const futureValueOfSip = monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r);
    const totalCorpus = futureValueOfLumpSum + futureValueOfSip;
    const totalInvested = currentSavings + (monthlyInvestment * n);
    const wealthGained = totalCorpus - totalInvested;

    elements.retirementResult.innerHTML = `<ul class="retirement-result-details"><li><span>Principal Investment:</span> <strong>₹${totalInvested.toLocaleString('en-IN')}</strong></li><li><span>Wealth Gained:</span> <strong>₹${wealthGained.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong></li><li class="grand-total"><span>Final Corpus:</span> <strong>₹${totalCorpus.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong></li></ul>`;
    
    state.retirementGoal = { targetCorpus: totalCorpus, years: yearsToInvest, returnRate: annualReturn, currentSavings: currentSavings };
    saveState();
    renderRetirementProjection();
}

function handleAddSip(e) {
    e.preventDefault();
    const name = elements.sipName.value;
    const amount = parseFloat(elements.sipAmount.value);
    if (!name || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid SIP name and amount.');
        return;
    }
    state.sips.push({ id: Date.now(), name, amount });
    saveState();
    renderSips();
    elements.sipForm.reset();
}

function handleManageSip(event) {
    if (event.target.classList.contains('sip-item-remove-btn')) {
        const idToRemove = parseInt(event.target.dataset.id);
        state.sips = state.sips.filter(sip => sip.id !== idToRemove);
        saveState();
        renderSips();
    }
}

// --- INITIALIZATION ---
function init() {
    loadState();
    renderQuiz();
    renderRiskProfile();
    renderSips();
    renderRetirementProjection();

    elements.riskQuizForm.addEventListener('submit', handleQuizSubmit);
    elements.retakeQuizBtn.addEventListener('click', handleRetakeQuiz);
    elements.retirementCalcForm.addEventListener('submit', handleRetirementCalc);
    elements.sipForm.addEventListener('submit', handleAddSip);
    elements.sipList.addEventListener('click', handleManageSip);
}

init();