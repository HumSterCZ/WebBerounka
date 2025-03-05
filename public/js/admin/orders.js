import { getAuthHeaders } from './auth.js';
import { showError, showMessage, showToast } from './ui.js';
import { formatDate, formatTime, formatDateForInput, createLocationSelector, getStatusBadge } from './helpers.js';

let ordersData = [];
let currentSort = { column: 'created_at', direction: 'desc' };

export async function initOrders() {
    await loadOrders();
}

export async function loadOrders() {
    try {
        console.log('Načítám objednávky...');
        const response = await fetch('/api/orders/list', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        ordersData = await response.json();
        renderOrders();
    } catch (error) {
        showError('Chyba při načítání objednávek: ' + error.message);
    }
}

export function filterOrders() {
    renderOrders();
}

export function sortOrders(column) {
    const th = document.querySelector(`th[onclick="sortOrders('${column}')"]`);
    document.querySelectorAll('th').forEach(header => {
        if (header !== th) header.classList.remove('sorted-asc', 'sorted-desc');
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

export function renderOrders() {
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

    // Řazení dat
    sortData(filteredData);

    // Vykreslení dat
    const tbody = document.getElementById('ordersList');
    tbody.innerHTML = filteredData.map(order => renderOrderRow(order)).join('');
}

function sortData(data) {
    data.sort((a, b) => {
        let valueA = getSortValue(a, currentSort.column);
        let valueB = getSortValue(b, currentSort.column);
        
        const direction = currentSort.direction === 'asc' ? 1 : -1;
        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
    });
}

function getSortValue(order, column) {
    switch(column) {
        case 'arrival':
            return new Date(`${order.arrival_date}T${order.arrival_time}`);
        case 'departure':
            return new Date(`${order.departure_date}T${order.departure_time}`);
        case 'created_at':
            return new Date(order.created_at);
        default:
            return typeof order[column] === 'string' 
                ? order[column].toLowerCase() 
                : order[column];
    }
}

function renderOrderRow(order) {
    return `
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
                <div class="action-buttons">
                    <button onclick="viewOrder(${order.id})" class="btn-action btn-view">Detail</button>
                    <button onclick="editOrder(${order.id})" class="btn-action btn-edit">Upravit</button>
                    <button onclick="updateOrderStatus(${order.id})" class="btn-action btn-status">Status</button>
                    <button onclick="deleteOrder(${order.id})" class="btn-action btn-delete">Smazat</button>
                </div>
            </td>
        </tr>
    `;
}

export async function viewOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Chyba při načítání dat');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const order = result.data;
        document.getElementById('orderDetail').innerHTML = generateOrderDetailHtml(order);
        document.getElementById('orderModal').style.display = "block";
    } catch (error) {
        showError('Chyba při načítání detailu objednávky: ' + error.message);
    }
}

function generateOrderDetailHtml(order) {
    return `
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
                ${renderEquipmentList(order)}
            </div>

            <div class="detail-section">
                <h3>Doprava</h3>
                <p><strong>Přeprava vybavení:</strong> ${order.transport_items}</p>
                <p><strong>Přeprava osob:</strong> ${order.transport_people}</p>
                <p><strong>Poznámka:</strong> ${order.order_note || '-'}</p>
            </div>
        </div>
    `;
}

function renderEquipmentList(order) {
    const equipment = {
        kanoe: 'Kanoe',
        kanoe_rodinna: 'Rodinná kanoe',
        velky_raft: 'Velký raft',
        padlo: 'Pádlo',
        padlo_detske: 'Dětské pádlo',
        vesta: 'Vesta',
        vesta_detska: 'Dětská vesta',
        barel: 'Barel'
    };

    return Object.entries(equipment)
        .map(([key, name]) => {
            if (order[key] > 0) {
                return `<p><strong>${name}:</strong> ${order[key]}x</p>`;
            }
            return '';
        })
        .join('');
}

export async function updateOrderStatus(orderId) {
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
    }
}

export async function submitStatus(orderId) {
    const select = document.getElementById('statusSelect');
    const newStatus = select.value;

    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        await loadOrders();
        showMessage('Status byl úspěšně aktualizován');
        closeStatusDialog();
    } catch (error) {
        showError(`Chyba při aktualizaci statusu: ${error.message}`);
    }
}

export function closeStatusDialog() {
    const dialog = document.querySelector('.status-dialog');
    if (dialog) dialog.remove();
}

export function closeDeleteDialog() {
    const dialog = document.querySelector('.status-dialog');
    if (dialog) dialog.remove();
}

export async function deleteOrder(orderId) {
    try {
        // Vytvoříme potvrzovací dialog
        const dialog = document.createElement('div');
        dialog.className = 'status-dialog';
        dialog.innerHTML = `
            <div class="status-modal">
                <h3>Smazání objednávky</h3>
                <p>Opravdu chcete smazat tuto objednávku?</p>
                <div class="status-buttons">
                    <button onclick="window.confirmDelete(${orderId})" class="btn-confirm">Smazat</button>
                    <button onclick="window.closeDeleteDialog()" class="btn-cancel">Zrušit</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    } catch (error) {
        showError(`Chyba při mazání: ${error.message}`);
    }
}

export async function confirmDelete(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Chyba při mazání');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        showMessage('Objednávka byla úspěšně smazána');
        closeDeleteDialog();
        await loadOrders();
    } catch (error) {
        showError(`Chyba při mazání: ${error.message}`);
    }
}

export async function editOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Chyba při načítání dat');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const order = result.data;
        const editDialog = createEditDialog(order);
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

function createEditDialog(order) {
    const dialog = document.createElement('div');
    dialog.className = 'edit-dialog';
    dialog.innerHTML = `
        <form id="editOrderForm" class="edit-form">
            <h2>Editace objednávky #${order.id}</h2>
            <div class="edit-grid">
                ${createContactSection(order)}
                ${createDateSection(order)}
                ${createEquipmentSection(order)}
                ${createTransportSection(order)}
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-save">Uložit změny</button>
                <button type="button" onclick="closeEditDialog()" class="btn-cancel">Zrušit</button>
            </div>
        </form>
    `;
    return dialog;
}

function createContactSection(order) {
    return `
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
    `;
}

function createDateSection(order) {
    return `
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
    `;
}

function createEquipmentSection(order) {
    return `
        <div class="edit-section">
            <h3>Vybavení</h3>
            <div class="form-group">
                <label>Kanoe:</label>
                <input type="number" name="kanoe" value="${order.kanoe || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Rodinné kanoe:</label>
                <input type="number" name="kanoe_rodinna" value="${order.kanoe_rodinna || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Velký raft:</label>
                <input type="number" name="velky_raft" value="${order.velky_raft || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Pádla:</label>
                <input type="number" name="padlo" value="${order.padlo || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Dětská pádla:</label>
                <input type="number" name="padlo_detske" value="${order.padlo_detske || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Vesty:</label>
                <input type="number" name="vesta" value="${order.vesta || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Dětské vesty:</label>
                <input type="number" name="vesta_detska" value="${order.vesta_detska || 0}" min="0">
            </div>
            <div class="form-group">
                <label>Barely:</label>
                <input type="number" name="barel" value="${order.barel || 0}" min="0">
            </div>
        </div>
    `;
}

function createTransportSection(order) {
    return `
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
    `;
}

export async function saveOrderChanges(orderId, form) {
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Chyba při ukládání změn');
        }

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

// ... další funkce pro správu objednávek ...
