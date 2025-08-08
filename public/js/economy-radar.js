// public/js/economy-radar.js - V11 (DEFINITIVE) - All features restored and working correctly.

const elements = {
    yearSelector: document.getElementById('year-selector'),
    inflationRate: document.getElementById('inflation-rate'),
    gdpGrowth: document.getElementById('gdp-growth'),
    exchangeRatesList: document.getElementById('exchange-rates-list'),
    aiExplainerContent: document.getElementById('ai-explainer-content'),
    // Calculator Elements
    inflationCalcForm: document.getElementById('inflation-calc-form'),
    monthlySpending: document.getElementById('monthly-spending'),
    inflationResult: document.getElementById('inflation-result'),
    loanCalcForm: document.getElementById('loan-calc-form'),
    loanAmount: document.getElementById('loan-amount'),
    loanDuration: document.getElementById('loan-duration'),
    loanInterestRate: document.getElementById('loan-interest-rate'),
    loanResult: document.getElementById('loan-result')
};

let currentInflationRate = 0;
let currentInterestRate = 0; // This is only used for the calculator if needed

function populateYearSelector() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    for (let i = 0; i < 10; i++) {
        const year = startYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.yearSelector.appendChild(option);
    }
}

function setLoadingState(isLoading) {
    if (isLoading) {
        elements.inflationRate.textContent = 'Loading...';
        elements.gdpGrowth.textContent = 'Loading...';
        elements.exchangeRatesList.innerHTML = '<p>Loading exchange rates...</p>';
        elements.aiExplainerContent.innerHTML = '<p>Fetching data and generating AI analysis...</p>';
    }
}

async function fetchAndDisplayEconomicData(year) {
    setLoadingState(true);
    try {
        const response = await fetch(`/api/economic-data?year=${year}`);
        if (!response.ok) throw new Error('Failed to fetch data from server.');
        const result = await response.json();

        // Handle Inflation
        const inflationValue = parseFloat(result.data.inflation);
        elements.inflationRate.textContent = !isNaN(inflationValue) ? `${inflationValue.toFixed(2)}%` : 'Data N/A';
        currentInflationRate = !isNaN(inflationValue) ? inflationValue : 0;

        // Handle GDP Growth (from your data)
        const gdpValue = parseFloat(result.data.gdp);
        elements.gdpGrowth.textContent = !isNaN(gdpValue) ? `${gdpValue.toFixed(2)}%` : 'Data N/A';
        
        // Handle Exchange Rates
        const rates = result.data.exchangeRates;
        let ratesHtml = '';
        if (rates) {
             const currencyMap = { usd: 'USD', eur: 'EUR', jpy: 'JPY', gbp: 'GBP', aud: 'AUD' };
            for (const key in currencyMap) {
                const rateValue = parseFloat(rates[key]);
                if (!isNaN(rateValue) && rateValue > 0) {
                    ratesHtml += `<div class="exchange-rate-item"><h4>vs ${currencyMap[key]}</h4><p>₹${rateValue.toFixed(2)}</p></div>`;
                }
            }
        }
        elements.exchangeRatesList.innerHTML = ratesHtml || '<p>Exchange rate data not available.</p>';
        
        // Handle AI Explanation
        elements.aiExplainerContent.innerHTML = result.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    } catch (error) {
        console.error("Error:", error);
        elements.aiExplainerContent.innerHTML = '<p class="error-message">Could not load economic data.</p>';
    }
}

function handleInflationCalc(e) {
    e.preventDefault();
    const spending = parseFloat(elements.monthlySpending.value);
    if (isNaN(spending) || spending <= 0) {
        elements.inflationResult.innerHTML = '<p class="error-message">Please enter a valid amount.</p>';
        return;
    }
    if (currentInflationRate === 0) {
        elements.inflationResult.innerHTML = '<p class="error-message">Inflation data is not available for calculation.</p>';
        return;
    }
    const futureCost = spending * (1 + (currentInflationRate / 100));
    const increase = futureCost - spending;
    elements.inflationResult.innerHTML = `Based on the selected year's inflation of <strong>${currentInflationRate.toFixed(2)}%</strong>, spending could have increased by <strong>₹${increase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.`;
}

function handleLoanCalc(e) {
    e.preventDefault();
    const P = parseFloat(elements.loanAmount.value);
    const tenureYears = parseInt(elements.loanDuration.value);
    const userInterestRate = parseFloat(elements.loanInterestRate.value);

    if (isNaN(P) || P <= 0 || isNaN(tenureYears) || tenureYears <= 0 || isNaN(userInterestRate) || userInterestRate <= 0) {
        elements.loanResult.innerHTML = '<p class="error-message">Please enter a valid loan amount, duration, and interest rate.</p>';
        return;
    }

    const N = tenureYears * 12;
    let r_current = userInterestRate / 12 / 100;
    let emi_current = (P * r_current * Math.pow(1 + r_current, N)) / (Math.pow(1 + r_current, N) - 1);
    let r_future = (userInterestRate + 1) / 12 / 100;
    let emi_future = (P * r_future * Math.pow(1 + r_future, N)) / (Math.pow(1 + r_future, N) - 1);
    elements.loanResult.innerHTML = `At <strong>${userInterestRate.toFixed(2)}%</strong> for a <strong>${tenureYears}-year</strong> loan, the estimated EMI is: <strong>₹${emi_current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>/month.<br>If rates rose by 1%, the EMI could become: <strong>₹${emi_future.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>/month.`;
}

function handleYearChange() {
    const selectedYear = elements.yearSelector.value;
    fetchAndDisplayEconomicData(selectedYear);
}

function init() {
    populateYearSelector();
    elements.yearSelector.addEventListener('change', handleYearChange);
    handleYearChange();
    elements.inflationCalcForm.addEventListener('submit', handleInflationCalc);
    elements.loanCalcForm.addEventListener('submit', handleLoanCalc);
}

init();