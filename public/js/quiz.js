// js/quiz.js

const quizData = {
    easy: [
        {
            question: "What is a budget?",
            options: ["A plan for how you will spend and save money", "A type of bank account", "A loan from a bank", "A credit card limit"],
            answer: "A plan for how you will spend and save money"
        },
        {
            question: "Which of these is typically NOT an expense?",
            options: ["Rent", "Groceries", "Salary", "Utilities"],
            answer: "Salary"
        },
        {
            question: "What does 'saving money' mean?",
            options: ["Spending all your money at once", "Putting money aside for future use", "Investing in stocks", "Borrowing money from a friend"],
            answer: "Putting money aside for future use"
        },
        {
            question: "What is interest when you save money in a bank?",
            options: ["A fee you pay the bank", "Extra money the bank pays you for keeping your money with them", "A penalty for withdrawing money", "The total amount you saved"],
            answer: "Extra money the bank pays you for keeping your money with them"
        },
        {
            question: "What is the safest place to keep a small amount of savings?",
            options: ["Under your mattress", "A regular savings account", "In high-risk stocks", "In a piggy bank (for large amounts)"],
            answer: "A regular savings account"
        },
        {
            question: "Which term refers to money earned from work?",
            options: ["Debt", "Income", "Expense", "Loan"],
            answer: "Income"
        },
        {
            question: "What is the primary purpose of a piggy bank?",
            options: ["To store secret documents", "To save coins and small amounts of money", "To keep food fresh", "To play games"],
            answer: "To save coins and small amounts of money"
        },
        {
            question: "If you want to buy something expensive in the future, what should you do?",
            options: ["Buy it on credit immediately", "Save money for it over time", "Ask a friend to buy it for you", "Forget about it"],
            answer: "Save money for it over time"
        },
        {
            question: "What is a common reason people get into debt?",
            options: ["Saving too much money", "Spending more money than they earn", "Always paying bills on time", "Investing wisely"],
            answer: "Spending more money than they earn"
        },
        {
            question: "Which of these is a basic need for which you budget?",
            options: ["A new smartphone", "Food", "Concert tickets", "Designer clothes"],
            answer: "Food"
        }
    ],
    medium: [
        {
            question: "What is inflation?",
            options: ["A decrease in the price of goods and services", "An increase in the value of money", "A general increase in prices and fall in the purchasing value of money", "A type of investment"],
            answer: "A general increase in prices and fall in the purchasing value of money"
        },
        {
            question: "What does ROI stand for?",
            options: ["Risk of Investment", "Return on Investment", "Rate of Interest", "Revenue over Income"],
            answer: "Return on Investment"
        },
        {
            question: "Which of these is considered a 'fixed expense'?",
            options: ["Restaurant meals", "Electricity bill (fluctuates)", "Rent", "Clothing purchases"],
            answer: "Rent"
        },
        {
            question: "What is a diversified investment portfolio?",
            options: ["Putting all your money into one stock", "Investing in only one type of asset", "Spreading investments across various assets to reduce risk", "Only investing in very safe assets"],
            answer: "Spreading investments across various assets to reduce risk"
        },
        {
            question: "What is a credit score primarily used for?",
            options: ["To track your spending habits", "To determine your eligibility for loans and interest rates", "To measure your income", "To calculate your tax returns"],
            answer: "To determine your eligibility for loans and interest rates"
        },
        {
            question: "Which of the following describes an asset?",
            options: ["Something you owe to others", "Something you own that has value", "Money you spend regularly", "A type of insurance policy"],
            answer: "Something you own that has value"
        },
        {
            question: "What is a stock?",
            options: ["A type of bond issued by the government", "A physical product sold in a store", "A share of ownership in a company", "A type of savings account"],
            answer: "A share of ownership in a company"
        },
        {
            question: "What is the purpose of an emergency fund?",
            options: ["To buy luxury items", "To cover unexpected expenses like job loss or medical bills", "To invest in the stock market", "To pay for a vacation"],
            answer: "To cover unexpected expenses like job loss or medical bills"
        },
        {
            question: "Which of these is a disadvantage of using a credit card irresponsibly?",
            options: ["Building a good credit score", "Earning rewards points", "Accumulating high-interest debt", "Convenient online shopping"],
            answer: "Accumulating high-interest debt"
        },
        {
            question: "What is a common financial goal for many young adults?",
            options: ["Never saving money", "Retiring at age 25", "Buying a house or saving for higher education", "Spending all income on entertainment"],
            answer: "Buying a house or saving for higher education"
        }
    ],
    hard: [
        {
            question: "What is 'compound interest'?",
            options: ["Interest calculated only on the principal amount", "Interest earned on both the initial principal and the accumulated interest from previous periods", "Interest paid only on loans", "Interest that never changes"],
            answer: "Interest earned on both the initial principal and the accumulated interest from previous periods"
        },
        {
            question: "What is an ETF?",
            options: ["Extra Tax Form", "Exchange-Traded Fund", "Estimated Total Forecast", "Electronic Transfer Fee"],
            answer: "Exchange-Traded Fund"
        },
        {
            question: "What is the difference between a bull market and a bear market?",
            options: ["A bull market is rising, a bear market is falling", "A bull market is falling, a bear market is rising", "They refer to different types of commodities", "They describe market volatility, not direction"],
            answer: "A bull market is rising, a bear market is falling"
        },
        {
            question: "What is 'fiat money'?",
            options: ["Money backed by a physical commodity like gold", "Money that has value because a government has declared it to be legal tender", "Money used only for international trade", "A digital currency like Bitcoin"],
            answer: "Money that has value because a government has declared it to be legal tender"
        },
        {
            question: "What is 'asset allocation'?",
            options: ["The process of selling all your assets", "Distributing investments among various asset classes (e.g., stocks, bonds, cash)", "Calculating the total value of your assets", "A government program to distribute wealth"],
            answer: "Distributing investments among various asset classes (e.g., stocks, bonds, cash)"
        },
        {
            question: "What is 'quantitative easing'?",
            options: ["A policy where a central bank buys government bonds or other financial assets to inject money into the economy", "A method of reducing government spending", "A strategy for increasing taxes", "A way to reduce the national debt by selling assets"],
            answer: "A policy where a central bank buys government bonds or other financial assets to inject money into the economy"
        },
        {
            question: "What is the significance of the 'Rule of 72' in finance?",
            options: ["It calculates the ideal age for retirement", "It estimates the time it takes for an investment to double at a given annual rate of return", "It determines the maximum interest rate on a loan", "It specifies the number of years you must save before investing"],
            answer: "It estimates the time it takes for an investment to double at a given annual rate of return"
        },
        {
            question: "Which of these financial instruments represents a loan made by an investor to a borrower (typically corporate or governmental)?",
            options: ["Stock", "Mutual Fund", "Bond", "Certificate of Deposit"],
            answer: "Bond"
        },
        {
            question: "What is a 'capital gain'?",
            options: ["The profit from the sale of a capital asset (like stock or real estate)", "The amount of money invested in a business", "A type of government grant", "Losses incurred from investments"],
            answer: "The profit from the sale of a capital asset (like stock or real estate)"
        },
        {
            question: "In economics, what does GDP stand for?",
            options: ["Global Development Project", "Gross Domestic Product", "Government Debt Protocol", "General Distribution Plan"],
            answer: "Gross Domestic Product"
        }
    ]
};

