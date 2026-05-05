// ===== ZAKAT CALCULATOR JAVASCRIPT =====

// Global Constants
const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;

// Default prices (these would ideally come from an API)
let goldPricePerGram = 65; // USD
let silverPricePerGram = 0.80; // USD

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize all components
    initNavigation();
    initCategoryToggles();
    initFaqAccordion();
    initCalculator();
    updateNisabPrices();
    
    // Set default gold/silver prices in form
    document.getElementById('goldPricePerGram').value = goldPricePerGram;
    document.getElementById('silverPricePerGram').value = silverPricePerGram;
}

// ===== NAVIGATION =====
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile menu
                navLinks?.classList.remove('active');
            }
        });
    });
    
    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    });
}

// ===== CATEGORY TOGGLES =====
function initCategoryToggles() {
    const categoryHeaders = document.querySelectorAll('.category-header');
    
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.dataset.toggle;
            const content = document.getElementById(targetId);
            
            if (content) {
                content.classList.toggle('collapsed');
                header.classList.toggle('expanded');
            }
        });
    });
}

// ===== FAQ ACCORDION =====
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('active');
                }
            });
            
            item.classList.toggle('active');
        });
    });
}

// ===== UPDATE NISAB PRICES =====
function updateNisabPrices() {
    const goldNisabPrice = GOLD_NISAB_GRAMS * goldPricePerGram;
    const silverNisabPrice = SILVER_NISAB_GRAMS * silverPricePerGram;
    
    document.getElementById('goldNisabPrice').textContent = formatCurrency(goldNisabPrice);
    document.getElementById('silverNisabPrice').textContent = formatCurrency(silverNisabPrice);
}

// ===== CALCULATOR INITIALIZATION =====
function initCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Calculate button
    calculateBtn.addEventListener('click', calculateZakat);
    
    // Reset button
    resetBtn.addEventListener('click', resetCalculator);
    
    // Real-time precious metals calculation
    const goldWeight = document.getElementById('goldWeight');
    const goldPrice = document.getElementById('goldPricePerGram');
    const silverWeight = document.getElementById('silverWeight');
    const silverPrice = document.getElementById('silverPricePerGram');
    
    [goldWeight, goldPrice, silverWeight, silverPrice].forEach(input => {
        input.addEventListener('input', updatePreciousMetalValue);
    });
    
    // Input validation - only allow numbers
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (!/[\d.]/.test(e.key) && e.key !== 'Backspace') {
                e.preventDefault();
            }
        });
    });
}

// ===== UPDATE PRECIOUS METAL VALUE =====
function updatePreciousMetalValue() {
    const goldWeight = parseFloat(document.getElementById('goldWeight').value) || 0;
    const goldPrice = parseFloat(document.getElementById('goldPricePerGram').value) || 0;
    const silverWeight = parseFloat(document.getElementById('silverWeight').value) || 0;
    const silverPrice = parseFloat(document.getElementById('silverPricePerGram').value) || 0;
    
    const totalValue = (goldWeight * goldPrice) + (silverWeight * silverPrice);
    
    document.querySelector('#preciousMetalValue strong').textContent = formatCurrency(totalValue);
}

