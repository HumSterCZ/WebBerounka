class Navigation extends HTMLElement {
    connectedCallback() {
        const currentPath = window.location.pathname;
        this.innerHTML = `
            <nav>
                <button class="mobile-menu-toggle" aria-label="Menu">
                    <span class="burger-icon">&#9776;</span>
                </button>
                <div class="nav-container">
                    <ul class="nav-menu">
                        <li><a href="/o-nas.html" class="${currentPath === '/o-nas.html' ? 'active' : ''}">O nás</a></li>
                        <li><a href="/prvni-voda.html" class="${currentPath === '/prvni-voda.html' ? 'active' : ''}">Jedu na vodu poprvé</a></li>
                        <li><a href="/akce.html" class="${currentPath === '/akce.html' ? 'active' : ''}">Akce</a></li>
                        <li><a href="/trasy.html" class="${currentPath === '/trasy.html' ? 'active' : ''}">Trasy</a></li>
                        <li><a href="/ceny.html" class="${currentPath === '/ceny.html' ? 'active' : ''}">Ceny</a></li>
                        <li><a href="/pro-skoly.html" class="${currentPath === '/pro-skoly.html' ? 'active' : ''}">Pro školy</a></li>
                        <li><a href="/objednavky.html" class="${currentPath === '/objednavky.html' ? 'active' : ''}">Objednávky</a></li>
                    </ul>
                    <button class="mobile-menu-close" aria-label="Close menu">&times;</button>
                </div>
            </nav>
        `;
        
        // Add event listeners for mobile menu
        this.setupMobileMenu();
    }
    
    setupMobileMenu() {
        const menuToggle = this.querySelector('.mobile-menu-toggle');
        const menuClose = this.querySelector('.mobile-menu-close');
        const navContainer = this.querySelector('.nav-container');
        
        // Toggle menu on hamburger button click
        menuToggle.addEventListener('click', () => {
            navContainer.classList.toggle('show-mobile-menu');
        });
        
        // Close menu with the close button
        menuClose.addEventListener('click', () => {
            navContainer.classList.remove('show-mobile-menu');
        });
        
        // Close menu when clicking on a link
        this.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navContainer.classList.remove('show-mobile-menu');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target) && navContainer.classList.contains('show-mobile-menu')) {
                navContainer.classList.remove('show-mobile-menu');
            }
        });
    }
}

customElements.define('site-navigation', Navigation);
