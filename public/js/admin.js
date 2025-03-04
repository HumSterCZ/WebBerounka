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

// Upravíme helper funkci pro API volání
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Přidáme globální proměnné pro správu dat a řazení
let ordersData = [];
let currentSort = {
    column: 'created_at',
    direction: 'desc'
};

// Upravíme funkci loadOrders
async function loadOrders() {
    try {
        const response = await fetch('/api/orders/list', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        ordersData = await response.json(); // Uložíme data do globální proměnné
        renderOrders(); // Zobrazíme data
    } catch (error) {
        showError('Chyba při načítání objednávek');
        console.error(error);
    }
}

// Funkce pro řazení dat - upravená část pro datum a čas
function sortOrders(column) {
    const th = document.querySelector(`th[onclick="sortOrders('${column}')"]`);
    document.querySelectorAll('th').forEach(header => {
        if (header !== th) {
            header.classList.remove('sorted-asc', 'sorted-desc');
        }
    });

    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    th.classList.toggle('sorted-asc', currentSort.direction === 'asc');
    th.classList.toggle('sorted-desc', currentSort.direction === 'desc');

    renderOrders();
}

// Funkce pro filtrování dat
function filterOrders() {
    renderOrders();
}

// Přidáme funkci pro formátování času
function formatTime(timeString) {
    return timeString ? timeString.substring(0, 5) : '';  // Vezme pouze HH:MM část
}

// Funkce pro vykreslení dat
function renderOrders() {
    let filteredData = [...ordersData];

    // Aplikujeme vyhledávání
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    if (searchTerm) {
        filteredData = filteredData.filter(order => 
            order.name.toLowerCase().includes(searchTerm) ||
            order.email.toLowerCase().includes(searchTerm) ||
            order.phone.toLowerCase().includes(searchTerm)
        );
    }

    // Aplikujeme filtr statusu
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter) {
        filteredData = filteredData.filter(order => order.status === statusFilter);
    }

    // Aplikujeme řazení
    filteredData.sort((a, b) => {
        let valueA = a[currentSort.column];
        let valueB = b[currentSort.column];

        // Speciální zacházení s datumem a časem
        if (column === 'arrival_date' || column === 'departure_date') {
            // Kombinujeme datum a čas pro porovnání
            const timeColumnA = column.replace('date', 'time');
            const timeColumnB = column.replace('date', 'time');
            valueA = new Date(a[column] + 'T' + a[timeColumnA]);
            valueB = new Date(b[column] + 'T' + b[timeColumnB]);
        } else if (currentSort.column.includes('date')) {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        } else if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Vykreslíme data
    const tbody = document.getElementById('ordersList');
    tbody.innerHTML = filteredData.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${order.name}</td>
            <td>${order.email}</td>
            <td>${order.phone}</td>
            <td>${formatDate(order.arrival_date)} ${formatTime(order.arrival_time)}</td>
            <td>${formatDate(order.departure_date)} ${formatTime(order.departure_time)}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <button onclick="viewOrder(${order.id})" class="btn-action btn-view">Detail</button>
                <button onclick="updateOrderStatus(${order.id})" class="btn-action btn-edit">Status</button>
                <button onclick="deleteOrder(${order.id})" class="btn-action btn-delete">Smazat</button>
            </td>
        </tr>
    `).join('');
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

async function viewOrder(orderId) {
    try {
        console.log('Fetching order:', orderId);
        
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('Raw response:', responseText); // Debug log

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Invalid JSON response from server');
        }

        if (!result.success) {
            throw new Error(result.message || 'Unknown error');
        }

        const order = result.data;
        
        const detailHtml = `
            <h2>Detail objednávky #${order.id}</h2>
            <div class="order-detail-grid">
                <div class="detail-section">
                    <h3>Kontaktní údaje</h3>
                    <p><strong>Jméno:</strong> ${order.name}</p>
                    <p><strong>Email:</strong> ${order.email}</p>
                    <p><strong>Telefon:</strong> ${order.phone}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Termín</h3>
                    <p><strong>Od:</strong> ${formatDate(order.arrival_date)} ${formatTime(order.arrival_time)}</p>
                    <p><strong>Do:</strong> ${formatDate(order.departure_date)} ${formatTime(order.departure_time)}</p>
                    <p><strong>Místo vyzvednutí:</strong> ${order.pickup_location}</p>
                    <p><strong>Místo vrácení:</strong> ${order.return_location}</p>
                </div>

                <div class="detail-section">
                    <h3>Vybavení</h3>
                    <p><strong>Kanoe:</strong> ${order.kanoe}x</p>
                    <p><strong>Rodinné kanoe:</strong> ${order.kanoe_rodinna}x</p>
                    <p><strong>Velký raft:</strong> ${order.velky_raft}x</p>
                    <p><strong>Pádla:</strong> ${order.padlo}x</p>
                    <p><strong>Dětská pádla:</strong> ${order.padlo_detske}x</p>
                    <p><strong>Vesty:</strong> ${order.vesta}x</p>
                    <p><strong>Dětské vesty:</strong> ${order.vesta_detska}x</p>
                    <p><strong>Barely:</strong> ${order.barel}x</p>
                </div>

                <div class="detail-section">
                    <h3>Doprava</h3>
                    <p><strong>Přeprava vybavení:</strong> ${order.transport_items}</p>
                    <p><strong>Přeprava osob:</strong> ${order.transport_people}</p>
                    <p><strong>Poznámka:</strong> ${order.order_note || '-'}</p>
                </div>
            </div>
        `;

        document.getElementById('orderDetail').innerHTML = detailHtml;
        document.getElementById('orderModal').style.display = "block";
    } catch (error) {
        console.error('Error details:', error);
        showError(`Chyba při načítání detailu objednávky: ${error.message}`);
    }
}

// Upravená funkce pro změnu statusu
async function updateOrderStatus(orderId) {
    try {
        const statusDialog = document.createElement('div');
        statusDialog.className = 'status-dialog';
        statusDialog.innerHTML = `
            <div class="status-modal">
                <h3>Změna stavu objednávky</h3>
                <select id="statusSelect" class="status-select">
                    <option value="Nová">Nová</option>
                    <option value="Potvrzená">Potvrzená</option>
                    <option value="Dokončená">Dokončená</option>
                    <option value="Zrušená">Zrušená</option>
                </select>
                <div class="status-buttons">
                    <button onclick="submitStatus('${orderId}')" class="btn-confirm">Uložit</button>
                    <button onclick="closeStatusDialog()" class="btn-cancel">Zrušit</button>
                </div>
            </div>
        `;
        document.body.appendChild(statusDialog);
    } catch (error) {
        showError(`Chyba při změně stavu: ${error.message}`);
        console.error('Detailní chyba:', error);
    }
}

// Upravíme funkci pro odeslání statusu
async function submitStatus(orderId) {
    const select = document.getElementById('statusSelect');
    const newStatus = select.value;

    try {
        console.log('Odesílám status:', newStatus); // Pro debugging

        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Chyba při aktualizaci statusu');
        }

        await loadOrders();
        showMessage('Status byl úspěšně aktualizován');
        closeStatusDialog();
    } catch (error) {
        showError(`Chyba při aktualizaci statusu: ${error.message}`);
        console.error('Detailní chyba:', error);
    }
}

function closeStatusDialog() {
    const dialog = document.querySelector('.status-dialog');
    if (dialog) {
        dialog.remove();
    }
}

async function deleteOrder(orderId) {
    try {
        if (!confirm('Opravdu chcete smazat tuto objednávku?')) return;

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        await loadOrders(); // Znovu načteme seznam objednávek
        showMessage('Objednávka byla úspěšně smazána');
    } catch (error) {
        showError(`Chyba při mazání objednávky: ${error.message}`);
        console.error('Detailní chyba:', error);
    }
}

function getStatusBadge(status) {
    const statusClasses = {
        'Nová': 'badge-new',
        'Potvrzená': 'badge-confirmed',
        'Dokončená': 'badge-completed',
        'Zrušená': 'badge-cancelled'
    };
    
    return `<span class="badge ${statusClasses[status] || ''}">${status}</span>`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('cs-CZ');
}

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    const id = 'toast-' + Date.now();
    
    toast.className = `toast ${type}`;
    toast.id = id;
    
    const icon = type === 'success' ? '✅' : '❌';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="closeToast('${id}')">&times;</span>
    `;
    
    container.appendChild(toast);

    // Automatické zavření po 5 sekundách
    setTimeout(() => closeToast(id), 5000);
}

function closeToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }
}

// Nahrazení původních funkcí
function showError(message) {
    showToast(message, 'error');
}

function showMessage(message) {
    showToast(message, 'success');
}

// Upravíme kontrolu přihlášení
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Přidáme handler pro odhlášení
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}

// Přidáme funkci pro zobrazení uživatelského jména
function displayUsername() {
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
        console.error('Chyba při načítání uživatelského jména:', error);
    }
}

// Upravíme načtení stránky
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    try {
        displayUsername(); // Přidáme zobrazení uživatelského jména
        // Změníme cestu pro kontrolu na správný endpoint
        const response = await fetch('/api/orders/list', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Neplatné přihlášení');
        }

        // Pokud je token platný, načteme data
        await loadOrders();
        await loadUsers();
        setupModalHandlers();
    } catch (error) {
        console.error('Auth check failed:', error);
        if (error.message === 'Neplatné přihlášení') {
            logout();
        } else {
            showError('Chyba při načítání dat');
        }
    }
});

function setupModalHandlers() {
    const modal = document.getElementById('orderModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}