// ===== CALCULATE ZAKAT =====
function calculateZakat() {
    // Get all asset values
    const assets = getAssetValues();
    
    // Get liabilities
    const liabilities = getLiabilities();
    
    // Calculate totals
    const totalAssets = calculateTotalAssets(assets);
    const totalLiabilities = liabilities.debtsOwed + liabilities.billsPayable;
    const netWealth = totalAssets - totalLiabilities;
    
    // Get selected Nisab
    const nisabType = document.querySelector('input[name="nisabType"]:checked').value;
    const nisabThreshold = nisabType === 'gold' 
        ? GOLD_NISAB_GRAMS * (parseFloat(document.getElementById('goldPricePerGram').value) || goldPricePerGram)
        : SILVER_NISAB_GRAMS * (parseFloat(document.getElementById('silverPricePerGram').value) || silverPricePerGram);
    
    // Calculate Zakat
    let zakatAmount = 0;
    let zakatDue = netWealth >= nisabThreshold;
    
    // Update prices based on input
    const inputGoldPrice = parseFloat(document.getElementById('goldPricePerGram').value);
    const inputSilverPrice = parseFloat(document.getElementById('silverPricePerGram').value);
    if (inputGoldPrice) goldPricePerGram = inputGoldPrice;
    if (inputSilverPrice) silverPricePerGram = inputSilverPrice;
    
    // Calculate Zakat breakdown by category
    const breakdown = calculateBreakdown(assets);
    
    if (zakatDue) {
        zakatAmount = breakdown.totalZakat;
    }
    
    // Update UI
    updateResults({
        totalAssets,
        totalLiabilities,
        netWealth,
        nisabThreshold,
        zakatDue,
        zakatAmount,
        breakdown
    });
    
    // Scroll to results
    document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== GET ASSET VALUES =====
function getAssetValues() {
    return {
        cashSavings: {
            cashHand: parseFloat(document.getElementById('cashHand').value) || 0,
            bankSavings: parseFloat(document.getElementById('bankSavings').value) || 0,
            fixedDeposits: parseFloat(document.getElementById('fixedDeposits').value) || 0,
            otherCash: parseFloat(document.getElementById('otherCash').value) || 0
        },
        goldSilver: {
            goldWeight: parseFloat(document.getElementById('goldWeight').value) || 0,
            goldPrice: parseFloat(document.getElementById('goldPricePerGram').value) || goldPricePerGram,
            silverWeight: parseFloat(document.getElementById('silverWeight').value) || 0,
            silverPrice: parseFloat(document.getElementById('silverPricePerGram').value) || silverPricePerGram
        },
        investments: {
            sharesStocks: parseFloat(document.getElementById('sharesStocks').value) || 0,
            mutualFunds: parseFloat(document.getElementById('mutualFunds').value) || 0,
            businessCapital: parseFloat(document.getElementById('businessCapital').value) || 0,
            receivables: parseFloat(document.getElementById('receivables').value) || 0
        },
        property: {
            investmentProperty: parseFloat(document.getElementById('investmentProperty').value) || 0,
            landForSale: parseFloat(document.getElementById('landForSale').value) || 0,
            rentalIncome: parseFloat(document.getElementById('rentalIncome').value) || 0
        },
        agriculture: {
            cropType: parseFloat(document.getElementById('cropType').value) || 0.10,
            cropValue: parseFloat(document.getElementById('cropValue').value) || 0
        },
        livestock: {
            camels: parseInt(document.getElementById('camels').value) || 0,
            cattle: parseInt(document.getElementById('cattle').value) || 0,
            sheepGoats: parseInt(document.getElementById('sheepGoats').value) || 0
        }
    };
}

// ===== GET LIABILITIES =====
function getLiabilities() {
    return {
        debtsOwed: parseFloat(document.getElementById('debtsOwed').value) || 0,
        billsPayable: parseFloat(document.getElementById('billsPayable').value) || 0
    };
}

// ===== CALCULATE TOTAL ASSETS =====
function calculateTotalAssets(assets) {
    let total = 0;
    
    // Cash & Savings
    total += assets.cashSavings.cashHand;
    total += assets.cashSavings.bankSavings;
    total += assets.cashSavings.fixedDeposits;
    total += assets.cashSavings.otherCash;
    
    // Gold & Silver
    total += assets.goldSilver.goldWeight * assets.goldSilver.goldPrice;
    total += assets.goldSilver.silverWeight * assets.goldSilver.silverPrice;
    
    // Investments
    total += assets.investments.sharesStocks;
    total += assets.investments.mutualFunds;
    total += assets.investments.businessCapital;
    total += assets.investments.receivables;
    
    // Property
    total += assets.property.investmentProperty;
    total += assets.property.landForSale;
    total += assets.property.rentalIncome;
    
    // Agriculture
    total += assets.agriculture.cropValue;
    
    // Livestock (converted to approximate value)
    // Using approximate market values for calculation
    total += assets.livestock.camels * 5000; // Approx $5000 per camel
    total += assets.livestock.cattle * 1500; // Approx $1500 per cattle
    total += assets.livestock.sheepGoats * 200; // Approx $200 per sheep/goat
    
    return total;
}

// ===== CALCULATE BREAKDOWN =====
function calculateBreakdown(assets) {
    const breakdown = [];
    let totalZakat = 0;
    
    // Cash & Savings (2.5%)
    const cashTotal = assets.cashSavings.cashHand + 
                      assets.cashSavings.bankSavings + 
                      assets.cashSavings.fixedDeposits + 
                      assets.cashSavings.otherCash;
    if (cashTotal > 0) {
        const zakat = cashTotal * 0.025;
        breakdown.push({ name: 'Cash & Savings', amount: cashTotal, zakat });
        totalZakat += zakat;
    }
    
    // Gold & Silver (2.5%)
    const goldSilverTotal = (assets.goldSilver.goldWeight * assets.goldSilver.goldPrice) + 
                           (assets.goldSilver.silverWeight * assets.goldSilver.silverPrice);
    if (goldSilverTotal > 0) {
        const zakat = goldSilverTotal * 0.025;
        breakdown.push({ name: 'Gold & Silver', amount: goldSilverTotal, zakat });
        totalZakat += zakat;
    }
    
    // Investments (2.5%)
    const investmentsTotal = assets.investments.sharesStocks + 
                             assets.investments.mutualFunds + 
                             assets.investments.businessCapital + 
                             assets.investments.receivables;
    if (investmentsTotal > 0) {
        const zakat = investmentsTotal * 0.025;
        breakdown.push({ name: 'Investments', amount: investmentsTotal, zakat });
        totalZakat += zakat;
    }
    
    // Property (2.5%)
    const propertyTotal = assets.property.investmentProperty + 
                          assets.property.landForSale + 
                          assets.property.rentalIncome;
    if (propertyTotal > 0) {
        const zakat = propertyTotal * 0.025;
        breakdown.push({ name: 'Property', amount: propertyTotal, zakat });
        totalZakat += zakat;
    }
    
    // Agriculture (variable rate)
    if (assets.agriculture.cropValue > 0) {
        const zakat = assets.agriculture.cropValue * assets.agriculture.cropType;
        const ratePercent = (assets.agriculture.cropType * 100).toFixed(0);
        breakdown.push({ name: `Agriculture (${ratePercent}%)`, amount: assets.agriculture.cropValue, zakat });
        totalZakat += zakat;
    }
    
    // Livestock
    const livestockZakat = calculateLivestockZakat(assets.livestock);
    if (livestockZakat.value > 0) {
        breakdown.push({ name: 'Livestock', amount: livestockZakat.value, zakat: livestockZakat.zakat });
        totalZakat += livestockZakat.zakat;
    }
    
    return { breakdown, totalZakat };
}

// ===== CALCULATE LIVESTOCK ZAKAT =====
function calculateLivestockZakat(livestock) {
    let value = 0;
    let zakat = 0;
    
    // Camels
    if (livestock.camels >= 5) {
        value = livestock.camels * 5000;
        // Simplified calculation: 1 sheep value per 5 camels for minimum
        if (livestock.camels >= 5 && livestock.camels <= 9) zakat += 200; // 1 sheep
        else if (livestock.camels >= 10 && livestock.camels <= 14) zakat += 400; // 2 sheep
        else if (livestock.camels >= 15 && livestock.camels <= 19) zakat += 600; // 3 sheep
        else if (livestock.camels >= 20 && livestock.camels <= 24) zakat += 800; // 4 sheep
        else if (livestock.camels >= 25) zakat += livestock.camels * 200; // Simplified
    }
    
    // Cattle
    if (livestock.cattle >= 30) {
        value = livestock.cattle * 1500;
        if (livestock.cattle >= 30 && livestock.cattle <= 39) zakat += 300; // 1 year calf
        else if (livestock.cattle >= 40 && livestock.cattle <= 59) zakat += 500; // 2 year calf
        else if (livestock.cattle >= 60) zakat += livestock.cattle * 10; // Simplified per head
    }
    
    // Sheep & Goats
    if (livestock.sheepGoats >= 40) {
        value = livestock.sheepGoats * 200;
        if (livestock.sheepGoats >= 40 && livestock.sheepGoats <= 120) zakat += 200; // 1 sheep
        else if (livestock.sheepGoats >= 121 && livestock.sheepGoats <= 200) zakat += 400; // 2 sheep
        else if (livestock.sheepGoats >= 201 && livestock.sheepGoats <= 399) zakat += 600; // 3 sheep
        else if (livestock.sheepGoats >= 400) zakat += Math.floor(livestock.sheepGoats / 100) * 200;
    }
    
    return { value, zakat };
}

// ===== UPDATE RESULTS =====
function updateResults(data) {
    // Update summary
    document.getElementById('totalAssets').textContent = formatCurrency(data.totalAssets);
    document.getElementById('totalLiabilities').textContent = '-' + formatCurrency(data.totalLiabilities);
    document.getElementById('netWealth').textContent = formatCurrency(data.netWealth);
    document.getElementById('nisabThreshold').textContent = formatCurrency(data.nisabThreshold);
    
    // Update Zakat status
    const statusEl = document.getElementById('zakatStatus');
    const statusIcon = statusEl.querySelector('.status-icon i');
    const statusTitle = statusEl.querySelector('h4');
    const statusText = statusEl.querySelector('p');
    
    if (data.zakatDue) {
        statusEl.classList.remove('not-due');
        statusIcon.className = 'fas fa-check-circle';
        statusTitle.textContent = 'Zakat is Due';
        statusText.textContent = 'Your wealth exceeds the Nisab threshold';
    } else {
        statusEl.classList.add('not-due');
        statusIcon.className = 'fas fa-times-circle';
        statusTitle.textContent = 'Zakat is Not Due';
        statusText.textContent = 'Your wealth is below the Nisab threshold';
    }
    
    // Update Zakat amount
    document.getElementById('zakatAmount').textContent = formatCurrency(data.zakatAmount);
    
    // Update breakdown
    const breakdownList = document.getElementById('breakdownList');
    breakdownList.innerHTML = '';
    
    if (data.breakdown.breakdown.length > 0) {
        data.breakdown.breakdown.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'breakdown-item';
            itemEl.innerHTML = `
                <div class="name">
                    <i class="fas fa-circle"></i>
                    <span>${item.name}</span>
                </div>
                <div class="amount">${formatCurrency(item.zakat)}</div>
            `;
            breakdownList.appendChild(itemEl);
        });
    } else {
        breakdownList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No assets entered</p>';
    }
    
    // Animate results panel
    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.style.animation = 'none';
    resultsPanel.offsetHeight; // Trigger reflow
    resultsPanel.style.animation = 'fadeInUp 0.5s ease forwards';
}

