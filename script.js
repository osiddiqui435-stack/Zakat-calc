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

// ===== CURRENCY CONFIGURATION =====
// Exchange rates relative to 1 USD (Approximate values - update periodically)
const exchangeRates = {
    'USD': { symbol: '$', rate: 1 },
    'INR': { symbol: '₹', rate: 83.12 },
    'KWD': { symbol: 'KD', rate: 0.31 },      // Kuwaiti Dinar
    'GBP': { symbol: '£', rate: 0.79 },
    'EUR': { symbol: '€', rate: 0.92 },
    'PKR': { symbol: '₨', rate: 278.50 },
    'SAR': { symbol: '﷼', rate: 3.75 },
    'AED': { symbol: 'د.إ', rate: 3.67 }
};

// Default base prices in USD (You can update these to current market rates)
const baseGoldPriceUSD = 65; // Price per gram in USD
const baseSilverPriceUSD = 0.80; // Price per gram in USD

let currentCurrency = 'USD';

// Function to change currency
function changeCurrency(currencyCode) {
    currentCurrency = currencyCode;
    const currencyData = exchangeRates[currencyCode];
    
    // 1. Update all Currency Symbols in the UI
    document.querySelectorAll('.currency').forEach(el => {
        el.textContent = currencyData.symbol;
    });

    // 2. Update Input Placeholder Prices (Convert from USD base)
    const localGoldPrice = (baseGoldPriceUSD * currencyData.rate).toFixed(2);
    const localSilverPrice = (baseSilverPriceUSD * currencyData.rate).toFixed(2);

    const goldInput = document.getElementById('goldPricePerGram');
    const silverInput = document.getElementById('silverPricePerGram');

    // Only update if the user hasn't manually changed them yet (optional logic)
    // For now, we force update to give the user the local estimate:
    goldInput.value = localGoldPrice;
    silverInput.value = localSilverPrice;

    // 3. Trigger calculation updates
    updateNisabPrices();
    updatePreciousMetalValue();
    
    // Recalculate if values exist
    if (document.getElementById('cashHand').value) {
        runFullCalculation(); 
    }
}

