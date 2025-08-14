// public/js/pocket-cfo.js - V4 (DEFINITIVE & FULLY FUNCTIONAL)

// --- STATE MANAGEMENT ---
let state = {
    transactions: [],
    goals: [],
    income: 0
};

// --- DOM ELEMENT REFERENCES ---
const elements = {
    // Summary
    summaryIncome: document.getElementById('summary-income'),
    summaryExpenses: document.getElementById('summary-expenses'),
    summarySavings: document.getElementById('summary-savings'),
    // Transaction Form
    transactionForm: document.getElementById('transaction-form'),
    transactionDescription: document.getElementById('transaction-description'),
    transactionAmount: document.getElementById('transaction-amount'),
    transactionCategory: document.getElementById('transaction-category'),
    transactionsList: document.getElementById('transactions-list'),
    recentTransactionsContainer: document.getElementById('recent-transactions-container'),
    // Goal Form
    goalForm: document.getElementById('goal-form'),
    goalName: document.getElementById('goal-name'),
    goalAmount: document.getElementById('goal-amount'),
    goalsList: document.getElementById('goals-list'),
    // Boosts
    boostAmount: document.getElementById('boost-amount'),
    addBonusBtn: document.getElementById('add-bonus-btn'),
    increaseSalaryBtn: document.getElementById('increase-salary-btn'),
    // What-If Scenario
    whatIfIncrease: document.getElementById('what-if-increase'),
    whatIfDuration: document.getElementById('what-if-duration'), // This was the broken part
    whatIfButton: document.getElementById('what-if-button'),
    // Modal
    scenarioModal: document.getElementById('scenario-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalResults: document.getElementById('modal-results'),
    // AI Tips
    getAiTipsButton: document.getElementById('get-ai-tips-button'),
    aiTipsContent: document.getElementById('ai-tips-content'),
};


// ADD THIS NEW FUNCTION to your script.
// A good place is right after the 'elements' object.

async function fetchUserIncome() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
            // User is likely not logged in. Default to 0.
            console.log('User not logged in or session expired. Defaulting income to 0.');
            return 0;
        }
        const user = await response.json();
        // Return the income from the user's profile.
        return parseFloat(user.monthlyIncome) || 0;
    } catch (error) {
        console.error("Could not fetch user profile:", error);
        // On any network error, safely default to 0.
        return 0;
    }
}

// REPLACE your old saveState and loadState with these:

function saveState() {
    // We only save the CFO-specific data. Income is read-only from the server.
    localStorage.setItem('pocketCFOState', JSON.stringify({
        transactions: state.transactions,
        goals: state.goals
    }));
}

function loadLocalCFOData() {
    // This function now ONLY loads transactions and goals, not income.
    const savedCFOState = localStorage.getItem('pocketCFOState');
    if (savedCFOState) {
        const parsedState = JSON.parse(savedCFOState);
        state.transactions = parsedState.transactions || [];
        state.goals = parsedState.goals || [];
    }
}

// --- UI RENDERING ---

// REPLACE your old render function with this new one

