// public/js/tax-buddy.js - V8 (DEFINITIVE & STABLE) - Calendar has been completely removed.

let state = {
    ledger: [],
    expenses: []
};

const elements = {
    summaryBilled: document.getElementById('summary-billed'),
    summaryCollected: document.getElementById('summary-collected'),
    summaryOutstanding: document.getElementById('summary-outstanding'),
    invoiceForm: document.getElementById('invoice-form'),
    clientName: document.getElementById('client-name'),
    lineItems: document.getElementById('line-items'),
    gstRate: document.getElementById('gst-rate'),
    invoicePreview: document.getElementById('invoice-preview'),
    invoicePreviewWrapper: document.getElementById('invoice-preview-wrapper'), // NEW
    printInvoiceBtn: document.getElementById('print-invoice-btn'),
    ledgerTableContainer: document.getElementById('ledger-table-container'),
    expenseForm: document.getElementById('expense-form'),
    expenseDesc: document.getElementById('expense-desc'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseListContainer: document.getElementById('expense-list-container'),
    taxCalculatorForm: document.getElementById('tax-calculator-form'),
    taxIncome: document.getElementById('tax-income'),
    taxDeductions: document.getElementById('tax-deductions'),
    taxResult: document.getElementById('tax-result'),
    profession: document.getElementById('profession'),
    getAiDeductionsBtn: document.getElementById('get-ai-deductions-btn'),
    aiDeductionsContent: document.getElementById('ai-deductions-content'),
    secondaryContent: document.getElementById('secondary-content'),
    aiLoader: document.getElementById('ai-loader')
};

function saveState() {
    localStorage.setItem('taxBuddyState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('taxBuddyState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        state.ledger = parsedState.ledger || [];
        state.expenses = parsedState.expenses || [];
    }
}

function render() {
    const totalBilled = state.ledger.reduce((sum, item) => sum + item.total, 0);
    const totalCollected = state.ledger.filter(i => i.status === 'paid').reduce((sum, item) => sum + item.total, 0);
    const outstanding = totalBilled - totalCollected;
    const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const taxableIncome = Math.max(0, totalCollected - totalExpenses);

    elements.summaryBilled.textContent = `₹${totalBilled.toLocaleString()}`;
    elements.summaryCollected.textContent = `₹${totalCollected.toLocaleString()}`;
    elements.summaryOutstanding.textContent = `₹${outstanding.toLocaleString()}`;
    elements.taxIncome.value = taxableIncome;

    elements.ledgerTableContainer.innerHTML = state.ledger.length === 0 ? '<p>No invoices yet.</p>' : `
        <table class="ledger-table"><thead><tr><th>Date</th><th>Client</th><th>Status</th><th class="ledger-amount">Amount</th><th>Action</th></tr></thead><tbody>
        ${state.ledger.slice().reverse().map(item => `
            <tr class="status-${item.status}">
                <td>${item.date}</td>
                <td>${item.client}</td>
                <td>${item.status.toUpperCase()}</td>
                <td class="ledger-amount">₹${item.total.toLocaleString()}</td>
                <td>${item.status === 'unpaid' ? `<button class="action-btn" data-id="${item.id}">Mark Paid</button>` : '—'}</td>
            </tr>`).join('')}
        </tbody></table>`;
    
    elements.expenseListContainer.innerHTML = state.expenses.length === 0 ? '' : `<ul>${state.expenses.slice().reverse().map(e => `<li><span>${e.desc}</span><span>-₹${e.amount.toLocaleString()}</span></li>`).join('')}</ul>`;
}

function handleInvoiceGenerate(e) {
    e.preventDefault();
    const client = elements.clientName.value.trim();
    const itemsText = elements.lineItems.value.trim();
    const gst = parseFloat(elements.gstRate.value);

    // THIS IS THE CRITICAL VALIDATION
    if (!client || !itemsText || isNaN(gst)) { 
        alert('Please fill out all invoice fields correctly before generating.'); 
        return; // It stops here if fields are empty
    }

    const items = itemsText.split('\n').map(line => {
        const [desc, qty, price] = line.split(',');
        return { desc: (desc || '').trim(), qty: parseInt(qty) || 0, price: parseFloat(price) || 0 };
    });
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const gstAmount = subtotal * (gst / 100);
    const total = subtotal + gstAmount;

    let invoiceHtml = `<h4>Invoice for ${client}</h4><table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>`;
    items.forEach(item => {
        const itemTotal = item.qty * item.price;
        invoiceHtml += `<tr><td>${item.desc}</td><td>${item.qty}</td><td>₹${item.price.toLocaleString()}</td><td>₹${itemTotal.toLocaleString()}</td></tr>`;
    });
    invoiceHtml += `<tr><td colspan="3" class="total">Subtotal</td><td class="total">₹${subtotal.toLocaleString()}</td></tr>`;
    invoiceHtml += `<tr><td colspan="3" class="total">GST (${gst}%)</td><td class="total">₹${gstAmount.toLocaleString()}</td></tr>`;
    invoiceHtml += `<tr><td colspan="3" class="total">Grand Total</td><td class="total">₹${total.toLocaleString()}</td></tr>`;
    invoiceHtml += '</table>';

    elements.invoicePreview.innerHTML = invoiceHtml;
    elements.invoicePreviewWrapper.classList.remove('hidden'); 
    elements.printInvoiceBtn.classList.remove('hidden');

    state.ledger.push({ id: Date.now(), date: new Date().toLocaleDateString(), client, total, status: 'unpaid' });
    
    // This line runs ONLY after validation passes
    elements.secondaryContent.classList.remove('hidden');

    saveState();
    render();
    elements.invoiceForm.reset();
}

function handlePrintInvoice() {
    const previewContent = elements.invoicePreview.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Invoice</title><style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;} th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;} .total{font-weight:bold;text-align:right;}</style></head><body>${previewContent}</body></html>`);
    printWindow.document.close();
    printWindow.print();
}

function handleAddExpense(e) {
    e.preventDefault();
    const desc = elements.expenseDesc.value;
    const amount = parseFloat(elements.expenseAmount.value);
    if (!desc || isNaN(amount) || amount <= 0) { 
        alert('Please enter a valid expense description and amount.'); 
        return; 
    }
    state.expenses.push({ desc, amount });
    saveState();
    render();
    elements.expenseForm.reset();
}

function handleMarkAsPaid(e) {
    if (e.target.classList.contains('action-btn')) {
        const id = parseInt(e.target.dataset.id);
        const invoice = state.ledger.find(i => i.id === id);
        if (invoice) {
            invoice.status = 'paid';
            saveState();
            render();
        }
    }
}

function handleTaxCalculate(e) {
    e.preventDefault();
    const income = parseFloat(elements.taxIncome.value);
    const deductions = parseFloat(elements.taxDeductions.value);
    const taxableIncome = Math.max(0, income - deductions);
    let tax = 0;

    if (taxableIncome > 1000000) { 
        tax = 112500 + (taxableIncome - 1000000) * 0.3; 
    } else if (taxableIncome > 500000) { 
        tax = 12500 + (taxableIncome - 500000) * 0.2; 
    } else if (taxableIncome > 250000) { 
        tax = (taxableIncome - 250000) * 0.05; 
    }

    elements.taxResult.innerHTML = `Taxable Income: ₹${taxableIncome.toLocaleString()}<br>Estimated Tax: ₹${tax.toLocaleString()}`;
}

async function handleGetAiDeductions() {
    const profession = elements.profession.value;
    if (!profession) { alert('Please enter your profession.'); return; }
    elements.aiDeductionsContent.innerHTML = '<p>🧠 Thinking... Our AI is finding deductions for you...</p>';
    try {
        const response = await fetch('/api/tax-advice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profession })
        });
        if (!response.ok) throw new Error('AI server responded with an error.');
        const data = await response.json();
        elements.aiDeductionsContent.innerHTML = data.advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    } catch (error) {
        console.error("Error fetching AI tips:", error);
        elements.aiDeductionsContent.innerHTML = '<p class="error-message">Could not get AI tips.</p>';
    }
}


function initialize() {
    loadState();
    render();

    elements.invoiceForm.addEventListener('submit', handleInvoiceGenerate);
    elements.printInvoiceBtn.addEventListener('click', handlePrintInvoice);
    elements.expenseForm.addEventListener('submit', handleAddExpense);
    elements.ledgerTableContainer.addEventListener('click', handleMarkAsPaid);
    elements.taxCalculatorForm.addEventListener('submit', handleTaxCalculate);
    elements.getAiDeductionsBtn.addEventListener('click', handleGetAiDeductions);
}

initialize();