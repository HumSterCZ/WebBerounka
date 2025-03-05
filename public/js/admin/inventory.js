import { getAuthHeaders } from './auth.js';
import { showError, showMessage } from './ui.js';
import { ITEM_TYPES, ITEM_NAMES } from './constants.js';
import { formatTime } from './helpers.js';

export async function initInventory() {
    const dateInput = document.getElementById('inventoryDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        addDateNavigation();
        await loadInventory();
    }
}

// Přesunout všechny funkce související se sklady z admin.js
export async function loadInventory() {
    try {
        const dateInput = document.getElementById('inventoryDate');
        const selectedDate = dateInput.value || new Date().toISOString().split('T')[0];

        const response = await fetch(`/api/inventory/${selectedDate}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Chyba při načítání dat skladů');

        const data = await response.json();
        renderInventory(data);
    } catch (error) {
        showError('Chyba při načítání stavu skladů: ' + error.message);
    }
}

function renderInventory(data) {
    const grid = document.getElementById('inventoryGrid');
    if (!grid || !Array.isArray(data)) return;

    grid.innerHTML = data.map(warehouse => {
        const baseStock = warehouse.baseStock || {};
        const dailyPlan = warehouse.dailyPlan || { departures: [], returns: [] };
        const currentStock = warehouse.currentStock || {};

        return `
            <div class="warehouse-card">
                <div class="warehouse-header">
                    <div class="warehouse-title-section">
                        <h3 class="warehouse-title">${warehouse.name || 'Neznámý sklad'}</h3>
                        <div class="warehouse-location">${warehouse.location || ''}</div>
                    </div>
                    <button onclick="editWarehouse(${warehouse.id}, ${JSON.stringify({
                        id: warehouse.id,
                        name: warehouse.name,
                        baseStock: baseStock
                    }).replace(/"/g, '&quot;')})" class="btn-edit-inventory">
                        Upravit sklad
                    </button>
                </div>
                <div class="warehouse-sections">
                    <div class="inventory-section">
                        <div class="section-title">Aktuální stav skladu</div>
                        <div class="inventory-list">
                            ${renderInventoryItems(baseStock, dailyPlan, currentStock)}
                        </div>
                    </div>
                    <div class="daily-plan-section">
                        <div class="section-title">Denní plán</div>
                        <div class="daily-plan">
                            <div class="plan-departures">
                                <h4>Výdej vybavení</h4>
                                ${renderPlanItems(dailyPlan.departures, 'departure')}
                            </div>
                            <div class="plan-returns">
                                <h4>Očekávané vrácení</h4>
                                ${renderPlanItems(dailyPlan.returns, 'return')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderInventoryItems(baseStock, dailyPlan, currentStock) {
    return `
        <div class="inventory-content">
            <div class="inventory-header">
                <div class="header-item name">Položka</div>
                <div class="header-item">Základ</div>
                <div class="header-item">Změna</div>
                <div class="header-item">Aktuálně</div>
            </div>
            <div class="inventory-items">
                ${ITEM_TYPES.map(type => {
                    const baseQuantity = parseInt(baseStock[type] || 0);
                    const actual = parseInt(currentStock[type] || baseQuantity);
                    const todayOut = calculateTodayMovements(dailyPlan.departures, type);
                    const todayIn = calculateTodayMovements(dailyPlan.returns, type);
                    const difference = todayIn - todayOut;

                    return `
                        <div class="inventory-row">
                            <div class="item-name">${ITEM_NAMES[type]}</div>
                            <div class="number-value base-quantity">${baseQuantity}</div>
                            <div class="number-value daily-changes ${difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''}">${
                                difference !== 0 ? (difference > 0 ? '+' : '') + difference : '-'
                            }</div>
                            <div class="number-value item-quantity">${actual}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function calculateTodayMovements(movements, type) {
    if (!Array.isArray(movements)) return 0;
    return movements.reduce((sum, movement) => 
        sum + (parseInt(movement.items?.[type] || 0)), 0);
}

function getQuantityClass(itemType, quantity) {
    const limits = {
        default: { low: 5, medium: 10 },
        padlo: { low: 10, medium: 20 },
        vesta: { low: 10, medium: 20 }
    };

    const { low, medium } = limits[itemType] || limits.default;

    if (quantity <= low) return 'quantity-low';
    if (quantity <= medium) return 'quantity-medium';
    return 'quantity-high';
}

function renderPlanItems(items, type) {
    if (!items || items.length === 0) {
        return '<div class="no-data">Žádné záznamy</div>';
    }

    return items.map(item => `
        <div class="plan-item ${type}">
            <div class="plan-time">${formatTime(type === 'departure' ? item.arrival_time : item.departure_time)}</div>
            <div class="plan-details">
                <div class="plan-customer">${item.name}</div>
                <div class="plan-equipment">
                    ${renderEquipmentList(item.items)}
                </div>
            </div>
        </div>
    `).join('');
}

function renderEquipmentList(items) {
    return Object.entries(items)
        .filter(([_, quantity]) => quantity > 0)
        .map(([type, quantity]) => `${quantity}× ${ITEM_NAMES[type]}`)
        .join(', ');
}

export function addDateNavigation() {
    const dateInput = document.getElementById('inventoryDate');
    const container = dateInput.parentElement;
    
    const prevButton = document.createElement('button');
    prevButton.textContent = '←';
    prevButton.className = 'btn-date-nav';
    prevButton.onclick = () => {
        const currentDate = new Date(dateInput.value);
        currentDate.setDate(currentDate.getDate() - 1);
        dateInput.value = currentDate.toISOString().split('T')[0];
        loadInventory();
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = '→';
    nextButton.className = 'btn-date-nav';
    nextButton.onclick = () => {
        const currentDate = new Date(dateInput.value);
        currentDate.setDate(currentDate.getDate() + 1);
        dateInput.value = currentDate.toISOString().split('T')[0];
        loadInventory();
    };

    container.insertBefore(prevButton, dateInput);
    container.appendChild(nextButton);
}

export async function saveWarehouseChanges(warehouseId) {
    try {
        const inputs = document.querySelectorAll('#inventoryEditForm input[type="number"]');
        const updates = Array.from(inputs).map(input => ({
            warehouseId: parseInt(warehouseId),
            itemType: input.dataset.itemType,
            quantity: parseInt(input.value) || 0
        }));

        for (const update of updates) {
            const response = await fetch('/api/inventory/update', {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(update)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Chyba při ukládání');
            }
        }

        showMessage('Množství bylo úspěšně aktualizováno');
        closeInventoryModal();
        await loadInventory();
    } catch (error) {
        showError(`Chyba při ukládání: ${error.message}`);
    }
}

export function editWarehouse(warehouseId, warehouse) {
    const modal = document.getElementById('inventoryModal');
    const form = document.getElementById('inventoryEditForm');
    
    form.innerHTML = `
        <h3>Upravit množství - ${warehouse?.name || 'Sklad'}</h3>
        <div class="inventory-edit-grid">
            ${ITEM_TYPES.map(type => `
                <div class="inventory-edit-group">
                    <label>${ITEM_NAMES[type]}:</label>
                    <input type="number" 
                           id="quantity_${type}" 
                           value="${parseInt(warehouse?.baseStock?.[type] || 0)}" 
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

export function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (modal) modal.style.display = "none";
}
