class Footer extends HTMLElement {
    connectedCallback() {
        const year = new Date().getFullYear();
        this.innerHTML = `
            <footer>
                <div class="footer-content">
                    <div class="footer-contact">
                        <h3>Kontakt</h3>
                        <p>Tel: +420 123 456 789</p>
                        <p>Email: info@berounka.cz</p>
                    </div>
                    <div class="footer-social">
                        <h3>Sledujte nás</h3>
                        <a href="https://facebook.com/berounka" target="_blank">Facebook</a>
                        <a href="https://instagram.com/berounka" target="_blank">Instagram</a>
                    </div>
                    <div class="footer-address">
                        <h3>Adresa</h3>
                        <p>Berounka.cz</p>
                        <p>Vodácká 123</p>
                        <p>266 01 Beroun</p>
                    </div>
                </div>
                <p class="copyright">&copy; ${year} Berounka.cz - Všechna práva vyhrazena</p>
            </footer>
        `;
    }
}

customElements.define('site-footer', Footer);
