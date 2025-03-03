class Header extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="header-content">
                <h1>
                    <a href="/domu.html" style="padding: 10px 0; display: block;">
                        <img src="/images/Berounka_logo_v3.png" alt="Berounka.cz" class="site-logo">
                    </a>
                </h1>
                <site-navigation></site-navigation>
            </div>
        `;
    }
}

customElements.define('site-header', Header);
