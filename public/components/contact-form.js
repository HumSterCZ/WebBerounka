class ContactForm extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <form class="contact-form" action="/submit" method="POST">
                <div class="form-group">
                    <label for="name">Jméno a příjmení:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Telefon:</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                <div class="form-group">
                    <label for="message">Zpráva:</label>
                    <textarea id="message" name="message" rows="5"></textarea>
                </div>
                <button type="submit">Odeslat</button>
            </form>
        `;

        this.addFormHandler();
    }

    addFormHandler() {
        this.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const response = await fetch('/submit', {
                    method: 'POST',
                    body: JSON.stringify(Object.fromEntries(formData)),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    alert('Formulář byl úspěšně odeslán');
                    e.target.reset();
                } else {
                    throw new Error('Chyba při odesílání');
                }
            } catch (error) {
                alert('Omlouváme se, došlo k chybě při odesílání formuláře');
            }
        });
    }
}

customElements.define('contact-form', ContactForm);