let currentDifficulty = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null; // To store the currently selected option element

const difficultySelectionSection = document.getElementById('difficulty-selection');
const quizGameSection = document.getElementById('quiz-game');
const quizResultsSection = document.getElementById('quiz-results');

const difficultyButtons = document.querySelectorAll('#difficulty-selection .btn');
const currentDifficultyDisplay = document.getElementById('current-difficulty');
const questionNumberDisplay = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextQuestionBtn = document.getElementById('next-question-btn');
const feedbackMessage = document.getElementById('feedback');
const finalScoreDisplay = document.getElementById('final-score');
const totalQuestionsDisplay = document.getElementById('total-questions');
const scoreMessageDisplay = document.getElementById('score-message');
const restartQuizBtn = document.getElementById('restart-quiz-btn');

function showSection(section) {
    difficultySelectionSection.classList.add('hidden');
    quizGameSection.classList.add('hidden');
    quizResultsSection.classList.add('hidden');
    section.classList.remove('hidden');
}

function startQuiz(difficulty) {
    currentDifficulty = difficulty;
    currentQuestions = [...quizData[difficulty]]; // Create a copy
    // Shuffle questions to make it different each time
    currentQuestions.sort(() => Math.random() - 0.5); 
    currentQuestionIndex = 0;
    score = 0;
    selectedOption = null;

    currentDifficultyDisplay.textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`;
    totalQuestionsDisplay.textContent = currentQuestions.length; // Ensure it's 10

    showSection(quizGameSection);
    loadQuestion();
}

function loadQuestion() {
    feedbackMessage.textContent = '';
    feedbackMessage.className = 'feedback-message'; // Reset classes
    nextQuestionBtn.classList.add('hidden');
    optionsContainer.innerHTML = ''; // Clear previous options
    selectedOption = null;

    if (currentQuestionIndex < currentQuestions.length) {
        const question = currentQuestions[currentQuestionIndex];
        questionNumberDisplay.textContent = currentQuestionIndex + 1;
        questionText.textContent = question.question;

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = option;
            button.addEventListener('click', () => selectOption(button, question.answer));
            optionsContainer.appendChild(button);
        });
    } else {
        showResults();
    }
}

function selectOption(selectedButton, correctAnswer) {
    // Disable all options once one is selected
    Array.from(optionsContainer.children).forEach(button => {
        button.classList.add('disabled');
        button.removeEventListener('click', button.listener); // Remove previous listeners
    });

    selectedOption = selectedButton;
    selectedButton.classList.add('selected');

    if (selectedButton.textContent === correctAnswer) {
        score++;
        selectedButton.classList.add('correct');
        feedbackMessage.textContent = 'Correct!';
        feedbackMessage.classList.add('correct');
    } else {
        selectedButton.classList.add('incorrect');
        feedbackMessage.textContent = `Incorrect. The answer was: ${correctAnswer}`;
        feedbackMessage.classList.add('incorrect');
        // Highlight the correct answer
        Array.from(optionsContainer.children).forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            }
        });
    }

    nextQuestionBtn.classList.remove('hidden');
}

function showResults() {
    finalScoreDisplay.textContent = score;
    let message = '';
    if (score === currentQuestions.length) {
        message = "Fantastic! You're a financial genius!";
    } else if (score >= currentQuestions.length * 0.7) {
        message = "Great job! You have a solid understanding of finance.";
    } else if (score >= currentQuestions.length * 0.4) {
        message = "Good effort! Keep learning to improve your financial knowledge.";
    } else {
        message = "Time to hit the GenZ Moneyverse for more learning!";
    }
    scoreMessageDisplay.textContent = message;
    showSection(quizResultsSection);
}

// Event Listeners
difficultyButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const difficulty = event.target.dataset.difficulty;
        startQuiz(difficulty);
    });
});

nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    loadQuestion();
});

restartQuizBtn.addEventListener('click', () => {
    showSection(difficultySelectionSection);
});

// Initial state
showSection(difficultySelectionSection);