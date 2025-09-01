document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION & DATA ---
    const QUIZ_QUESTIONS = [
        { question: "When you think about investing, your primary goal is:", options: [{ text: "Preserving my capital and avoiding losses.", score: 1 }, { text: "A balanced mix of safety and growth.", score: 2 }, { text: "Maximizing my returns, even if it means taking big risks.", score: 3 }] },
        { question: "If your investments lost 20% of their value in a month, you would:", options: [{ text: "Sell to prevent further losses.", score: 1 }, { text: "Hold and wait for the market to recover.", score: 2 }, { text: "Buy more, seeing it as a great opportunity.", score: 3 }] },
        { question: "How long is your investment horizon?", options: [{ text: "Short-term (1-3 years)", score: 1 }, { text: "Medium-term (3-10 years)", score: 2 }, { text: "Long-term (10+ years)", score: 3 }] }
    ];
    const INVESTMENT_SUGGESTIONS = {
        conservative: [{ type: 'stock', symbol: 'SPY', name: 'S&P 500 ETF (SPY)', desc: 'Diversified investment in the 500 largest US companies.' }, { type: 'stock', symbol: 'GLD', name: 'Gold ETF (GLD)', desc: 'Digital gold, a traditional safe-haven asset.' }],
        moderate: [{ type: 'stock', symbol: 'MSFT', name: 'Microsoft Corp.', desc: 'A diversified global technology leader.' }, { type: 'stock', symbol: 'INFY', name: 'Infosys (US Listing)', desc: 'A global leader in IT services.' }, { type: 'crypto', id: 'bitcoin', name: 'Bitcoin (Small Allocation)', desc: 'The original cryptocurrency, for long-term growth.' }],
        aggressive: [{ type: 'stock', symbol: 'TSLA', name: 'Tesla Inc.', desc: 'A high-growth global leader in EVs and AI.' }, { type: 'crypto', id: 'ethereum', name: 'Ethereum', desc: 'A leading blockchain platform for smart contracts.' }, { type: 'crypto', id: 'solana', name: 'Solana', desc: 'A high-speed, high-risk blockchain network.' }]
    };
    let state = { sips: [], riskProfile: null, retirementGoal: null };

    // --- DOM ELEMENTS ---
    const elements = {
        quizContainer: document.getElementById('quiz-container'),
        riskQuizCard: document.getElementById('risk-quiz-card'),
        riskQuizForm: document.getElementById('risk-quiz-form'),
        postQuizRow: document.getElementById('post-quiz-row'),
        riskProfileResult: document.getElementById('risk-profile-result'),
        riskProfileDescription: document.getElementById('risk-profile-description'),
        retakeQuizBtn: document.getElementById('retake-quiz-btn'),
        investTabBtn: document.getElementById('invest-tab-btn'),
        toolsTabBtn: document.getElementById('tools-tab-btn'),
        investmentSection: document.getElementById('investment-ideas-section'),
        toolsSection: document.getElementById('tools-section'),
        investmentSuggestions: document.getElementById('investment-suggestions'),
        retirementCalcForm: document.getElementById('retirement-calc-form'),
        retirementResult: document.getElementById('retirement-result'),
        sipForm: document.getElementById('sip-form'),
        sipName: document.getElementById('sip-name'),
        sipAmount: document.getElementById('sip-amount'),
        sipList: document.getElementById('sip-list'),
        retirementProjectionCard: document.getElementById('retirement-projection-card')
    };

    // --- DATA PERSISTENCE ---
    const saveState = () => localStorage.setItem('wealthBuilderState', JSON.stringify(state));
    const loadState = () => {
        const savedState = localStorage.getItem('wealthBuilderState');
        if (savedState) state = JSON.parse(savedState);
    };

    // --- RENDERING FUNCTIONS ---
    function renderQuiz() {
        let quizHtml = '';
        QUIZ_QUESTIONS.forEach((q, index) => {
            quizHtml += `<div class="quiz-question"><p>${index + 1}. ${q.question}</p><div class="quiz-options">`;
            q.options.forEach((opt, i) => {
                const optionId = `q${index}o${i}`;
                quizHtml += `<label for="${optionId}"><input type="radio" id="${optionId}" name="q${index}" value="${opt.score}" required> ${opt.text}</label>`;
            });
            quizHtml += `</div></div>`;
        });
        const submitButton = elements.riskQuizForm.querySelector('button');
        elements.riskQuizForm.innerHTML = quizHtml;
        elements.riskQuizForm.appendChild(submitButton);
    }

    function renderRiskProfile() {
        if (state.riskProfile) {
            elements.quizContainer.classList.add('hidden');
            elements.postQuizRow.classList.remove('hidden');
            
            const profileName = state.riskProfile.charAt(0).toUpperCase() + state.riskProfile.slice(1);
            elements.riskProfileResult.textContent = profileName;
            elements.riskProfileResult.className = state.riskProfile;

            let description = '';
            if (state.riskProfile === 'conservative') description = 'You prioritize capital preservation and are willing to accept lower returns for lower risk.';
            if (state.riskProfile === 'moderate') description = 'You seek a healthy balance between long-term growth and the safety of your capital.';
            if (state.riskProfile === 'aggressive') description = 'You are comfortable taking on significant risk for the potential of achieving higher returns.';
            elements.riskProfileDescription.textContent = description;
            
            renderInvestmentSuggestions();
        } else {
            elements.quizContainer.classList.remove('hidden');
            elements.postQuizRow.classList.add('hidden');
        }
    }

    async function renderInvestmentSuggestions() {
        if (!state.riskProfile) {
            elements.investmentSuggestions.innerHTML = '<p>Complete the risk profile quiz to unlock personalized investment ideas.</p>';
            return;
        }
        elements.investmentSuggestions.innerHTML = '<div class="loader"></div>';
        const suggestions = INVESTMENT_SUGGESTIONS[state.riskProfile];
        let suggestionsHtml = `<h4>Investment Ideas for a ${state.riskProfile.charAt(0).toUpperCase() + state.riskProfile.slice(1)} Profile</h4>`;
        for (const item of suggestions) {
            let priceHtml = '<p>Loading...</p>';
            try {
                let data, priceChangeClass, currentPrice, dailyChange;
                if (item.type === 'stock') {
                    const response = await fetch('/api/stock-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: item.symbol }) });
                    if (!response.ok) throw new Error();
                    data = await response.json();
                    priceChangeClass = data.d > 0 ? 'positive' : 'negative';
                    currentPrice = `₹${(data.c * 83).toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
                    dailyChange = `${data.dp.toFixed(2)}% (24h)`;
                } else if (item.type === 'crypto') {
                    const response = await fetch('/api/crypto-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
                    if (!response.ok) throw new Error();
                    data = await response.json();
                    priceChangeClass = data.inr_24h_change > 0 ? 'positive' : 'negative';
                    currentPrice = `₹${data.inr.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
                    dailyChange = `${data.inr_24h_change.toFixed(2)}% (24h)`;
                }
                priceHtml = `<h3>${currentPrice}</h3><p class="${priceChangeClass}">${dailyChange}</p>`;
            } catch (error) {
                priceHtml = '<p class="error-message">Data N/A</p>';
            }
            suggestionsHtml += `<div class="investment-card"><div class="info"><h4>${item.name}</h4><p>${item.desc}</p></div><div class="price">${priceHtml}</div></div>`;
        }
        elements.investmentSuggestions.innerHTML = suggestionsHtml;
    }

    function renderSips() {
        const totalSip = state.sips.reduce((sum, sip) => sum + sip.amount, 0);
        let sipHtml = '<ul>';
        if (state.sips.length > 0) {
            sipHtml += state.sips.map(sip => `<li><span>${sip.name}</span><span>₹${sip.amount.toLocaleString()}/mo<button class="sip-item-remove-btn" data-id="${sip.id}">&times;</button></span></li>`).join('');
            sipHtml += `</ul><hr><div class="total-sip-row"><span>Total Monthly SIP:</span><strong>₹${totalSip.toLocaleString()}</strong></div>`;
        } else {
            sipHtml = '<p>No active SIPs. Add one to start tracking your goals.</p>';
        }
        elements.sipList.innerHTML = sipHtml;
        renderRetirementProjection(); // CRITICAL: Update projection whenever SIPs change
    }

    function renderRetirementProjection() {
        // This function now automatically appears when both tools are used
        if (!state.retirementGoal || state.sips.length === 0) {
            elements.retirementProjectionCard.classList.add('hidden');
            return;
        }

        const { targetCorpus, years, returnRate, currentSavings, monthlyInvestment } = state.retirementGoal;
        const totalSip = state.sips.reduce((sum, sip) => sum + sip.amount, 0);
        const totalMonthlyInvestment = monthlyInvestment + totalSip;

        const n = years * 12;
        const r = (returnRate / 100) / 12;
        const projectedCorpus = (currentSavings * Math.pow(1 + r, n)) + (totalMonthlyInvestment * ((Math.pow(1 + r, n) - 1) / r));
        
        const shortfall = targetCorpus - projectedCorpus;
        
        let contentHtml = `<h3>Combined Retirement Projection</h3>
                           <div class="projection-summary">Your original plan projected a corpus of <strong>₹${targetCorpus.toLocaleString('en-IN')}</strong>. By adding your SIPs, your new total monthly investment is <strong>₹${totalMonthlyInvestment.toLocaleString('en-IN')}</strong>, leading to a new projected corpus of <strong>₹${projectedCorpus.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong>.</div>`;
                           
        if (shortfall <= 0) {
            contentHtml += `<div class="projection-advice on-track">Congratulations! You are on track to exceed your original goal.</div>`;
        } else {
            const additionalSipNeeded = (shortfall * r) / (Math.pow(1 + r, n) - 1);
            contentHtml += `<div class="projection-advice off-track">You have a projected shortfall of ₹${shortfall.toLocaleString('en-IN')}.<br>Consider increasing your monthly investments by approximately <strong>₹${additionalSipNeeded.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong> to close the gap.</div>`;
        }
        
        elements.retirementProjectionCard.innerHTML = contentHtml;
        elements.retirementProjectionCard.classList.remove('hidden');
    }
    
    // --- EVENT HANDLERS ---
    function handleQuizSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.riskQuizForm);
        let totalScore = 0;
        let questionCount = 0;
        for (const value of formData.values()) {
            totalScore += parseInt(value);
            questionCount++;
        }
        if (questionCount < QUIZ_QUESTIONS.length) {
            alert('Please answer all questions.');
            return;
        }
        if (totalScore <= 4) state.riskProfile = 'conservative';
        else if (totalScore <= 7) state.riskProfile = 'moderate';
        else state.riskProfile = 'aggressive';
        saveState();
        renderRiskProfile();
    }

    function handleRetakeQuiz() {
        state.riskProfile = null;
        state.retirementGoal = null;
        state.sips = [];
        saveState();
        renderRiskProfile();
        renderSips();
        elements.retirementCalcForm.reset();
        elements.sipForm.reset();
        elements.retirementResult.innerHTML = '';
    }

    function handleTabSwitch(e) {
        const isInvestTab = e.target.id === 'invest-tab-btn';
        elements.investmentSection.classList.toggle('hidden', !isInvestTab);
        elements.toolsSection.classList.toggle('hidden', isInvestTab);
        elements.investTabBtn.classList.toggle('active', isInvestTab);
        elements.toolsTabBtn.classList.toggle('active', !isInvestTab);
    }

      function handleRetirementCalc(e) {
        e.preventDefault();
        const form = e.target;
        const values = ['current-age', 'retirement-age', 'current-savings', 'monthly-investment', 'return-rate'].map(id => parseFloat(form.querySelector(`#${id}`).value));
        if (values.some(isNaN)) {
            elements.retirementResult.innerHTML = '<p class="error-message">Please fill all fields.</p>';
            return;
        }
        const [currentAge, retirementAge, currentSavings, monthlyInvestment, annualReturn] = values;
        const yearsToInvest = retirementAge - currentAge;
        if (yearsToInvest <= 0) {
            elements.retirementResult.innerHTML = '<p class="error-message">Retirement age must be after current age.</p>';
            return;
        }
        const n = yearsToInvest * 12;
        const r = (annualReturn / 100) / 12;
        const totalCorpus = (currentSavings * Math.pow(1 + r, n)) + (monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r));
        const totalInvested = currentSavings + (monthlyInvestment * n);
        const wealthGained = totalCorpus - totalInvested;

        elements.retirementResult.innerHTML = `
            <ul>
                <li><span>Principal Investment:</span> <strong>₹${totalInvested.toLocaleString('en-IN')}</strong></li>
                <li><span>Wealth Gained:</span> <strong>₹${wealthGained.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong></li>
                <li class="grand-total"><span>Final Corpus at Age ${retirementAge}:</span> <strong>₹${totalCorpus.toLocaleString('en-IN', {maximumFractionDigits: 0})}</strong></li>
            </ul>`;
        
        // Save the goal state to be used by the projection
        state.retirementGoal = { targetCorpus: totalCorpus, years: yearsToInvest, returnRate: annualReturn, currentSavings: currentSavings, monthlyInvestment: monthlyInvestment };
        saveState();
        renderRetirementProjection(); // CRITICAL: Update projection whenever the plan changes
    }

    function handleAddSip(e) {
        e.preventDefault();
        const name = elements.sipName.value;
        const amount = parseFloat(elements.sipAmount.value);
        if (!name || isNaN(amount) || amount <= 0) return;
        state.sips.push({ id: Date.now(), name, amount });
        saveState();
        renderSips();
        elements.sipForm.reset();
    }

    function handleManageSip(e) {
        if (e.target.classList.contains('sip-item-remove-btn')) {
            state.sips = state.sips.filter(sip => sip.id !== parseInt(e.target.dataset.id));
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

        elements.riskQuizForm.addEventListener('submit', handleQuizSubmit);
        elements.retakeQuizBtn.addEventListener('click', handleRetakeQuiz);
        elements.investTabBtn.addEventListener('click', handleTabSwitch);
        elements.toolsTabBtn.addEventListener('click', handleTabSwitch);
        elements.retirementCalcForm.addEventListener('submit', handleRetirementCalc);
        elements.sipForm.addEventListener('submit', handleAddSip);
        elements.sipList.addEventListener('click', handleManageSip);
    }

    init();
});
