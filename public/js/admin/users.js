import { getAuthHeaders } from './auth.js';
import { showError } from './ui.js';

export async function initUsers() {
    await loadUsers();
}

export async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Chyba při načítání uživatelů');
        }

        const users = await response.json();
        const tbody = document.getElementById('usersList');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Chyba při načítání uživatelů: ' + error.message);
    }
}