// ===== RESET CALCULATOR =====
function resetCalculator() {
    document.getElementById('zakatForm').reset();
    
    // Reset to default values
    document.getElementById('goldPricePerGram').value = goldPricePerGram;
    document.getElementById('silverPricePerGram').value = silverPricePerGram;
    
    // Reset results
    updateResults({
        totalAssets: 0,
        totalLiabilities: 0,
        netWealth: 0,
        nisabThreshold: SILVER_NISAB_GRAMS * silverPricePerGram,
        zakatDue: false,
        zakatAmount: 0,
        breakdown: { breakdown: [], totalZakat: 0 }
    });
    
    // Reset precious metals display
    document.querySelector('#preciousMetalValue strong').textContent = '$0.00';
    
    // Expand first category
    document.querySelector('.category-header').click();
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    // Tab navigation for category headers
    if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement.classList.contains('category-header')) {
            e.preventDefault();
            document.activeElement.click();
        }
    }
});

// Add tabindex to category headers
document.querySelectorAll('.category-header').forEach(header => {
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe sections for animation
document.querySelectorAll('.nisab-card, .recipient-card, .exemption-card, .faq-item').forEach(el => {
    observer.observe(el);
});

// ===== CSS ANIMATION KEYFRAMES =====
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
`;
document.head.appendChild(style);

// ===== EXPOSE FUNCTIONS GLOBALLY =====
window.calculateZakat = calculateZakat;
window.resetCalculator = resetCalculator;