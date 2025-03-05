export function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

export function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}

export function displayUsername() {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const usernameElement = document.getElementById('adminUsername');
            if (usernameElement) {
                usernameElement.textContent = payload.username || 'Administrátor';
            }
        }
    } catch (error) {
        console.error('Error loading username:', error);
    }
}

export const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
});
