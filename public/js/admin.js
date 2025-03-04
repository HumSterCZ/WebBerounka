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

// Upravíme funkci loadOrders pro lepší debugování
async function loadOrders() {
    try {
        console.log('Načítám objednávky...');
        const response = await fetch('/api/orders/list', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        console.log('Status odpovědi:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Načtená data:', data);
        
        ordersData = data;
        renderOrders();
    } catch (error) {
        console.error('Detailní chyba:', error);
        showError('Chyba při načítání objednávek: ' + error.message);
    }
}

// Upravíme funkci pro řazení
function sortOrders(column) {
    console.log('Řazení podle:', column); // Debug log

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

    // Opravíme řazení pro datum a čas
    ordersData.sort((a, b) => {
        let valueA, valueB;

        switch(column) {
            case 'arrival':
                valueA = new Date(`${a.arrival_date}T${a.arrival_time}`);
                valueB = new Date(`${b.arrival_date}T${b.arrival_time}`);
                break;

            case 'departure':
                valueA = new Date(`${a.departure_date}T${a.departure_time}`);
                valueB = new Date(`${b.departure_date}T${b.departure_time}`);
                break;

            case 'created_at':
                valueA = new Date(a.created_at);
                valueB = new Date(b.created_at);
                break;

            default:
                valueA = a[column];
                valueB = b[column];
                if (typeof valueA === 'string') {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                }
        }

        // Ošetření neplatných dat
        if (valueA instanceof Date && isNaN(valueA)) return 1;
        if (valueB instanceof Date && isNaN(valueB)) return -1;

        const direction = currentSort.direction === 'asc' ? 1 : -1;
        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
    });

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

// Upravíme funkci renderOrders
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

    // Opravíme řazení pro datum a čas
    filteredData.sort((a, b) => {
        let valueA, valueB;

        switch(currentSort.column) {
            case 'arrival_date':
                // Pro řazení podle data příjezdu
                valueA = new Date(`${a.arrival_date}T${a.arrival_time || '00:00'}`);
                valueB = new Date(`${b.arrival_date}T${b.arrival_time || '00:00'}`);
                break;
            
            case 'departure_date':
                // Pro řazení podle data odjezdu
                valueA = new Date(`${a.departure_date}T${a.departure_time || '00:00'}`);
                valueB = new Date(`${b.departure_date}T${b.departure_time || '00:00'}`);
                break;
            
            case 'created_at':
                // Pro řazení podle data vytvoření
                valueA = new Date(a.created_at);
                valueB = new Date(b.created_at);
                break;

            default:
                // Pro ostatní sloupce
                valueA = a[currentSort.column];
                valueB = b[currentSort.column];
                
                // Převedeme na malá písmena pro textové hodnoty
                if (typeof valueA === 'string') {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                }
        }

        // Ošetření neplatných dat
        if (valueA instanceof Date && isNaN(valueA)) valueA = new Date(0);
        if (valueB instanceof Date && isNaN(valueB)) valueB = new Date(0);

        // Řazení podle směru
        const sortOrder = currentSort.direction === 'asc' ? 1 : -1;
        return valueA < valueB ? -sortOrder : valueA > valueB ? sortOrder : 0;
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
                <button onclick="editOrder(${order.id})" class="btn-action btn-edit">Upravit</button>
                <button onclick="updateOrderStatus(${order.id})" class="btn-action btn-status">Status</button>
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

// Upravená funkce pro mazání objednávky
async function deleteOrder(orderId) {
    // Vytvoříme dialog pro potvrzení
    const deleteDialog = document.createElement('div');
    deleteDialog.className = 'status-dialog';
    deleteDialog.innerHTML = `
        <div class="status-modal">
            <h3>Smazání objednávky</h3>
            <p>Opravdu chcete smazat tuto objednávku?</p>
            <div class="status-buttons">
                <button onclick="confirmDelete(${orderId})" class="btn-confirm">Smazat</button>
                <button onclick="closeDeleteDialog()" class="btn-cancel">Zrušit</button>
            </div>
        </div>
    `;
    document.body.appendChild(deleteDialog);
}

// Přidáme pomocné funkce pro mazání
async function confirmDelete(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        await loadOrders();
        showToast('Objednávka byla úspěšně smazána', 'success');
        closeDeleteDialog();
    } catch (error) {
        showToast(`Chyba při mazání objednávky: ${error.message}`, 'error');
        console.error('Detailní chyba:', error);
    }
}

function closeDeleteDialog() {
    const dialog = document.querySelector('.status-dialog');
    if (dialog) {
        dialog.remove();
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

// Přidáme funkci pro načtení stavu skladů
async function loadInventory() {
    try {
        const date = document.getElementById('inventoryDate').value || new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/inventory/${date}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Chyba při načítání dat skladů');
        const data = await response.json();

        renderInventory(data);
    } catch (error) {
        showError('Chyba při načítání stavu skladů: ' + error.message);
    }
}

// Upravíme funkci renderInventory
function renderInventory(data) {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = data.map(warehouse => `
        <div class="warehouse-card">
            <div class="warehouse-header">
                <h3 class="warehouse-title">${warehouse.name}</h3>
                <div class="warehouse-location">${warehouse.location}</div>
                <button onclick="editWarehouse(${warehouse.id}, ${JSON.stringify(warehouse).replace(/"/g, '&quot;')})" class="btn-edit-inventory">
                    Upravit sklad
                </button>
            </div>
            <div class="inventory-list">
                ${renderInventoryItems(warehouse.items)}
            </div>
        </div>
    `).join('');
}

// Upravíme funkci renderInventoryItems pro zobrazení bez tlačítek
function renderInventoryItems(items) {
    const itemNames = {
        kanoe: 'Kanoe',
        kanoe_rodinna: 'Rodinná kanoe',
        velky_raft: 'Velký raft',
        padlo: 'Pádlo',
        padlo_detske: 'Dětské pádlo',
        vesta: 'Vesta',
        vesta_detska: 'Dětská vesta',
        barel: 'Barel'
    };

    return Object.entries(items).map(([type, quantity]) => {
        const quantityClass = getQuantityClass(quantity);
        return `
            <div class="inventory-item">
                <span class="item-name">${itemNames[type] || type}</span>
                <span class="item-quantity ${quantityClass}">${quantity}</span>
            </div>
        `;
    }).join('');
}

// Přidáme novou funkci pro editaci celého skladu
function editWarehouse(warehouseId, warehouse) {
    const modal = document.getElementById('inventoryModal');
    const form = document.getElementById('inventoryEditForm');
    
    const itemNames = {
        kanoe: 'Kanoe',
        kanoe_rodinna: 'Rodinná kanoe',
        velky_raft: 'Velký raft',
        padlo: 'Pádlo',
        padlo_detske: 'Dětské pádlo',
        vesta: 'Vesta',
        vesta_detska: 'Dětská vesta',
        barel: 'Barel'
    };

    form.innerHTML = `
        <h3>Upravit množství - ${warehouse.name}</h3>
        <div class="inventory-edit-grid">
            ${Object.entries(warehouse.items).map(([type, quantity]) => `
                <div class="inventory-edit-group">
                    <label>${itemNames[type]}:</label>
                    <input type="number" 
                           id="quantity_${type}" 
                           value="${quantity}" 
                           min="0"
                           data-item-type="${type}">
                </div>
            `).join('')}
        </div>
        <div class="inventory-edit-actions">
            <button onclick="saveWarehouseChanges(${warehouseId})" class="btn-save">Uložit</button>
            <button onclick="closeInventoryModal()" class="btn-cancel">Zrušit</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Přidáme funkci pro uložení změn celého skladu
async function saveWarehouseChanges(warehouseId) {
    try {
        const updates = [];
        const inputs = document.querySelectorAll('#inventoryEditForm input[type="number"]');
        
        inputs.forEach(input => {
            updates.push({
                warehouseId,
                itemType: input.dataset.itemType,
                quantity: parseInt(input.value) || 0
            });
        });

        // Sekvenčně uložíme všechny změny
        for (const update of updates) {
            const response = await fetch('/api/inventory/update', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(update)
            });

            if (!response.ok) {
                throw new Error(`Chyba při ukládání položky ${update.itemType}`);
            }
        }

        showToast('Množství bylo úspěšně aktualizováno', 'success');
        closeInventoryModal();
        await loadInventory(); // Znovu načteme data
    } catch (error) {
        showToast(`Chyba při ukládání: ${error.message}`, 'error');
    }
}

// Přidat nové funkce pro správu inventáře
function editInventory(warehouseId, itemType, currentQuantity) {
    const modal = document.getElementById('inventoryModal');
    const form = document.getElementById('inventoryEditForm');
    
    form.innerHTML = `
        <h3>Upravit množství</h3>
        <div class="inventory-edit-group">
            <label>Aktuální množství: ${currentQuantity}</label>
            <input type="number" id="newQuantity" value="${currentQuantity}" min="0">
        </div>
        <div class="inventory-edit-actions">
            <button onclick="saveInventoryChange(${warehouseId}, '${itemType}')" class="btn-save">Uložit</button>
            <button onclick="closeInventoryModal()" class="btn-cancel">Zrušit</button>
        </div>
    `;
    
    modal.style.display = "block";
}

function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    modal.style.display = "none";
}

async function saveInventoryChange(warehouseId, itemType) {
    const newQuantity = parseInt(document.getElementById('newQuantity').value);
    
    try {
        const response = await fetch('/api/inventory/update', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                warehouseId,
                itemType,
                quantity: newQuantity
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        showToast('Množství bylo úspěšně aktualizováno', 'success');
        closeInventoryModal();
        await loadInventory(); // Znovu načteme data
    } catch (error) {
        showToast(`Chyba při ukládání: ${error.message}`, 'error');
    }
}

// Přidat novou funkci pro určení třídy podle množství
function getQuantityClass(quantity) {
    if (quantity <= 2) return 'quantity-low';
    if (quantity <= 5) return 'quantity-medium';
    return 'quantity-good';
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
        await loadInventory();
        setupModalHandlers();
        
        // Nastavíme dnešní datum pro inventář
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inventoryDate').value = today;
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

// Přidáme pomocnou funkci pro formátování data do HTML input formátu (YYYY-MM-DD)
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function createLocationSelector(name, value) {
    const options = Object.entries(LOCATIONS).map(([key, text]) => 
        `<option value="${key}" ${value === key ? 'selected' : ''}>${text}</option>`
    ).join('');
    
    return `<select name="${name}" required>${options}</select>`;
}

async function editOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Chyba při načítání dat');
        const result = await response.json();
        const order = result.data;

        const editHtml = `
            <h2>Editace objednávky #${order.id}</h2>
            <form id="editOrderForm" class="edit-form">
                <div class="edit-grid">
                    <div class="edit-section">
                        <h3>Kontaktní údaje</h3>
                        <div class="form-group">
                            <label>Jméno:</label>
                            <input type="text" name="name" value="${order.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" name="email" value="${order.email}" required>
                        </div>
                        <div class="form-group">
                            <label>Telefon:</label>
                            <input type="tel" name="phone" value="${order.phone}" required>
                        </div>
                    </div>
                    
                    <div class="edit-section">
                        <h3>Termín</h3>
                        <div class="form-group">
                            <label>Od:</label>
                            <input type="date" name="arrival_date" value="${formatDateForInput(order.arrival_date)}" required>
                            <input type="time" name="arrival_time" value="${formatTime(order.arrival_time)}" required>
                        </div>
                        <div class="form-group">
                            <label>Do:</label>
                            <input type="date" name="departure_date" value="${formatDateForInput(order.departure_date)}" required>
                            <input type="time" name="departure_time" value="${formatTime(order.departure_time)}" required>
                        </div>
                        <div class="form-group">
                            <label>Místo vyzvednutí:</label>
                            ${createLocationSelector('pickup_location', order.pickup_location)}
                        </div>
                        <div class="form-group">
                            <label>Místo vrácení:</label>
                            ${createLocationSelector('return_location', order.return_location)}
                        </div>
                    </div>

                    <div class="edit-section">
                        <h3>Vybavení</h3>
                        <div class="form-group">
                            <label>Kanoe:</label>
                            <input type="number" name="kanoe" value="${order.kanoe}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Rodinné kanoe:</label>
                            <input type="number" name="kanoe_rodinna" value="${order.kanoe_rodinna}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Velký raft:</label>
                            <input type="number" name="velky_raft" value="${order.velky_raft}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Pádla:</label>
                            <input type="number" name="padlo" value="${order.padlo}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Dětská pádla:</label>
                            <input type="number" name="padlo_detske" value="${order.padlo_detske}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Vesty:</label>
                            <input type="number" name="vesta" value="${order.vesta}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Dětské vesty:</label>
                            <input type="number" name="vesta_detska" value="${order.vesta_detska}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Barely:</label>
                            <input type="number" name="barel" value="${order.barel}" min="0">
                        </div>
                    </div>

                    <div class="edit-section">
                        <h3>Doprava</h3>
                        <div class="form-group">
                            <label>Přeprava vybavení:</label>
                            <select name="transport_items">
                                <option value="Ano" ${order.transport_items === 'Ano' ? 'selected' : ''}>Ano</option>
                                <option value="Ne" ${order.transport_items === 'Ne' ? 'selected' : ''}>Ne</option>
                                <option value="Nezvoleno" ${order.transport_items === 'Nezvoleno' ? 'selected' : ''}>Nezvoleno</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Přeprava osob:</label>
                            <select name="transport_people">
                                <option value="Žádná" ${order.transport_people === 'Žádná' ? 'selected' : ''}>Žádná</option>
                                <option value="Microbus" ${order.transport_people === 'Microbus' ? 'selected' : ''}>Microbus</option>
                                <option value="Autobus" ${order.transport_people === 'Autobus' ? 'selected' : ''}>Autobus</option>
                                <option value="Nezvoleno" ${order.transport_people === 'Nezvoleno' ? 'selected' : ''}>Nezvoleno</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Poznámka:</label>
                            <textarea name="order_note">${order.order_note || ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-save">Uložit změny</button>
                    <button type="button" onclick="closeEditDialog()" class="btn-cancel">Zrušit</button>
                </div>
            </form>
        `;

        const editDialog = document.createElement('div');
        editDialog.className = 'edit-dialog';
        editDialog.innerHTML = editHtml;
        document.body.appendChild(editDialog);

        // Přidáme handler pro formulář
        document.getElementById('editOrderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveOrderChanges(orderId, e.target);
        });

    } catch (error) {
        showError('Chyba při načítání dat objednávky');
        console.error(error);
    }
}

async function saveOrderChanges(orderId, form) {
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        showMessage('Změny byly úspěšně uloženy');
        closeEditDialog();
        await loadOrders();
    } catch (error) {
        showError(`Chyba při ukládání změn: ${error.message}`);
    }
}

function closeEditDialog() {
    const dialog = document.querySelector('.edit-dialog');
    if (dialog) {
        dialog.remove();
    }
}
