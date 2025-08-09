// public/js/game.js - DEFINITIVE & FULLY WORKING VERSION with Sell Investment Feature

document.addEventListener('DOMContentLoaded', () => {
    
    // --- GAME STATE ---
    const gameState = { playerName: 'Player', age: 22, cash: 0, investments: 0, debt: 0, initialDebt: 0, monthlyIncome: 60000, monthlyExpenses: { rent: 20000, food: 8000, utilities: 4000, transport: 3000, fun: 5000 }, goal: { type: null, target: 0, title: '', description: '' }, isGameOver: false };

    // --- UI ELEMENTS ---
    const ui = {
        age: document.getElementById('age'), netWorth: document.getElementById('net-worth'), cash: document.getElementById('cash'), investments: document.getElementById('investments'), debt: document.getElementById('debt'),
        goalTitle: document.getElementById('goal-title'), goalDescription: document.getElementById('goal-description'), progressBar: document.getElementById('progress-bar'), eventLog: document.getElementById('event-log'),
        investAmountInput: document.getElementById('invest-amount'), investBtn: document.getElementById('invest-btn'),
        sellAmountInput: document.getElementById('sell-amount'), sellBtn: document.getElementById('sell-btn'),
        debtAmountInput: document.getElementById('debt-amount'), payDebtBtn: document.getElementById('pay-debt-btn'),
        invest1000Btn: document.getElementById('invest-1000-btn'), invest5000Btn: document.getElementById('invest-5000-btn'),
        sell1000Btn: document.getElementById('sell-1000-btn'), sell5000Btn: document.getElementById('sell-5000-btn'),
        payDebt1000Btn: document.getElementById('pay-debt-1000-btn'), payDebt5000Btn: document.getElementById('pay-debt-5000-btn'),
        advanceMonthBtn: document.getElementById('advance-month-btn'), advanceBtnText: document.getElementById('advance-btn-text'), advanceBtnLoader: document.getElementById('advance-btn-loader'),
        gameContainer: document.getElementById('game-container'),
        welcomeModal: document.getElementById('welcome-modal'), gameOverModal: document.getElementById('game-over-modal'), gameOverTitle: document.getElementById('game-over-title'), gameOverMessage: document.getElementById('game-over-message'),
        coachBtn: document.getElementById('coach-btn'), coachModal: document.getElementById('coach-modal'), coachLoader: document.getElementById('coach-loader'), coachResponse: document.getElementById('coach-response'), closeCoachBtn: document.getElementById('close-coach-btn'),
        strategyModal: document.getElementById('strategy-modal'), strategyTitle: document.getElementById('strategy-title'), strategyContent: document.getElementById('strategy-content'), strategyLoader: document.getElementById('strategy-loader'), strategyResponse: document.getElementById('strategy-response'), generateStrategyBtn: document.getElementById('generate-strategy-btn'), closeStrategyBtn: document.getElementById('close-strategy-btn'),
        choiceModal: document.getElementById('choice-modal'), choiceTitle: document.getElementById('choice-title'), choiceDescription: document.getElementById('choice-description'), choiceButtons: document.getElementById('choice-buttons'),
        playerNameInput: document.getElementById('player-name'), playerAgeInput: document.getElementById('player-age'), playerCashInput: document.getElementById('player-cash'), playerDebtInput: document.getElementById('player-debt'), goalSelect: document.getElementById('goal-select'), startGameBtn: document.getElementById('start-game-btn'), journeyTitle: document.getElementById('journey-title'),
        welcomeError: document.getElementById('welcome-error'),
        homeBtn: document.getElementById('home-btn'),
    };

    // --- EXPANDED EVENT LIBRARY ---
    const incidentEvents = [
        { title: "💼 Promotion Opportunity", description: "Your boss offers you a promotion! It comes with a ₹10,000 monthly raise but requires more responsibility and longer hours.", choices: [ { text: "Accept the promotion.", effect: { monthlyIncome: 10000, log: { title: "Promotion!", message: "You accepted the promotion. Your monthly income has increased by ₹10,000.", color: "green" }}}, { text: "Decline. Work-life balance is key.", effect: { log: { title: "Work-Life Balance", message: "You prioritized your well-being over a raise.", color: "slate" }}} ] },
        { title: "🏞️ Weekend Getaway", description: "Your friends are planning a spontaneous weekend trip. It sounds like fun, but it'll cost you.", choices: [ { text: "Go for it! (Cost: ₹12,000)", effect: { cash: -12000, log: { title: "Trip!", message: "You enjoyed a fun trip with friends.", color: "cyan" }}}, { text: "Suggest a cheaper local plan. (Cost: ₹4,000)", effect: { cash: -4000, log: { title: "Budget Fun", message: "You found a more budget-friendly way to have fun.", color: "slate" }}}, { text: "Stay home and save money.", effect: { log: { title: "Disciplined", message: "You stayed focused on your financial goals.", color: "green" }}} ] },
        { title: "🧊 Appliance Breakdown", description: "Your refrigerator has stopped working. You need to get it fixed or replaced.", choices: [ { text: "Buy a new, efficient model. (Cost: ₹25,000)", effect: { cash: -25000, log: { title: "New Appliance", message: "You invested in a new appliance for the long term.", color: "red" }}}, { text: "Get it repaired. (Cost: ₹6,000)", effect: { cash: -6000, log: { title: "Quick Fix", message: "You opted for a cheaper, short-term repair.", color: "red" }}} ] },
        { title: "🎉 Work Bonus", description: "Your company had a great quarter, and you've received an unexpected performance bonus of ₹20,000!", choices: [ { text: "Invest all of it.", effect: { cash: 0, investments: 20000, log: { title: "Smart Investment", message: "You invested your entire bonus.", color: "cyan" }}}, { text: "Pay down debt with it.", effect: { cash: 0, debt: -20000, log: { title: "Debt Crushed", message: "You used your bonus to reduce your debt.", color: "green" }}}, { text: "Treat yourself (₹10k) and invest the rest.", effect: { cash: -10000, investments: 10000, log: { title: "Balanced Choice", message: "You enjoyed a reward and invested for the future.", color: "slate" }}} ] },
        { title: "🧑‍🤝‍🧑 Friend in Need", description: "A close friend is in a tight spot and asks to borrow ₹15,000. They promise to pay you back in a few months.", choices: [ { text: "Lend them the money.", effect: { cash: -15000, log: { title: "Helping Hand", message: "You helped a friend in need.", color: "slate" }}}, { text: "Offer half the amount (₹7,500).", effect: { cash: -7500, log: { title: "Helping Hand", message: "You helped out as much as you comfortably could.", color: "slate" }}}, { text: "Politely decline.", effect: { log: { title: "Tough Call", message: "You prioritized your own financial stability.", color: "slate" }}} ] },
        { title: "📚 Upskill Opportunity", description: "An online course related to your field is available. It costs ₹18,000 but could lead to better job opportunities.", choices: [ { text: "Enroll in the course.", effect: { cash: -18000, log: { title: "Self-Investment", message: "You invested in your skills for future growth.", color: "cyan" }}}, { text: "Find free resources online instead.", effect: { log: { title: "Frugal Learner", message: "You decided to learn without the financial cost.", color: "slate" }}}, { text: "Pass for now.", effect: { log: { title: "Not Now", message: "You decided not to pursue the course at this time.", color: "slate" }}} ] },
        { title: "🚗 Vehicle Trouble", description: "Your bike/car needs urgent repairs. This was not in the budget.", choices: [ { text: "Pay for the full repair. (Cost: ₹9,000)", effect: { cash: -9000, log: { title: "Repair Cost", message: "You paid for necessary vehicle repairs.", color: "red" }}}, { text: "Do a temporary fix. (Cost: ₹3,000)", effect: { cash: -3000, log: { title: "Patch-up Job", message: "You chose a temporary fix to save money for now.", color: "red" }}} ] },
        { title: "📈 Stock Market Tip", description: "A colleague gives you a 'hot tip' on a stock that they claim is about to take off. It's risky.", choices: [ { text: "Invest ₹15,000. High risk, high reward!", effect: { cash: -15000, investments: 15000, log: { title: "Risky Bet", message: "You took a chance on a hot stock tip.", color: "cyan" }}}, { text: "Invest a small amount, ₹5,000.", effect: { cash: -5000, investments: 5000, log: { title: "Cautious Gamble", message: "You decided to dip your toes in carefully.", color: "cyan" }}}, { text: "Ignore the tip. Stick to your strategy.", effect: { log: { title: "Steady Hand", message: "You avoided a risky investment and stuck to your plan.", color: "green" }}} ] },
        { title: "🏠 Minor Home Damage", description: "A leaky pipe caused some minor damage in your home. It needs to be fixed before it gets worse.", choices: [ { text: "Hire a professional. (Cost: ₹7,000)", effect: { cash: -7000, log: { title: "Problem Solved", message: "You paid a professional to fix the leak properly.", color: "red" }}}, { text: "Try to fix it yourself. (Cost: ₹1,500 for supplies)", effect: { cash: -1500, log: { title: "DIY Fix", message: "You attempted a DIY repair to save money.", color: "slate" }}} ] },
        { title: "🎁 Unexpected Gift", description: "A relative sends you an unexpected gift of ₹10,000 for a recent festival.", choices: [ { text: "Add it to your emergency fund.", effect: { cash: 10000, log: { title: "Gift!", message: "You wisely saved the gifted money.", color: "green" }}}, { text: "Use it to pay down some debt.", effect: { debt: -10000, log: { title: "Gift!", message: "You used the extra cash to lower your debt.", color: "green" }}}, { text: "Buy something you've wanted.", effect: { cash: 0, log: { title: "Treat Yourself!", message: "You used the gift to buy something nice for yourself.", color: "cyan" }}} ] },
        { title: "💻 Tech Upgrade", description: "Your old laptop is slowing down. A new one would boost your productivity but costs ₹50,000.", choices: [ { text: "Buy the new laptop.", effect: { cash: -50000, log: { title: "Tech Investment", message: "You upgraded your tech, hoping for a productivity boost.", color: "cyan" }}}, { text: "Struggle on with the old one.", effect: { log: { title: "Making Do", message: "You decided to save money and continue with your current laptop.", color: "slate" }}}, { text: "Buy a cheaper, used model. (Cost: ₹20,000)", effect: { cash: -20000, log: { title: "Budget Upgrade", message: "You found a more affordable way to upgrade your tech.", color: "slate" }}} ] },
        { title: "💒 Wedding Invitation", description: "You've been invited to a destination wedding for a close friend. Attending will be expensive.", choices: [ { text: "Attend the wedding. (Cost: ₹30,000)", effect: { cash: -30000, log: { title: "Destination Wedding", message: "You celebrated with your friend, but it was costly.", color: "red" }}}, { text: "Attend only the local ceremony. (Cost: ₹5,000)", effect: { cash: -5000, log: { title: "Local Celebration", message: "You found a way to celebrate without the high cost.", color: "slate" }}}, { text: "Politely decline and send a gift. (Cost: ₹2,500)", effect: { cash: -2500, log: { title: "Thoughtful Gift", message: "You couldn't attend but sent a nice gift.", color: "slate" }}} ] },
        { title: "💸 Freelance Gig", description: "A former colleague offers you a small freelance project that you can complete in your spare time.", choices: [ { text: "Take the gig. (Earn: ₹15,000)", effect: { cash: 15000, log: { title: "Side Hustle", message: "You earned extra cash from a freelance project.", color: "green" }}}, { text: "Decline, you value your free time.", effect: { log: { title: "Time Off", message: "You prioritized rest over extra income.", color: "slate" }}} ] },
        { title: "💳 Credit Card Offer", description: "You've been pre-approved for a premium credit card with a high limit and annual fee of ₹3,000, but great travel rewards.", choices: [ { text: "Sign up for the card.", effect: { cash: -3000, log: { title: "New Card", message: "You signed up for the premium card, paying the annual fee.", color: "cyan" }}}, { text: "Stick with your current cards.", effect: { log: { title: "No Thanks", message: "You decided you don't need another credit card.", color: "slate" }}} ] },
        { title: "🧾 Tax Refund", description: "Good news! You overpaid on your taxes and are getting a refund of ₹8,000.", choices: [ { text: "Put it all into investments.", effect: { investments: 8000, log: { title: "Tax Refund", message: "You invested your entire tax refund.", color: "cyan" }}}, { text: "Use it for a nice dinner and shopping. (Cost: ₹8,000)", effect: { cash: -8000, log: { title: "Splurge!", message: "You treated yourself with the refund.", color: "cyan" }}}, { text: "Let it sit in your bank account.", effect: { cash: 8000, log: { title: "Cash Cushion", message: "You added the refund to your cash savings.", color: "green" }}} ] }
    ];

    // --- HELPER FUNCTIONS ---
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    const logEvent = (title, message, color = 'gray') => {
        const p = document.createElement('p');
        const colorMap = { green: 'text-green-400', red: 'text-red-400', cyan: 'text-cyan-400', slate: 'text-indigo-300' };
        const textColor = colorMap[color] || 'text-gray-300';
        p.innerHTML = `<strong class="${textColor}">${title}</strong>: ${message}`;
        ui.eventLog.prepend(p);
        if (ui.eventLog.children.length > 20) ui.eventLog.lastChild.remove();
    };

    // --- GEMINI API INTEGRATION ---
    const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    async function callGemini(prompt, isJson = false) {
        if (!API_KEY || API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            console.error("API Key is not set. AI features will be disabled.");
            return null;
        }
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        if (isJson) {
            payload.generationConfig = { responseMimeType: "application/json" };
        }
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            if (result.candidates && result.candidates[0].content) {
                const text = result.candidates[0].content.parts[0].text;
                return isJson ? JSON.parse(text) : text;
            } else { throw new Error("Invalid response structure from API."); }
        } catch (error) {
            console.error("Gemini API call failed:", error);
            return null;
        }
    }
    
    async function generateAiChoiceEvent() {
        const prompt = `You are an event generator for a financial simulation game based in India. The player's name is ${gameState.playerName}, age ${Math.floor(gameState.age)}.
        Current state: Cash: ${formatCurrency(gameState.cash)}, Investments: ${formatCurrency(gameState.investments)}, Debt: ${formatCurrency(gameState.debt)}.
        Their goal is: ${gameState.goal.title}.
        Create a unique, interesting, and realistic financial event with 2-3 choices. Return ONLY a valid JSON object with the structure: { "title": "string", "description": "string", "choices": [{ "text": "string", "effect": { "cash": number, "investments": number, "debt": number, "log": { "title": "string", "message": "string", "color": "string" } } }] }.
        The "effect" values should be numbers representing the change in INR (e.g., -5000 for a ₹5,000 cost).
        The log color should be 'green', 'red', 'cyan', or 'slate'.`;
        
        return await callGemini(prompt, true);
    }

    // --- CORE GAME LOGIC ---
    function init() {
        ui.startGameBtn.addEventListener('click', handleStartGame);
        ui.investBtn.addEventListener('click', () => handleInvestment());
        ui.sellBtn.addEventListener('click', () => handleSellInvestment());
        ui.payDebtBtn.addEventListener('click', () => handleDebtPayment());
        ui.invest1000Btn.addEventListener('click', () => handleInvestment(1000));
        ui.invest5000Btn.addEventListener('click', () => handleInvestment(5000));
        ui.sell1000Btn.addEventListener('click', () => handleSellInvestment(1000));
        ui.sell5000Btn.addEventListener('click', () => handleSellInvestment(5000));
        ui.payDebt1000Btn.addEventListener('click', () => handleDebtPayment(1000));
        ui.payDebt5000Btn.addEventListener('click', () => handleDebtPayment(5000));
        ui.advanceMonthBtn.addEventListener('click', presentChoice);
        ui.coachBtn.addEventListener('click', showCoachAdvice);
        ui.closeCoachBtn.addEventListener('click', () => ui.coachModal.classList.add('hidden'));
        ui.generateStrategyBtn.addEventListener('click', showStarterStrategy);
        ui.closeStrategyBtn.addEventListener('click', () => {
            ui.strategyModal.classList.add('hidden');
            ui.gameContainer.classList.remove('hidden');
            updateUI();
        });
        ui.homeBtn.addEventListener('click', () => window.location.href = '/genz-moneyverse.html');
    }

    function handleStartGame() {
        ui.playerNameInput.classList.remove('input-error');
        ui.playerAgeInput.classList.remove('input-error');
        ui.playerCashInput.classList.remove('input-error');
        ui.playerDebtInput.classList.remove('input-error');
        ui.goalSelect.classList.remove('input-error');
        ui.welcomeError.classList.add('hidden');

        const name = ui.playerNameInput.value.trim();
        const age = parseInt(ui.playerAgeInput.value);
        const cash = parseInt(ui.playerCashInput.value);
        const debt = parseInt(ui.playerDebtInput.value);
        const goal = ui.goalSelect.value;
        
        let isValid = true;
        let errorMessages = [];
        if (!name) { ui.playerNameInput.classList.add('input-error'); isValid = false; errorMessages.push('Please enter your name.'); }
        if (!age || age < 18 || age > 60) { ui.playerAgeInput.classList.add('input-error'); isValid = false; errorMessages.push('Please enter an age between 18 and 60.'); }
        if (isNaN(cash) || cash < 0) { ui.playerCashInput.classList.add('input-error'); isValid = false; errorMessages.push('Please enter a valid bank balance.'); }
        if (isNaN(debt) || debt < 0) { ui.playerDebtInput.classList.add('input-error'); isValid = false; errorMessages.push('Please enter a valid debt amount.'); }
        if (!goal) { ui.goalSelect.classList.add('input-error'); isValid = false; errorMessages.push('Please select a goal.'); }
        
        if (!isValid) { 
            ui.welcomeError.textContent = errorMessages.join(' ');
            ui.welcomeError.classList.remove('hidden');
            return;
        }

        gameState.playerName = name;
        gameState.age = age;
        gameState.cash = cash;
        gameState.debt = debt;
        gameState.initialDebt = debt;
        setGoal(goal);
        
        updateUI();
        
        ui.welcomeModal.classList.add('hidden');
        ui.strategyModal.classList.remove('hidden');
        ui.journeyTitle.textContent = `${gameState.playerName}'s Financial Journey`;
        logEvent("👋 Welcome, " + gameState.playerName + "!", "Your journey begins now. Good luck!", "cyan");
    }

    async function presentChoice() {
        if (gameState.isGameOver) return;
        setAdvanceButtonLoading(true);
        let event;
        const eventType = Math.random();
        if (eventType < 0.3 && API_KEY && API_KEY !== "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            event = await generateAiChoiceEvent();
        }
        if (!event || !event.choices || event.choices.length === 0) {
            if (eventType < 0.3) logEvent("Signal Lost...", "AI offline. Using a standard scenario.", "red");
            event = incidentEvents[Math.floor(Math.random() * incidentEvents.length)];
        } else {
            logEvent("✨ AI Event!", "A unique, AI-generated event has occurred.", "cyan");
        }
        setAdvanceButtonLoading(false);
        ui.choiceTitle.textContent = event.title;
        ui.choiceDescription.textContent = event.description;
        ui.choiceButtons.innerHTML = '';
        event.choices.forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.className = 'btn btn-secondary w-full';
            button.onclick = () => {
                applyChoiceEffect(choice.effect);
                ui.choiceModal.classList.add('hidden');
                finishMonth();
            };
            ui.choiceButtons.appendChild(button);
        });
        ui.choiceModal.classList.remove('hidden');
    }
    
    function applyChoiceEffect(effect) {
        if (!effect) return;
        gameState.cash += effect.cash || 0;
        gameState.investments += effect.investments || 0;
        gameState.debt += effect.debt || 0;
        if (effect.monthlyIncome) gameState.monthlyIncome += effect.monthlyIncome;
        if (effect.log) logEvent(effect.log.title, effect.log.message, effect.log.color);
    }

    function setAdvanceButtonLoading(isLoading) {
        if (isLoading) {
            ui.advanceBtnText.classList.add('hidden');
            ui.advanceBtnLoader.classList.remove('hidden');
            ui.advanceMonthBtn.disabled = true;
        } else {
            ui.advanceBtnText.classList.remove('hidden');
            ui.advanceBtnLoader.classList.add('hidden');
            ui.advanceMonthBtn.disabled = false;
        }
    }

    function setGoal(type) {
        gameState.goal.type = type;
        if (type === 'debt') { gameState.goal.target = 0; gameState.goal.title = 'Goal: Pay Off Debt'; gameState.goal.description = `Eliminate your ${formatCurrency(gameState.initialDebt)} debt.`; }
        else if (type === 'emergency') { gameState.goal.target = 150000; gameState.goal.title = 'Goal: Build Emergency Fund'; gameState.goal.description = 'Save ₹1,50,000 in cash for unexpected events.'; }
        else if (type === 'car') { gameState.goal.target = 800000; gameState.goal.title = 'Goal: Buy a New Car'; gameState.goal.description = 'Save up ₹8,00,000 to purchase a new vehicle.'; }
        else if (type === 'house') { gameState.goal.target = 1500000; gameState.goal.title = 'Goal: House Down Payment'; gameState.goal.description = 'Save ₹15,00,000 for a down payment on your first home.'; }
        else if (type === 'invest100k') { gameState.goal.target = 1000000; gameState.goal.title = 'Goal: Investment Milestone'; gameState.goal.description = 'Grow your investment portfolio to ₹10,00,000.'; }
        else if (type === 'retire') { gameState.goal.target = 10000000; gameState.goal.title = 'Goal: Build Net Worth'; gameState.goal.description = 'Grow your net worth to ₹1,00,00,000.'; }
        ui.strategyTitle.textContent = `🎯 Strategy for: ${gameState.goal.title.split(': ')[1]}`;
    }
    
    function updateUI() {
        const netWorth = gameState.cash + gameState.investments - gameState.debt;
        ui.age.textContent = Math.floor(gameState.age);
        ui.netWorth.textContent = formatCurrency(netWorth);
        ui.cash.textContent = formatCurrency(gameState.cash);
        ui.investments.textContent = formatCurrency(gameState.investments);
        ui.debt.textContent = formatCurrency(gameState.debt);
        ui.goalTitle.textContent = `🎯 ${gameState.goal.title}`;
        ui.goalDescription.textContent = gameState.goal.description;
        let progress = 0;
        if (gameState.goal.type === 'debt') { progress = gameState.initialDebt > 0 ? (gameState.initialDebt - gameState.debt) / gameState.initialDebt : 1; }
        else if (gameState.goal.type === 'retire') { progress = netWorth / gameState.goal.target; }
        else if (gameState.goal.type === 'emergency' || gameState.goal.type === 'car' || gameState.goal.type === 'house') { progress = gameState.cash / gameState.goal.target; }
        else if (gameState.goal.type === 'invest100k') { progress = gameState.investments / gameState.goal.target; }
        progress = Math.max(0, Math.min(1, progress));
        ui.progressBar.style.width = `${progress * 100}%`;
        ui.progressBar.textContent = `${Math.floor(progress * 100)}%`;
    }

    function checkGameOver() {
        const netWorth = gameState.cash + gameState.investments - gameState.debt;
        let isWin = false;
        let winTitle = "🏆 Goal Achieved! 🏆";
        let winMessage = "";
        if (gameState.goal.type === 'debt' && gameState.debt <= 0) { isWin = true; winMessage = `Congratulations, ${gameState.playerName}! You paid off all your debt at age ${Math.floor(gameState.age)}.`; }
        else if (gameState.goal.type === 'emergency' && gameState.cash >= gameState.goal.target) { isWin = true; winMessage = `You've built your ${formatCurrency(gameState.goal.target)} emergency fund! You're prepared for anything.`; }
        else if (gameState.goal.type === 'car' && gameState.cash >= gameState.goal.target) { isWin = true; winMessage = `You saved ${formatCurrency(gameState.goal.target)}! Time to go car shopping, ${gameState.playerName}!`; }
        else if (gameState.goal.type === 'house' && gameState.cash >= gameState.goal.target) { isWin = true; winMessage = `Incredible! You've saved ${formatCurrency(gameState.goal.target)} for a down payment at age ${Math.floor(gameState.age)}.`; }
        else if (gameState.goal.type === 'invest100k' && gameState.investments >= gameState.goal.target) { isWin = true; winMessage = `You've become a savvy investor, reaching ${formatCurrency(gameState.goal.target)} in your portfolio!`; }
        else if (gameState.goal.type === 'retire' && netWorth >= gameState.goal.target) { isWin = true; winTitle = "🏆 You're a Crorepati! 🏆"; winMessage = `With a net worth of ${formatCurrency(netWorth)}, you've achieved financial freedom at age ${Math.floor(gameState.age)}!`; }
        if (isWin) { showGameOver(true, winTitle, winMessage); }
        else if (gameState.cash < 0 && netWorth < -100000) { showGameOver(false, "Game Over", `You've gone bankrupt. Better luck next time, ${gameState.playerName}!`); }
    }

    function finishMonth() {
        if (gameState.isGameOver) return;
        gameState.age += 1/12;
        gameState.cash += gameState.monthlyIncome;
        const totalExpenses = Object.values(gameState.monthlyExpenses).reduce((a, b) => a + b, 0);
        gameState.cash -= totalExpenses;
        logEvent("Month End", `Paycheck received (${formatCurrency(gameState.monthlyIncome)}), expenses paid. Net: ${formatCurrency(gameState.monthlyIncome - totalExpenses)}.`, 'slate');
        if (gameState.debt > 0) {
            const interest = gameState.debt * (0.08 / 12);
            gameState.debt += interest;
            gameState.cash -= interest;
            logEvent("Debt Interest 📉", `Paid ${formatCurrency(interest)} in loan interest.`, "red");
        }
        if (gameState.investments > 0) {
            const growthRate = (Math.random() - 0.4) * 0.1 + 0.006;
            const growthAmount = gameState.investments * growthRate;
            gameState.investments += growthAmount;
            const growthMsg = growthAmount >= 0 ? `Portfolio grew by ${formatCurrency(growthAmount)}.` : `Portfolio lost ${formatCurrency(Math.abs(growthAmount))}.`;
            logEvent(`Investment Update ${growthAmount >= 0 ? '📈' : '📉'}`, growthMsg, growthAmount >= 0 ? 'green' : 'red');
        }
        updateUI();
        checkGameOver();
    }
    
    function handleInvestment(fixedAmount) {
        if (gameState.isGameOver) return;
        const amount = fixedAmount || parseInt(ui.investAmountInput.value);
        if (isNaN(amount) || amount <= 0) { logEvent("Invalid Action", "Please enter a positive amount.", "red"); return; }
        if (amount > gameState.cash) { logEvent("Insufficient Funds 🛑", "Not enough cash to invest.", "red"); return; }
        gameState.cash -= amount;
        gameState.investments += amount;
        logEvent("Investment Made 💰", `You invested ${formatCurrency(amount)}.`, "cyan");
        ui.investAmountInput.value = '';
        updateUI();
    }

    function handleSellInvestment(fixedAmount) {
        if (gameState.isGameOver) return;
        const amount = fixedAmount || parseInt(ui.sellAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            logEvent("Invalid Action", "Please enter a positive amount to sell.", "red");
            return;
        }
        if (amount > gameState.investments) {
            logEvent("Insufficient Assets 📉", "Not enough investments to sell.", "red");
            return;
        }
        gameState.investments -= amount;
        gameState.cash += amount;
        logEvent("Assets Sold 🏦", `You sold ${formatCurrency(amount)} of your investments.`, "slate");
        ui.sellAmountInput.value = '';
        updateUI();
    }
    
    function handleDebtPayment(fixedAmount) {
        if (gameState.isGameOver) return;
        const amount = fixedAmount || parseInt(ui.debtAmountInput.value);
        if (isNaN(amount) || amount <= 0) { logEvent("Invalid Action", "Please enter a positive amount.", "red"); return; }
        if (amount > gameState.cash) { logEvent("Insufficient Funds 🛑", "Not enough cash to pay debt.", "red"); return; }
        const actualPayment = Math.min(amount, gameState.debt);
        gameState.cash -= actualPayment;
        gameState.debt -= actualPayment;
        logEvent("Debt Payment ✅", `You paid ${formatCurrency(actualPayment)} towards your debt.`, "green");
        ui.debtAmountInput.value = '';
        updateUI();
        checkGameOver();
    }
    
    async function showStarterStrategy() {
        ui.strategyContent.classList.add('hidden');
        ui.strategyLoader.classList.remove('hidden');
        const prompt = `I'm playing a financial simulation game set in India. My name is ${gameState.playerName} and I'm ${gameState.age} years old. My chosen goal is to "${gameState.goal.description}". My starting situation is ${formatCurrency(gameState.cash)} cash, ${formatCurrency(gameState.debt)} debt, and a ${formatCurrency(gameState.monthlyIncome)} monthly income. Give me a simple, encouraging, high-level strategy to follow. Keep it to 2-3 short paragraphs. Use a cool, futuristic tone with emojis.`;
        const advice = await callGemini(prompt) || "Alright, pilot! Your mission: conquer your goal. Keep a tight grip on your monthly budget—know where every rupee is going. Automate your savings and investments right after your paycheck hits. Even small, consistent contributions build massive empires over time. Stay focused, adapt to challenges, and the financial galaxy is yours! 🚀";
        ui.strategyLoader.classList.add('hidden');
        ui.strategyResponse.innerHTML = advice.replace(/\n/g, '<br>');
        ui.strategyResponse.classList.remove('hidden');
    }
    
    async function showCoachAdvice() {
        ui.coachModal.classList.remove('hidden');
        ui.coachResponse.classList.add('hidden');
        ui.coachLoader.classList.remove('hidden');
        const prompt = `I'm playing a financial simulation game with a futuristic neon theme, set in India. My name is ${gameState.playerName}. Here's my current status: - Age: ${Math.floor(gameState.age)} - Cash: ${formatCurrency(gameState.cash)} - Investments: ${formatCurrency(gameState.investments)} - Debt: ${formatCurrency(gameState.debt)} - My Goal: ${gameState.goal.title} (${gameState.goal.description}) Based on this, what is one piece of actionable advice you would give me for my next move? Keep it concise (1-2 paragraphs) and encouraging. Use a cool, futuristic tone with emojis.`;
        const advice = await callGemini(prompt) || "Greetings, data-streamer! Analyzing your financial matrix... Your next optimal move is to focus on [insert relevant advice here, e.g., 'crushing that high-interest debt' or 'boosting your investment allocation']. Stay sharp! ✨";
        ui.coachLoader.classList.add('hidden');
        ui.coachResponse.innerHTML = advice.replace(/\n/g, '<br>');
        ui.coachResponse.classList.remove('hidden');
    }
    
    function showGameOver(isWin, title, message) {
        gameState.isGameOver = true;
        ui.gameOverTitle.textContent = title;
        ui.gameOverMessage.textContent = message;
        ui.gameOverTitle.classList.add(isWin ? 'text-green-400' : 'text-red-400');
        ui.gameOverModal.classList.remove('hidden');
        setAdvanceButtonLoading(true);
    }

    // --- START THE GAME ---
    init();
});