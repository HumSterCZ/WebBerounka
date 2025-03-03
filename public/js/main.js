// Pomocné funkce
const showMessage = (message, type = 'success') => {
    const messageDiv = document.getElementById('result');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
};

// Načtení uživatelů
async function loadUsers() {
    try {
        const response = await fetch('/users');
        const users = await response.json();
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        if (document.querySelector('table')) {
            // Admin view
            usersList.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                </tr>
            `).join('');
        } else {
            // User view
            usersList.innerHTML = users.map(user => 
                `<div>Jméno: ${user.name}, Email: ${user.email}</div>`
            ).join('');
        }
    } catch (error) {
        showMessage('Chyba při načítání uživatelů', 'error');
    }
}

// Inicializace formuláře
const initForm = () => {
    const form = document.getElementById('userForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email')
                })
            });
            const result = await response.text();
            showMessage(result);
            loadUsers();
            form.reset();
        } catch (error) {
            showMessage('Chyba: ' + error, 'error');
        }
    });
};

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    initForm();
    loadUsers();

    // Přidání aktivní třídy pro aktuální stránku
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