function render() {
    // --- Part 1: Render the top summary and transactions (mostly unchanged) ---
    const totalExpenses = state.transactions.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = state.income - totalExpenses;

    elements.summaryIncome.textContent = `₹${state.income.toLocaleString()} / month`;
    elements.summaryExpenses.textContent = `₹${totalExpenses.toLocaleString()}`;
    elements.summarySavings.textContent = `₹${netSavings.toLocaleString()}`;

    // ... (Your recent transactions visibility logic is safe here) ...
    if (state.transactions.length > 0) {
        elements.recentTransactionsContainer.classList.remove('hidden');
    } else {
        elements.recentTransactionsContainer.classList.add('hidden');
    }

    elements.transactionsList.innerHTML = state.transactions.length === 0
        ? '<p>No transactions yet.</p>'
        : `<ul>${state.transactions.slice().reverse().map(t => `<li class="category-${t.category}"><span>${t.description}<em>${t.category}</em></span> <span>-₹${t.amount.toLocaleString()}</span> <button class="transaction-delete-btn" data-id="${t.id}">X</button></li>`).join('')}</ul>`;


    // --- Part 2: New Goal Rendering Logic ---
    if (state.goals.length === 0) {
        elements.goalsList.innerHTML = '<p>No goals yet. Add one to start saving!</p>';
    } else {
        // Separate goals into active and achieved
        const activeGoals = state.goals.filter(g => !g.achieved);
        const achievedGoals = state.goals.filter(g => g.achieved);
        
        let availableSavingsPool = Math.max(0, netSavings);
        let goalsHtml = '';

        // Render ACTIVE goals with the waterfall savings projection
        activeGoals.forEach(goal => {
            const baseSaved = goal.saved || 0;
            const amountStillNeeded = Math.max(0, goal.amount - baseSaved);
            const contributionThisMonth = Math.min(amountStillNeeded, availableSavingsPool);
            const totalProjectedSaved = baseSaved + contributionThisMonth;
            const progress = Math.min((totalProjectedSaved / goal.amount) * 100, 100).toFixed(0);
            availableSavingsPool -= contributionThisMonth;
            
            goalsHtml += `
                <div class="goal-item">
                    <p><strong>${goal.name}</strong> <span>₹${totalProjectedSaved.toLocaleString()} / ₹${goal.amount.toLocaleString()}</span></p>
                    <div class="progress-bar">
                        <div class="progress-bar-inner" style="width: ${progress}%;">${progress}%</div>
                    </div>
                    <div class="goal-buttons">
                        <button class="btn btn-primary" data-id="${goal.id}" data-action="achieve">Achieve</button>
                        <button class="btn btn-accent" data-id="${goal.id}" data-action="drop">Drop</button>
                    </div>
                </div>`;
        });

        // Render ACHIEVED goals separately as a static success message
        achievedGoals.forEach(goal => {
            goalsHtml += `
                <div class="goal-item achieved">
                    <p><strong>✅ ${goal.name}</strong> <span>Achieved!</span></p>
                </div>`;
        });

        elements.goalsList.innerHTML = goalsHtml;
    }
}

// --- EVENT HANDLER FUNCTIONS ---
function handleAddTransaction(event) {
    event.preventDefault();
    const description = elements.transactionDescription.value;
    const amount = parseFloat(elements.transactionAmount.value);
    const category = elements.transactionCategory.value;

    if (!description || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid description and amount.');
        return;
    }
    state.transactions.push({ id: Date.now(), description, amount, category });
    saveState(); render();
    elements.transactionForm.reset();
}

function handleDeleteTransaction(event) {
    if (event.target.classList.contains('transaction-delete-btn')) {
        const idToDelete = parseInt(event.target.dataset.id);
        state.transactions = state.transactions.filter(t => t.id !== idToDelete);
        saveState(); render();
    }
}

function handleAddGoal(event) {
    event.preventDefault();
    const name = elements.goalName.value;
    const amount = parseFloat(elements.goalAmount.value);

    if (!name || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid goal name and target amount.');
        return;
    }
    state.goals.push({ id: Date.now(), name, amount, saved: 0 });
    saveState(); render();
    elements.goalForm.reset();
}

// REPLACE your old handleManageGoal function with this one

function handleManageGoal(event) {
    const action = event.target.dataset.action;
    if (!action) return;

    const goalId = parseInt(event.target.dataset.id);
    const goalIndex = state.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return; // Goal not found

    const goal = state.goals[goalIndex];

    if (action === 'achieve') {
        // 1. Create a transaction for the goal amount
        state.transactions.push({
            id: Date.now(),
            description: `Goal Achieved: ${goal.name}`,
            amount: goal.amount,
            category: 'Goals' // A new, dedicated category
        });

        // 2. Mark the goal as achieved instead of deleting it
        state.goals[goalIndex].achieved = true;
        
        alert(`Congratulations on achieving your goal: "${goal.name}"! This has been recorded as an expense.`);

    } else if (action === 'drop') {
        // The "drop" action still just removes the goal
        state.goals.splice(goalIndex, 1);
        alert(`Goal removed: "${goal.name}".`);
    }

    // 3. Save the new state and re-render the UI
    saveState();
    render();
}

