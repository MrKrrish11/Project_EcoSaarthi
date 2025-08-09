document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE ---
    const gameState = { playerName: 'Player', age: 22, cash: 2000, investments: 0, debt: 30000, monthlyIncome: 3500, monthlyExpenses: { rent: 1200, food: 400, utilities: 200, transport: 150, fun: 250 }, goal: { type: null, target: 0, title: '', description: '' }, isGameOver: false };

    // --- UI ELEMENTS ---
    const ui = {
        age: document.getElementById('age'), netWorth: document.getElementById('net-worth'), cash: document.getElementById('cash'), investments: document.getElementById('investments'), debt: document.getElementById('debt'),
        goalTitle: document.getElementById('goal-title'), goalDescription: document.getElementById('goal-description'), progressBar: document.getElementById('progress-bar'), eventLog: document.getElementById('event-log'),
        investAmountInput: document.getElementById('invest-amount'), debtAmountInput: document.getElementById('debt-amount'), investBtn: document.getElementById('invest-btn'), payDebtBtn: document.getElementById('pay-debt-btn'),
        invest100Btn: document.getElementById('invest-100-btn'), invest500Btn: document.getElementById('invest-500-btn'), payDebt100Btn: document.getElementById('pay-debt-100-btn'), payDebt500Btn: document.getElementById('pay-debt-500-btn'),
        advanceMonthBtn: document.getElementById('advance-month-btn'), advanceBtnText: document.getElementById('advance-btn-text'), advanceBtnLoader: document.getElementById('advance-btn-loader'),
        gameContainer: document.getElementById('game-container'),
        welcomeModal: document.getElementById('welcome-modal'), gameOverModal: document.getElementById('game-over-modal'), gameOverTitle: document.getElementById('game-over-title'), gameOverMessage: document.getElementById('game-over-message'),
        coachBtn: document.getElementById('coach-btn'), coachModal: document.getElementById('coach-modal'), coachLoader: document.getElementById('coach-loader'), coachResponse: document.getElementById('coach-response'), closeCoachBtn: document.getElementById('close-coach-btn'),
        strategyModal: document.getElementById('strategy-modal'), strategyTitle: document.getElementById('strategy-title'), strategyContent: document.getElementById('strategy-content'), strategyLoader: document.getElementById('strategy-loader'), strategyResponse: document.getElementById('strategy-response'), generateStrategyBtn: document.getElementById('generate-strategy-btn'), closeStrategyBtn: document.getElementById('close-strategy-btn'),
        choiceModal: document.getElementById('choice-modal'), choiceTitle: document.getElementById('choice-title'), choiceDescription: document.getElementById('choice-description'), choiceButtons: document.getElementById('choice-buttons'),
        playerNameInput: document.getElementById('player-name'), playerAgeInput: document.getElementById('player-age'), goalSelect: document.getElementById('goal-select'), startGameBtn: document.getElementById('start-game-btn'), journeyTitle: document.getElementById('journey-title'),
        welcomeError: document.getElementById('welcome-error'),
    };

    // --- STATIC FALLBACK EVENTS ---
    const staticChoiceEvents = [
        {
            title: "🧘 A Quiet Month",
            description: "Nothing out of the ordinary happened this month. A good time to focus on your goals.",
            choices: [
                { text: "Stick to the budget.", effect: { cash: 0, investments: 0, debt: 0, log: { title: "Steady Progress", message: "You stayed disciplined this month.", color: "slate" }}},
                { text: "Make an extra debt payment of $250.", effect: { cash: -250, investments: 0, debt: -250, log: { title: "Extra Payment", message: "You paid an extra $250 on your debt.", color: "green" }}},
                { text: "Invest an extra $250.", effect: { cash: -250, investments: 250, debt: 0, log: { title: "Extra Investment", message: "You invested an extra $250.", color: "cyan" }}},
            ]
        }
    ];

    // --- HELPER FUNCTIONS ---
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
    const logEvent = (title, message, color = 'gray') => {
        const p = document.createElement('p');
        const colorMap = { green: 'text-green-400', red: 'text-red-400', cyan: 'text-cyan-400', slate: 'text-indigo-300' };
        const textColor = colorMap[color] || 'text-gray-300';
        p.innerHTML = `<strong class="${textColor}">${title}:</strong> ${message}`;
        ui.eventLog.prepend(p);
        if (ui.eventLog.children.length > 20) ui.eventLog.lastChild.remove();
    };

    // --- GEMINI API INTEGRATION ---
    const API_KEY = "YOUR_API_KEY"; // IMPORTANT: Replace with your actual API key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
    
    async function callGemini(prompt, isJson = false) {
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        if (isJson) {
            payload.generationConfig = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        description: { type: "STRING" },
                        choices: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    text: { type: "STRING" },
                                    effect: {
                                        type: "OBJECT",
                                        properties: {
                                            cash: { type: "NUMBER" },
                                            investments: { type: "NUMBER" },
                                            debt: { type: "NUMBER" },
                                            log: {
                                                type: "OBJECT",
                                                properties: {
                                                    title: { type: "STRING" },
                                                    message: { type: "STRING" },
                                                    color: { type: "STRING" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }

        let attempt = 0;
        while (attempt < 3) {
            try {
                const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                const result = await response.json();
                if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    return isJson ? JSON.parse(text) : text;
                } else { throw new Error("Invalid response structure from API."); }
            } catch (error) {
                console.error("API call failed:", error);
                attempt++;
                if (attempt >= 3) return null;
                await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
            }
        }
    }
    
    async function generateAiChoiceEvent() {
        const prompt = `You are an event generator for a financial simulation game. The player's name is ${gameState.playerName}, age ${Math.floor(gameState.age)}.
        Current state: Cash: ${formatCurrency(gameState.cash)}, Investments: ${formatCurrency(gameState.investments)}, Debt: ${formatCurrency(gameState.debt)}.
        Their goal is: ${gameState.goal.title}.
        Create a unique, interesting, and realistic financial event with 2-3 choices. The event can be positive, negative, or a dilemma.
        The choices should have clear consequences on the player's finances (cash, investments, debt).
        Return a JSON object following the specified schema. The "effect" values should be numbers representing the change (e.g., -500 for a $500 cost).
        The log message should be a concise summary of what happened for the player.
        The log color should be 'green' for positive outcomes, 'red' for negative, 'cyan' for investments, or 'slate' for neutral.`;
        
        return await callGemini(prompt, true);
    }

    // --- CORE GAME LOGIC ---
    function init() {
        ui.startGameBtn.addEventListener('click', handleStartGame);
        ui.investBtn.addEventListener('click', () => handleInvestment());
        ui.payDebtBtn.addEventListener('click', () => handleDebtPayment());
        ui.invest100Btn.addEventListener('click', () => handleInvestment(100));
        ui.invest500Btn.addEventListener('click', () => handleInvestment(500));
        ui.payDebt100Btn.addEventListener('click', () => handleDebtPayment(100));
        ui.payDebt500Btn.addEventListener('click', () => handleDebtPayment(500));
        ui.advanceMonthBtn.addEventListener('click', presentChoice);
        ui.coachBtn.addEventListener('click', showCoachAdvice);
        ui.closeCoachBtn.addEventListener('click', () => ui.coachModal.classList.add('hidden'));
        ui.generateStrategyBtn.addEventListener('click', showStarterStrategy);
        ui.closeStrategyBtn.addEventListener('click', () => {
            ui.strategyModal.classList.add('hidden');
            ui.gameContainer.classList.remove('hidden');
            updateUI();
        });
    }

    function handleStartGame() {
        ui.playerNameInput.classList.remove('input-error'); ui.playerAgeInput.classList.remove('input-error'); ui.goalSelect.classList.remove('input-error'); ui.welcomeError.classList.add('hidden');
        const name = ui.playerNameInput.value.trim(); const age = parseInt(ui.playerAgeInput.value); const goal = ui.goalSelect.value;
        let isValid = true; let errorMessage = '';
        if (!name) { ui.playerNameInput.classList.add('input-error'); isValid = false; errorMessage = 'Please enter your name.'; }
        if (!age) { ui.playerAgeInput.classList.add('input-error'); isValid = false; errorMessage = 'Please enter your age.'; } 
        else if (age < 18 || age > 60) { ui.playerAgeInput.classList.add('input-error'); isValid = false; errorMessage = 'Please enter an age between 18 and 60.'; }
        if (!goal) { ui.goalSelect.classList.add('input-error'); isValid = false; errorMessage = 'Please select a goal.'; }
        if (!isValid) { ui.welcomeError.textContent = errorMessage; ui.welcomeError.classList.remove('hidden'); return; }
        gameState.playerName = name; gameState.age = age;
        setGoal(goal);
        ui.welcomeModal.classList.add('hidden'); ui.strategyModal.classList.remove('hidden');
        ui.journeyTitle.textContent = `${gameState.playerName}'s Financial Journey`;
        logEvent("👋 Welcome, " + gameState.playerName + "!", "Your journey begins now. Good luck!", "cyan");
    }

    async function presentChoice() {
        if (gameState.isGameOver) return;
        
        setAdvanceButtonLoading(true);
        let event = await generateAiChoiceEvent();
        setAdvanceButtonLoading(false);

        if (!event || !event.choices || event.choices.length === 0) {
            logEvent("Signal Lost...", "AI event generator is offline. Using a standard scenario.", "red");
            event = staticChoiceEvents[0];
        } else {
            logEvent("✨ AI Event!", "A unique event has occurred.", "cyan");
        }
        
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
        if (effect.log) {
            logEvent(effect.log.title, effect.log.message, effect.log.color);
        }
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
        if (type === 'debt') { 
            gameState.goal.target = 0; 
            gameState.goal.title = 'Goal: Pay Off Debt'; 
            gameState.goal.description = 'Eliminate your $30,000 student loan.'; 
        } else if (type === 'emergency') {
            gameState.goal.target = 10000;
            gameState.goal.title = 'Goal: Build Emergency Fund';
            gameState.goal.description = 'Save $10,000 in cash for unexpected events.';
        } else if (type === 'retire') { 
            gameState.goal.target = 500000; 
            gameState.goal.title = 'Goal: Early Retirement'; 
            gameState.goal.description = 'Grow your net worth to $500,000.'; 
        } 
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
        if (gameState.goal.type === 'debt') {
            progress = (30000 - gameState.debt) / 30000; 
        } else if (gameState.goal.type === 'retire') {
            progress = netWorth / gameState.goal.target; 
        } else if (gameState.goal.type === 'emergency') {
            progress = gameState.cash / gameState.goal.target;
        }
        progress = Math.max(0, Math.min(1, progress)); 
        ui.progressBar.style.width = `${progress * 100}%`; 
        ui.progressBar.textContent = `${Math.floor(progress * 100)}%`; 
    }

    function checkGameOver() { 
        const netWorth = gameState.cash + gameState.investments - gameState.debt; 
        let isWin = false; 
        if (gameState.goal.type === 'debt' && gameState.debt <= 0) { 
            isWin = true; showGameOver(true, "🏆 Goal Achieved! 🏆", `Congratulations, ${gameState.playerName}! You paid off all your student debt at age ${Math.floor(gameState.age)}.`); 
        } else if (gameState.goal.type === 'emergency' && gameState.cash >= gameState.goal.target) {
            isWin = true; showGameOver(true, "🏆 Goal Achieved! 🏆", "You've built your emergency fund! You're prepared for anything.");
        } else if (gameState.goal.type === 'retire' && netWorth >= gameState.goal.target) { 
            isWin = true; showGameOver(true, "🏆 You're Retired! 🏆", `With a net worth of ${formatCurrency(netWorth)}, you can retire early at age ${Math.floor(gameState.age)}!`); 
        } 
        if (!isWin && gameState.cash < 0 && netWorth < -10000) { 
            showGameOver(false, "Game Over", `You've gone bankrupt. Better luck next time, ${gameState.playerName}!`); 
        } 
    }

    function finishMonth() { gameState.age += 1/12; gameState.cash += gameState.monthlyIncome; const totalExpenses = Object.values(gameState.monthlyExpenses).reduce((a, b) => a + b, 0); gameState.cash -= totalExpenses; logEvent("Month End", `Paycheck received, expenses paid. Net: ${formatCurrency(gameState.monthlyIncome - totalExpenses)}.`, 'slate'); const interest = gameState.debt * (0.05 / 12); gameState.debt += interest; gameState.cash -= interest; logEvent("Debt Interest 📉", `Paid ${formatCurrency(interest)} in loan interest.`, "red"); if (gameState.investments > 0) { const growthRate = (Math.random() - 0.4) * 0.1 + 0.005; const growthAmount = gameState.investments * growthRate; gameState.investments += growthAmount; const growthMsg = growthAmount >= 0 ? `Portfolio grew by ${formatCurrency(growthAmount)}.` : `Portfolio lost ${formatCurrency(Math.abs(growthAmount))}.`; logEvent(`Investment Update ${growthAmount >= 0 ? '📈' : '📉'}`, growthMsg, growthAmount >= 0 ? 'green' : 'red'); } updateUI(); checkGameOver(); }
    function handleInvestment(fixedAmount) { const amount = fixedAmount || parseInt(ui.investAmountInput.value); if (isNaN(amount) || amount <= 0) { logEvent("Invalid Action", "Please enter a positive amount.", "red"); return; } if (amount > gameState.cash) { logEvent("Insufficient Funds 🛑", "Not enough cash.", "red"); return; } gameState.cash -= amount; gameState.investments += amount; logEvent("Investment Made 💰", `You invested ${formatCurrency(amount)}.`, "cyan"); ui.investAmountInput.value = ''; updateUI(); }
    function handleDebtPayment(fixedAmount) { const amount = fixedAmount || parseInt(ui.debtAmountInput.value); if (isNaN(amount) || amount <= 0) { logEvent("Invalid Action", "Please enter a positive amount.", "red"); return; } if (amount > gameState.cash) { logEvent("Insufficient Funds 🛑", "Not enough cash.", "red"); return; } const actualPayment = Math.min(amount, gameState.debt); gameState.cash -= actualPayment; gameState.debt -= actualPayment; logEvent("Debt Payment ✅", `You paid ${formatCurrency(actualPayment)} towards your debt.`, "green"); ui.debtAmountInput.value = ''; updateUI(); }
    async function showStarterStrategy() { ui.strategyContent.classList.add('hidden'); ui.strategyLoader.classList.remove('hidden'); const prompt = `I'm playing a financial simulation game. My name is ${gameState.playerName} and I'm ${gameState.age} years old. My chosen goal is to "${gameState.goal.title}". My starting situation is $2000 cash, $30000 debt, and a $3500 monthly income. Give me a simple, encouraging, high-level strategy to follow. Keep it to 2-3 short paragraphs. Use a cool, futuristic tone with emojis.`; const advice = await callGemini(prompt); ui.strategyLoader.classList.add('hidden'); ui.strategyResponse.innerHTML = advice.replace(/\n/g, '<br>'); ui.strategyResponse.classList.remove('hidden'); }
    async function showCoachAdvice() { ui.coachModal.classList.remove('hidden'); ui.coachResponse.classList.add('hidden'); ui.coachLoader.classList.remove('hidden'); const prompt = `I'm playing a financial simulation game with a futuristic neon theme. My name is ${gameState.playerName}. Here's my current status: - Age: ${Math.floor(gameState.age)} - Cash: ${formatCurrency(gameState.cash)} - Investments: ${formatCurrency(gameState.investments)} - Debt: ${formatCurrency(gameState.debt)} - My Goal: ${gameState.goal.title} (${gameState.goal.description}) Based on this, what is one piece of actionable advice you would give me for my next move? Keep it concise (1-2 paragraphs) and encouraging. Use a cool, futuristic tone with emojis.`; const advice = await callGemini(prompt); ui.coachLoader.classList.add('hidden'); ui.coachResponse.innerHTML = advice.replace(/\n/g, '<br>'); ui.coachResponse.classList.remove('hidden'); }
    function showGameOver(isWin, title, message) { gameState.isGameOver = true; ui.gameOverTitle.textContent = title; ui.gameOverMessage.textContent = message; ui.gameOverTitle.classList.add(isWin ? 'text-green-400' : 'text-red-400'); ui.gameOverModal.classList.remove('hidden'); }

    // --- START THE GAME ---
    init();
});