export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('cs-CZ');
}

export function formatTime(timeString) {
    return timeString ? timeString.substring(0, 5) : '';
}

export function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

export function createLocationSelector(name, value) {
    const options = Object.entries(LOCATIONS).map(([key, text]) => 
        `<option value="${key}" ${value === key ? 'selected' : ''}>${text}</option>`
    ).join('');
    
    return `<select name="${name}" required>${options}</select>`;
}

export function getStatusBadge(status) {
    const statusClasses = {
        'Nová': 'badge-new',
        'Potvrzená': 'badge-confirmed',
        'Dokončená': 'badge-completed',
        'Zrušená': 'badge-cancelled'
    };
    
    return `<span class="badge ${statusClasses[status] || ''}">${status}</span>`;
}
