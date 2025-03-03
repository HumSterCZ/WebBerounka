class OrderForm {
    constructor() {
        this.currentStep = 0;
        this.formData = {};
        this.steps = document.querySelectorAll('.step');
        this.progressItems = document.querySelectorAll('.progressbar li');
        
        this.initEventListeners();
        this.showStep(this.currentStep);
    }

    showStep(stepIndex) {
        this.steps.forEach((step, index) => {
            step.style.display = index === stepIndex ? 'block' : 'none';
            if (this.progressItems[index]) {
                this.progressItems[index].classList.toggle('active', index <= stepIndex);
            }
        });
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.currentStep++;
            if (this.currentStep >= this.steps.length) {
                this.currentStep = this.steps.length - 1;
            }
            this.showStep(this.currentStep);

            // Pokud jsme na posledním kroku, vygenerujeme souhrn
            if (this.currentStep === this.steps.length - 1) {
                this.generateSummary();
            }
        }
    }

    prevStep() {
        this.currentStep--;
        if (this.currentStep < 0) {
            this.currentStep = 0;
        }
        this.showStep(this.currentStep);
    }

    validateCurrentStep() {
        const currentForm = this.steps[this.currentStep];
        const requiredInputs = currentForm.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        return isValid;
    }

    generateSummary() {
        const summaryContent = document.getElementById('summary-content');
        let summaryHTML = '';

        // Procházíme všechny formulářové prvky a vytváříme souhrn
        this.steps.forEach(step => {
            const inputs = step.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name && input.value) {
                    summaryHTML += `
                        <div class="summary-row">
                            <strong>${this.formatLabel(input.name)}:</strong>
                            <span>${input.value}</span>
                        </div>
                    `;
                }
            });
        });

        summaryContent.innerHTML = summaryHTML;
    }

    formatLabel(key) {
        return key
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async submitForm() {
        const formData = {};
        this.steps.forEach(step => {
            const inputs = step.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    // Konverze hodnot na správné datové typy
                    if (input.type === 'number') {
                        formData[input.name] = input.value ? parseInt(input.value) : 0;
                    } else if (input.type === 'date') {
                        formData[input.name] = input.value || null;
                    } else if (input.type === 'time') {
                        formData[input.name] = input.value || null;
                    } else {
                        formData[input.name] = input.value || '';
                    }
                }
            });
        });

        console.log('Odesílaná data:', formData); // Pro debugging

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('Odpověď serveru:', result); // Pro debugging
            
            if (!response.ok) {
                throw new Error(result.message || 'HTTP error! status: ' + response.status);
            }
            
            if (result.success) {
                alert('Objednávka byla úspěšně odeslána!');
                window.location.href = '/domu.html';
            } else {
                throw new Error(result.message || 'Chyba při odesílání objednávky');
            }
        } catch (error) {
            console.error('Detaily chyby:', error); // Pro debugging
            alert('Došlo k chybě při odesílání objednávky: ' + error.message);
        }
    }

    initEventListeners() {
        // Tlačítka Další
        document.querySelectorAll('.next-btn').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });

        // Tlačítka Předchozí
        document.querySelectorAll('.prev-btn').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });

        // Oprava odeslání formuláře
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'step6') {
                e.preventDefault();
                this.submitForm();
            }
        });

        // Sledování změn v inputech
        this.steps.forEach(step => {
            step.addEventListener('input', (e) => {
                if (e.target.classList.contains('error')) {
                    this.validateCurrentStep();
                }
            });
        });
    }
}

// Vytvoření instance formuláře po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    new OrderForm();
});