function handleAddBonus() {
    const amount = parseFloat(elements.boostAmount.value);
    if (isNaN(amount) || amount <= 0 || state.goals.length === 0) {
        alert('Please enter a valid bonus amount and add a goal first.');
        return;
    }
    state.goals[0].saved = (state.goals[0].saved || 0) + amount;
    alert(`Bonus of ₹${amount.toLocaleString()} applied to your "${state.goals[0].name}" goal!`);
    saveState(); render();
    elements.boostAmount.value = '';
}

// REPLACE your old handleIncreaseSalary function with this:

function handleIncreaseSalary() {
    const amount = parseFloat(elements.boostAmount.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid salary increase amount.');
        return;
    }
    // This is a temporary simulation. It does NOT change the official income.
    alert(`This is a simulation. To permanently update your income, please go to your Dashboard.`);
    // We don't save or change the core state.income here.
    elements.boostAmount.value = '';
}

function handleShowWhatIf() {
    const expenseIncrease = parseFloat(elements.whatIfIncrease.value);
    const duration = parseInt(elements.whatIfDuration.value) || 1;

    if (isNaN(expenseIncrease) || expenseIncrease <= 0) {
        alert('Please enter a valid number for the expense increase.');
        return;
    }

    const currentExpenses = state.transactions.reduce((sum, t) => sum + t.amount, 0);
    const currentSavings = state.income - currentExpenses;
    const projectedSavings = state.income - (currentExpenses + expenseIncrease);

    let resultsHtml = `<p><strong>Projection over ${duration} months:</strong></p><ul>`;
    resultsHtml += `<li>Current Monthly Savings: <strong>₹${currentSavings.toLocaleString()}</strong></li>`;
    resultsHtml += `<li>Projected Monthly Savings: <strong class="${projectedSavings < 0 ? 'error-message' : 'success-message'}">₹${projectedSavings.toLocaleString()}</strong></li>`;
    resultsHtml += `<li>Total Savings Impact Over Period: <strong class="error-message">-₹${((currentSavings - projectedSavings) * duration).toLocaleString()}</strong></li>`;
    resultsHtml += `</ul>`;

    elements.modalResults.innerHTML = resultsHtml;
    elements.scenarioModal.classList.remove('hidden');
}

async function handleGetAiTips() {
    elements.aiTipsContent.innerHTML = '<p>🧠 Thinking... Our AI is analyzing your spending habits...</p>';
    try {
        const response = await fetch('/api/financial-advice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spendingData: { income: state.income, transactions: state.transactions } })
        });
        if (!response.ok) throw new Error('AI server responded with an error.');
        const data = await response.json();
        elements.aiTipsContent.innerHTML = data.advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    } catch (error) {
        console.error("Error fetching AI tips:", error);
        elements.aiTipsContent.innerHTML = '<p class="error-message">Could not get AI tips at this time.</p>';
    }
}

// REPLACE your entire initialize function with this new async version:

async function initialize() {
    // 1. Fetch the official income from the server.
    state.income = await fetchUserIncome();

    // 2. Load local data like transactions and goals.
    loadLocalCFOData();

    // 3. Set up all the event listeners.
    elements.transactionForm.addEventListener('submit', handleAddTransaction);
    elements.transactionsList.addEventListener('click', handleDeleteTransaction);
    elements.goalForm.addEventListener('submit', handleAddGoal);
    elements.goalsList.addEventListener('click', handleManageGoal);
    elements.addBonusBtn.addEventListener('click', handleAddBonus);
    elements.increaseSalaryBtn.addEventListener('click', handleIncreaseSalary);
    elements.whatIfButton.addEventListener('click', handleShowWhatIf);
    elements.getAiTipsButton.addEventListener('click', handleGetAiTips);

    elements.modalCloseBtn.addEventListener('click', () => elements.scenarioModal.classList.add('hidden'));
    elements.scenarioModal.addEventListener('click', (e) => {
        if (e.target === elements.scenarioModal) elements.scenarioModal.classList.add('hidden');
    });

    // 4. Render the page with all the correct data.
    render();
}

initialize();