// Helper to format currency based on selection
function formatCurrency(amount) {
    const data = exchangeRates[currentCurrency];
    // Use Intl.NumberFormat for proper comma separation
    return data.symbol + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function initializeApp() {
    // Initialize all components
    initNavigation();
    initCategoryToggles();
    initFaqAccordion();
    initCalculator();
    
    // Setup Currency Listener
    const currencySelector = document.getElementById('currencySelector');
    currencySelector.addEventListener('change', (e) => {
        changeCurrency(e.target.value);
    });

    // Initialize with default currency (USD)
    updateNisabPrices();
    
    // Set default gold/silver prices in form
    document.getElementById('goldPricePerGram').value = baseGoldPriceUSD;
    document.getElementById('silverPricePerGram').value = baseSilverPriceUSD;
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
    const currencyData = exchangeRates[currentCurrency];
    
    // Get user input prices or use default converted prices
    const currentGoldPrice = parseFloat(document.getElementById('goldPricePerGram').value) || (baseGoldPriceUSD * currencyData.rate);
    const currentSilverPrice = parseFloat(document.getElementById('silverPricePerGram').value) || (baseSilverPriceUSD * currencyData.rate);

    const goldNisabPrice = GOLD_NISAB_GRAMS * currentGoldPrice;
    const silverNisabPrice = SILVER_NISAB_GRAMS * currentSilverPrice;
    
    document.getElementById('goldNisabPrice').textContent = formatCurrency(goldNisabPrice);
    document.getElementById('silverNisabPrice').textContent = formatCurrency(silverNisabPrice);
}

// ======================================================
// MODULAR ZAKAT CALCULATION ENGINE
// ======================================================

const ZakatEngine = {
    // ----- 1. CASH & SAVINGS (2.5%) -----
    calculateCash: function(values) {
        const total = values.cashHand + values.bankSavings + values.fixedDeposits + values.otherCash;
        const rate = 0.025; // 2.5%
        return {
            name: "Cash & Savings",
            totalValue: total,
            rate: "2.5%",
            zakatDue: total * rate
        };
    },

    // ----- 2. GOLD & SILVER (2.5%) -----
    calculatePreciousMetals: function(values, currentPrices) {
        const goldValue = values.goldWeight * currentPrices.gold;
        const silverValue = values.silverWeight * currentPrices.silver;
        const total = goldValue + silverValue;
        const rate = 0.025; // 2.5%
        
        return {
            name: "Gold & Silver",
            totalValue: total,
            rate: "2.5%",
            breakdown: {
                goldValue: goldValue,
                silverValue: silverValue
            },
            zakatDue: total * rate
        };
    },

    // ----- 3. INVESTMENTS & BUSINESS (2.5%) -----
    calculateInvestments: function(values) {
        const total = values.sharesStocks + values.mutualFunds + values.businessCapital + values.receivables;
        const rate = 0.025; // 2.5%
        return {
            name: "Investments & Business",
            totalValue: total,
            rate: "2.5%",
            zakatDue: total * rate
        };
    },

    // ----- 4. PROPERTY (2.5% on investment property only) -----
    calculateProperty: function(values) {
        const total = values.investmentProperty + values.landForSale + values.rentalIncome;
        const rate = 0.025; // 2.5%
        return {
            name: "Investment Property",
            totalValue: total,
            rate: "2.5%",
            zakatDue: total * rate
        };
    },

    // ----- 5. AGRICULTURE (5% / 10% / 7.5%) -----
    calculateAgriculture: function(values) {
        const cropValue = values.cropValue;
        const irrigationType = values.cropType; // 0.10, 0.05, or 0.075
        
        let rateLabel = "10% (Rain-fed)";
        if (irrigationType === 0.05) rateLabel = "5% (Irrigated)";
        if (irrigationType === 0.075) rateLabel = "7.5% (Partial)";

        return {
            name: "Agricultural Produce",
            totalValue: cropValue,
            rate: rateLabel,
            zakatDue: cropValue * irrigationType
        };
    },

    // ----- 6. LIVESTOCK (Complex Rules) -----
    calculateLivestock: function(values) {
        const result = { name: "Livestock", totalValue: 0, zakatDue: 0, details: [] };
        const camelCount = values.camels;
        const cattleCount = values.cattle;
        const sheepGoatCount = values.sheepGoats;

        // Approximate value for display purposes
        const CAMEL_VAL = 5000;
        const CATTLE_VAL = 1500;
        const SHEEP_VAL = 200;

        result.totalValue = (camelCount * CAMEL_VAL) + (cattleCount * CATTLE_VAL) + (sheepGoatCount * SHEEP_VAL);

        // --- Camels Calculation ---
        if (camelCount >= 5) {
            let camelZakat = 0;
            if (camelCount >= 5 && camelCount <= 9) camelZakat = 1 * SHEEP_VAL;
            else if (camelCount >= 10 && camelCount <= 14) camelZakat = 2 * SHEEP_VAL;
            else if (camelCount >= 15 && camelCount <= 19) camelZakat = 3 * SHEEP_VAL;
            else if (camelCount >= 20 && camelCount <= 24) camelZakat = 4 * SHEEP_VAL;
            else if (camelCount >= 25 && camelCount <= 35) camelZakat = 1 * CAMEL_VAL; // 1 baby she-camel
            // Add more rules as needed...
            
            result.details.push(`Camels (${camelCount}): ~$${camelZakat}`);
            result.zakatDue += camelZakat;
        }

        // --- Cattle Calculation ---
        if (cattleCount >= 30) {
            let cattleZakat = 0;
            if (cattleCount >= 30 && cattleCount <= 39) cattleZakat = 1 * 300; // 1 calf (1yr)
            else if (cattleCount >= 40 && cattleCount <= 59) cattleZakat = 1 * 500; // 1 calf (2yr)
            else if (cattleCount >= 60 && cattleCount <= 69) cattleZakat = 2 * 300;
            // Add more rules...
            
            result.details.push(`Cattle (${cattleCount}): ~$${cattleZakat}`);
            result.zakatDue += cattleZakat;
        }

        // --- Sheep/Goats Calculation ---
        if (sheepGoatCount >= 40) {
            let sheepZakat = 0;
            if (sheepGoatCount >= 40 && sheepGoatCount <= 120) sheepZakat = 1 * SHEEP_VAL;
            else if (sheepGoatCount >= 121 && sheepGoatCount <= 200) sheepZakat = 2 * SHEEP_VAL;
            else if (sheepGoatCount >= 201 && sheepGoatCount <= 399) sheepZakat = 3 * SHEEP_VAL;
            else if (sheepGoatCount >= 400) sheepZakat = 4 * SHEEP_VAL;
            // Add more rules...

            result.details.push(`Sheep/Goats (${sheepGoatCount}): ~$${sheepZakat}`);
            result.zakatDue += sheepZakat;
        }

        result.rate = "Variable (Nisab dependent)";
        return result;
    }
};

// ======================================================
// MAIN CALCULATION CONTROLLER
// ======================================================

function runFullCalculation() {
    // 1. Gather Inputs
    const inputs = {
        cash: {
            cashHand: parseFloat(document.getElementById('cashHand').value) || 0,
            bankSavings: parseFloat(document.getElementById('bankSavings').value) || 0,
            fixedDeposits: parseFloat(document.getElementById('fixedDeposits').value) || 0,
            otherCash: parseFloat(document.getElementById('otherCash').value) || 0
        },
        metals: {
            goldWeight: parseFloat(document.getElementById('goldWeight').value) || 0,
            silverWeight: parseFloat(document.getElementById('silverWeight').value) || 0,
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
            cropValue: parseFloat(document.getElementById('cropValue').value) || 0,
            cropType: parseFloat(document.getElementById('cropType').value) || 0.10
        },
        livestock: {
            camels: parseInt(document.getElementById('camels').value) || 0,
            cattle: parseInt(document.getElementById('cattle').value) || 0,
            sheepGoats: parseInt(document.getElementById('sheepGoats').value) || 0
        },
        liabilities: {
            debtsOwed: parseFloat(document.getElementById('debtsOwed').value) || 0,
            billsPayable: parseFloat(document.getElementById('billsPayable').value) || 0
        },
        prices: {
            gold: parseFloat(document.getElementById('goldPricePerGram').value) || 65,
            silver: parseFloat(document.getElementById('silverPricePerGram').value) || 0.80
        }
    };

    // 2. Run Calculations for Each Category
    const results = {
        cashResult: ZakatEngine.calculateCash(inputs.cash),
        metalsResult: ZakatEngine.calculatePreciousMetals(inputs.metals, inputs.prices),
        investmentResult: ZakatEngine.calculateInvestments(inputs.investments),
        propertyResult: ZakatEngine.calculateProperty(inputs.property),
        agricultureResult: ZakatEngine.calculateAgriculture(inputs.agriculture),
        livestockResult: ZakatEngine.calculateLivestock(inputs.livestock)
    };

    // 3. Calculate Totals
    let grossAssets = 0;
    let totalZakat = 0;

    for (const key in results) {
        grossAssets += results[key].totalValue;
        totalZakat += results[key].zakatDue;
    }

    const totalLiabilities = inputs.liabilities.debtsOwed + inputs.liabilities.billsPayable;
    const netAssets = grossAssets - totalLiabilities;

    // 4. Determine Nisab
    const nisabType = document.querySelector('input[name="nisabType"]:checked').value;
    let nisabThreshold;
    if (nisabType === 'gold') {
        nisabThreshold = 87.48 * inputs.prices.gold;
    } else {
        nisabThreshold = 612.36 * inputs.prices.silver;
    }

    // 5. Final Verdict
    const zakatPayable = (netAssets >= nisabThreshold) ? totalZakat : 0;

    // 6. Update UI
    updateUI({
        grossAssets,
        totalLiabilities,
        netAssets,
        nisabThreshold,
        zakatPayable,
        detailedResults: results,
        isEligible: netAssets >= nisabThreshold
    });
}

// ======================================================
// UI UPDATE FUNCTION
// ======================================================

function updateUI(data) {
    // Update Summary
    document.getElementById('totalAssets').textContent = formatCurrency(data.grossAssets);
    document.getElementById('totalLiabilities').textContent = '-' + formatCurrency(data.totalLiabilities);
    document.getElementById('netWealth').textContent = formatCurrency(data.netAssets);
    document.getElementById('nisabThreshold').textContent = formatCurrency(data.nisabThreshold);
    
    // Update Status
    const statusEl = document.getElementById('zakatStatus');
    if (data.isEligible) {
        statusEl.innerHTML = `
            <div class="status-icon"><i class="fas fa-check-circle"></i></div>
            <h4>Zakat is Due</h4>
            <p>Your wealth exceeds the Nisab threshold</p>`;
        statusEl.classList.remove('not-due');
    } else {
        statusEl.innerHTML = `
            <div class="status-icon"><i class="fas fa-times-circle"></i></div>
            <h4>No Zakat Due</h4>
            <p>Your wealth is below the Nisab threshold</p>`;
        statusEl.classList.add('not-due');
    }

    document.getElementById('zakatAmount').textContent = formatCurrency(data.zakatPayable);

    // Update Breakdown List
    const breakdownList = document.getElementById('breakdownList');
    breakdownList.innerHTML = '';

    const allCategories = data.detailedResults;
    
    for (const key in allCategories) {
        const item = allCategories[key];
        if (item.totalValue > 0) {
            const div = document.createElement('div');
            div.className = 'breakdown-item';
            div.innerHTML = `
                <div class="name">
                    <i class="fas fa-circle"></i>
                    <span>${item.name} <small>(${item.rate})</small></span>
                </div>
                <div class="amount">${formatCurrency(item.zakatDue)}</div>
            `;
            breakdownList.appendChild(div);
        }
    }
}

// Helper function (Keep this if not already present)
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// ===== CALCULATOR INITIALIZATION =====
function initCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Calculate button
    calculateBtn.addEventListener('click', runFullCalculation);
    
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