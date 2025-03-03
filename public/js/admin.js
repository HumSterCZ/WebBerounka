function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const orders = await response.json();
        console.log('Načtené objednávky:', orders); // Pro debugging
        
        if (!Array.isArray(orders)) {
            throw new Error('Neplatná data z serveru');
        }

        const tbody = document.getElementById('ordersList');
        if (!tbody) {
            throw new Error('Element ordersList nenalezen');
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id || ''}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
                <td>${order.name || ''}</td>
                <td>${order.email || ''}</td>
                <td>${order.phone || ''}</td>
                <td>${order.arrival_date || ''} ${order.arrival_time || ''}</td>
                <td>${order.departure_date || ''} ${order.departure_time || ''}</td>
                <td>${order.status || 'new'}</td>
                <td>
                    <button onclick="viewOrderDetail(${order.id})" class="btn-small">Detail</button>
                    <button onclick="updateOrderStatus(${order.id})" class="btn-small">Změnit status</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Detailní chyba při načítání objednávek:', error);
        alert('Chyba při načítání dat: ' + error.message);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/users');
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
        console.error('Chyba při načítání uživatelů:', error);
        alert('Chyba při načítání dat');
    }
}

// Načtení objednávek při startu
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
