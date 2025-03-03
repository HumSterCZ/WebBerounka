class Navigation extends HTMLElement {
    connectedCallback() {
        const currentPath = window.location.pathname;
        this.innerHTML = `
            <nav>
                <ul>
                    <li><a href="/o-nas.html" class="${currentPath === '/o-nas.html' ? 'active' : ''}">O nás</a></li>
                    <li><a href="/prvni-voda.html" class="${currentPath === '/prvni-voda.html' ? 'active' : ''}">Jedu na vodu poprvé</a></li>
                    <li><a href="/akce.html" class="${currentPath === '/akce.html' ? 'active' : ''}">Akce</a></li>
                    <li><a href="/trasy.html" class="${currentPath === '/trasy.html' ? 'active' : ''}">Trasy</a></li>
                    <li><a href="/ceny.html" class="${currentPath === '/ceny.html' ? 'active' : ''}">Ceny</a></li>
                    <li><a href="/pro-skoly.html" class="${currentPath === '/pro-skoly.html' ? 'active' : ''}">Pro školy</a></li>
                    <li><a href="/objednavky.html" class="${currentPath === '/objednavky.html' ? 'active' : ''}">Objednávky</a></li>
                </ul>
            </nav>
        `;
    }
}

customElements.define('site-navigation', Navigation);
