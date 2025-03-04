document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('authToken', data.token);
            window.location.href = '/admin.html';
        } else {
            errorElement.textContent = data.message || 'Nesprávné přihlašovací údaje';
        }
    } catch (error) {
        errorElement.textContent = 'Chyba při přihlašování';
        console.error('Login error:', error);
    }
});
