-- Nastavení správného kódování pro celou databázi
ALTER DATABASE berounka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Zálohování dat
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- Smazání a vytvoření tabulky s novým ENUM
DROP TABLE orders;
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    phone VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    kanoe INT DEFAULT 0,
    kanoe_rodinna INT DEFAULT 0,
    maly_raft INT DEFAULT 0,
    velky_raft INT DEFAULT 0,
    padlo INT DEFAULT 0,
    padlo_detske INT DEFAULT 0,
    vesta INT DEFAULT 0,
    vesta_detska INT DEFAULT 0,
    barel INT DEFAULT 0,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    pickup_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    return_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    transport_items ENUM('Ano', 'Ne', 'Nezvoleno') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nezvoleno',
    transport_people ENUM('Žádná', 'Microbus', 'Autobus', 'Nezvoleno') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nezvoleno',
    order_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Nová', 'Potvrzená', 'Dokončená', 'Zrušená') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nová',
    INDEX idx_email (email),
    INDEX idx_dates (arrival_date, departure_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Obnovení dat
INSERT INTO orders 
SELECT 
    id, name, email, phone, 
    kanoe, kanoe_rodinna, maly_raft, velky_raft,
    padlo, padlo_detske, vesta, vesta_detska, barel,
    arrival_date, arrival_time, pickup_location,
    departure_date, departure_time, return_location,
    transport_items, transport_people, order_note,
    created_at,
    CASE 
        WHEN status = 'new' THEN 'Nová'
        WHEN status = 'confirmed' THEN 'Potvrzená'
        WHEN status = 'completed' THEN 'Dokončená'
        WHEN status = 'cancelled' THEN 'Zrušená'
        ELSE 'Nová'
    END as status
FROM orders_backup;

-- Odstranění zálohy
DROP TABLE orders_backup;
