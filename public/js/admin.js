import { checkAuth, displayUsername, logout, getAuthHeaders } from './admin/auth.js';
import * as Orders from './admin/orders.js';
import * as Inventory from './admin/inventory.js';
import * as UI from './admin/ui.js';
import * as Users from './admin/users.js';

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    try {
        displayUsername();
        await Orders.initOrders();
        await Inventory.initInventory();
        UI.setupModalHandlers();

        // Nastavení aktivní záložky z URL nebo defaultní
        const hash = window.location.hash.substring(1) || 'orders';
        UI.showTab(hash);

        // Přidání handleru pro změnu hashe v URL
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.substring(1);
            UI.showTab(newHash);
        });
    } catch (error) {
        console.error('Init failed:', error);
        if (error.message === 'Neplatné přihlášení') {
            logout();
        } else {
            UI.showError('Chyba při načítání dat');
        }
    }
});

// Exportujeme všechny potřebné funkce do globálního objektu window
Object.assign(window, {
    // Auth funkce
    logout,
    
    // UI funkce
    showTab: UI.showTab,
    showError: UI.showError,
    showMessage: UI.showMessage,
    closeToast: UI.closeToast,
    closeEditDialog: UI.closeEditDialog,
    
    // Orders funkce
    loadOrders: Orders.loadOrders,
    viewOrder: Orders.viewOrder,
    editOrder: Orders.editOrder,
    deleteOrder: Orders.deleteOrder,
    updateOrderStatus: Orders.updateOrderStatus,
    confirmDelete: Orders.confirmDelete,
    closeDeleteDialog: Orders.closeDeleteDialog,
    submitStatus: Orders.submitStatus,
    closeStatusDialog: Orders.closeStatusDialog,
    saveOrderChanges: Orders.saveOrderChanges,
    filterOrders: Orders.filterOrders,
    sortOrders: Orders.sortOrders,
    
    // Inventory funkce
    loadInventory: Inventory.loadInventory,
    editWarehouse: Inventory.editWarehouse,
    saveWarehouseChanges: Inventory.saveWarehouseChanges,
    closeInventoryModal: Inventory.closeInventoryModal
});

// Pro debugging
window.getAuthHeaders = getAuthHeaders;
