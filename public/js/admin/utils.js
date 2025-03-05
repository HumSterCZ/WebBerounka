export const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
});

export function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
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

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('cs-CZ');
}

export function formatTime(timeString) {
    return timeString ? timeString.substring(0, 5) : '';
}

export function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    const id = 'toast-' + Date.now();
    
    toast.className = `toast ${type}`;
    toast.id = id;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="closeToast('${id}')">&times;</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => closeToast(id), 5000);
}

export function showError(message) {
    showToast(message, 'error');
}

export function showMessage(message) {
    showToast(message, 'success');
}

export function closeToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }
}

export function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}
