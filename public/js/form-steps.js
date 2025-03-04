const formSteps = [
    {
        id: 'step1',
        title: 'Kontaktní údaje',
        template: `
            <form id="step1" class="step active">
                <h2>Vyplňte informace</h2>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="name">Jméno:</label>
                        <input type="text" name="name" required />
                    </div>
                    <div class="form-group">
                        <label for="email">E-mail:</label>
                        <input type="email" name="email" required />
                    </div>
                    <div class="form-group">
                        <label for="phone">Telefon:</label>
                        <input type="tel" name="phone" required />
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="next-btn">Další</button>
                </div>
            </form>
        `
    },
    {
        id: 'step2',
        title: 'Vybavení',
        template: `
            <form id="step2" class="step">
                <h2>Vybavení</h2>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="kanoe">Kanoe:</label>
                        <input type="number" name="kanoe" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="kanoe_rodinna">Kanoe rodinná:</label>
                        <input type="number" name="kanoe_rodinna" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="velky_raft">Velký raft (6 osob):</label>
                        <input type="number" name="velky_raft" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="padlo">Pádlo:</label>
                        <input type="number" name="padlo" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="padlo_detske">Pádlo dětské:</label>
                        <input type="number" name="padlo_detske" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="vesta">Vesta:</label>
                        <input type="number" name="vesta" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="vesta_detska">Vesta dětská:</label>
                        <input type="number" name="vesta_detska" min="0" value="0" />
                    </div>
                    <div class="form-group">
                        <label for="barel">Barel:</label>
                        <input type="number" name="barel" min="0" value="0" />
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="prev-btn">Předchozí</button>
                    <button type="button" class="next-btn">Další</button>
                </div>
            </form>
        `
    },
    {
        id: 'step3',
        title: 'Datum a místo',
        template: `
            <form id="step3" class="step">
                <h2>Datum a místo</h2>
                <div class="form-grid">
                    <div class="date-section">
                        <h3>Převzetí materiálu</h3>
                        <div class="form-group">
                            <label for="arrival_date">Datum příjezdu:</label>
                            <input type="date" name="arrival_date" required />
                        </div>
                        <div class="form-group">
                            <label for="arrival_time">Čas příjezdu:</label>
                            <input type="time" name="arrival_time" required />
                        </div>
                        <div class="form-group">
                            <label for="pickup_location">Místo převzetí:</label>
                            <select id="pickup_location" name="pickup_location" required>
                                <option value="">Vyberte místo</option>
                                ${Object.entries(LOCATIONS).map(([value, text]) => 
                                    `<option value="${value}">${text}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="date-section">
                        <h3>Vrácení materiálu</h3>
                        <div class="form-group">
                            <label for="departure_date">Datum odjezdu:</label>
                            <input type="date" name="departure_date" required />
                        </div>
                        <div class="form-group">
                            <label for="departure_time">Čas odjezdu:</label>
                            <input type="time" name="departure_time" required />
                        </div>
                        <div class="form-group">
                            <label for="return_location">Místo vrácení:</label>
                            <select id="return_location" name="return_location" required>
                                <option value="">Vyberte místo</option>
                                ${Object.entries(LOCATIONS).map(([value, text]) => 
                                    `<option value="${value}">${text}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="prev-btn">Předchozí</button>
                    <button type="button" class="next-btn">Další</button>
                </div>
            </form>
        `
    },
    {
        id: 'step4',
        title: 'Přeprava',
        template: `
            <form id="step4" class="step">
                <h2>Přeprava věcí a lidí</h2>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="transport_items">Přeprava věcí:</label>
                        <select name="transport_items" required>
                            <option value="Nezvoleno">Vyberte možnost</option>
                            <option value="Ano">Ano</option>
                            <option value="Ne">Ne</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transport_people">Přeprava lidí:</label>
                        <select name="transport_people" required>
                            <option value="Nezvoleno">Vyberte možnost</option>
                            <option value="Žádná">Žádná</option>
                            <option value="Microbus">Mikrobus</option>
                            <option value="Autobus">Autobus</option>
                        </select>
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="prev-btn">Předchozí</button>
                    <button type="button" class="next-btn">Další</button>
                </div>
            </form>
        `
    },
    {
        id: 'step5',
        title: 'Poznámka',
        template: `
            <form id="step5" class="step">
                <h2>Poznámka k objednávce</h2>
                <div class="form-group">
                    <label for="order_note">Poznámka:</label>
                    <textarea name="order_note" rows="4" class="form-textarea"></textarea>
                </div>
                <div class="button-group">
                    <button type="button" class="prev-btn">Předchozí</button>
                    <button type="button" class="next-btn">Další</button>
                </div>
            </form>
        `
    },
    {
        id: 'step6',
        title: 'Potvrzení',
        template: `
            <form id="step6" class="step">
                <h2>Potvrzení objednávky</h2>
                <div class="order-summary">
                    <div id="summary-content"></div>
                </div>
                <div class="button-group">
                    <button type="button" class="prev-btn">Předchozí</button>
                    <button type="submit" class="submit-btn">Odeslat objednávku</button>
                </div>
            </form>
        `
    }
];

// Přidáme funkce pro notifikace před DOMContentLoaded
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    const id = 'toast-' + Date.now();
    
    toast.className = `toast ${type}`;
    toast.id = id;
    
    const icon = type === 'success' ? '✅' : '❌';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="closeToast('${id}')">&times;</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => closeToast(id), 5000);
}

function closeToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }
}

// Přidáme inicializační kód po definici formSteps
document.addEventListener('DOMContentLoaded', () => {
    // Načtení kroků do DOM
    document.getElementById('orderFormSteps').innerHTML = formSteps.map(step => step.template).join('');

    // Inicializace ovládání formuláře
    let currentStep = 0;
    const steps = document.querySelectorAll('.step');
    const progressItems = document.querySelectorAll('.progressbar li');

    // Funkce pro zobrazení aktuálního kroku
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.style.display = index === stepIndex ? 'block' : 'none';
            if (progressItems[index]) {
                progressItems[index].classList.toggle('active', index <= stepIndex);
            }
        });
    }

    // Přidání event listenerů pro tlačítka
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(`step${currentStep + 1}`)) {
                currentStep++;
                showStep(currentStep);
                if (currentStep === steps.length - 1) {
                    generateSummary();
                }
            }
        });
    });

    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    });

    // Upravený event listener pro odeslání formuláře
    document.getElementById('step6').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {};
        document.querySelectorAll('.step input, .step select, .step textarea').forEach(input => {
            if (input.name) {
                if (input.type === 'number') {
                    formData[input.name] = parseInt(input.value) || 0;
                } else {
                    formData[input.name] = input.value;
                }
            }
        });

        try {
            const submitButton = e.target.querySelector('.submit-btn');
            submitButton.disabled = true; // Zakážeme opakované kliknutí
            
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Objednávka byla úspěšně odeslána!', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                throw new Error(result.message || 'Chyba při odesílání objednávky');
            }
        } catch (error) {
            const submitButton = e.target.querySelector('.submit-btn');
            submitButton.disabled = false; // Povolíme tlačítko při chybě
            showToast(error.message || 'Došlo k chybě při odesílání objednávky', 'error');
            console.error('Chyba:', error);
        }
    });

    // Inicializace prvního kroku
    showStep(currentStep);
});

// Přidání funkce pro generování souhrnu
function generateSummary() {
    const summaryData = {};
    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.name && input.value) {
            summaryData[input.name] = input.value;
        }
    });

    const summaryHTML = Object.entries(summaryData)
        .map(([key, value]) => `
            <div class="summary-row">
                <strong>${formatLabel(key)}:</strong>
                <span>${value}</span>
            </div>
        `).join('');

    document.getElementById('summary-content').innerHTML = summaryHTML;
}

function formatLabel(key) {
    return key
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Přidání validace formuláře
function validateStep(stepId) {
    const form = document.getElementById(stepId);
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

class FormSteps {
    constructor() {
        this.initLocationSelectors();
    }

    // Přidáme novou metodu pro inicializaci selectorů
    initLocationSelectors() {
        const pickupSelect = document.getElementById('pickup_location');
        const returnSelect = document.getElementById('return_location');
        
        if (pickupSelect && returnSelect) {
            // Vytvoříme options z LOCATIONS objektu
            const options = Object.entries(LOCATIONS).map(([value, text]) => 
                `<option value="${value}">${text}</option>`
            ).join('');

            // Nastavíme options do obou selectů
            pickupSelect.innerHTML = options;
            returnSelect.innerHTML = options;
        }
    }
}

// Přidáme funkce pro notifikace
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    const id = 'toast-' + Date.now();
    
    toast.className = `toast ${type}`;
    toast.id = id;
    
    const icon = type === 'success' ? '✅' : '❌';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="closeToast('${id}')">&times;</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => closeToast(id), 5000);
}

function closeToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }
}

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}
