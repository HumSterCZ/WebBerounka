export function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

export function showToast(message, type = 'success') {
    // ... původní kód funkce showToast ...
}

export function showError(message) {
    showToast(message, 'error');
}

export function showMessage(message) {
    showToast(message, 'success');
}

export function setupModalHandlers() {
    const modal = document.getElementById('orderModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}

export function closeToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }
}

export function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    modal.style.display = "none";
}

export function closeEditDialog() {
    const dialog = document.querySelector('.edit-dialog');
    if (dialog) {
        dialog.remove();
    }
}
