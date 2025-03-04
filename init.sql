CREATE DATABASE IF NOT EXISTS berounka;
USE berounka;

-- Tabulka users zůstává stejná
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Upravená tabulka orders
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Kontaktní údaje
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Vybavení
    kanoe INT DEFAULT 0,
    kanoe_rodinna INT DEFAULT 0,
    maly_raft INT DEFAULT 0,
    velky_raft INT DEFAULT 0,
    padlo INT DEFAULT 0,
    padlo_detske INT DEFAULT 0,
    vesta INT DEFAULT 0,
    vesta_detska INT DEFAULT 0,
    barel INT DEFAULT 0,
    
    -- Datum a místo
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    return_location VARCHAR(255) NOT NULL,
    
    -- Přeprava
    transport_items ENUM('Ano', 'Ne', 'Nezvoleno') DEFAULT 'Nezvoleno',
    transport_people ENUM('Žádná', 'Microbus', 'Autobus', 'Nezvoleno') DEFAULT 'Nezvoleno',
    
    -- Poznámka
    order_note TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('new', 'confirmed', 'completed', 'cancelled') DEFAULT 'new',
    
    -- Indexy pro rychlejší vyhledávání
    INDEX idx_email (email),
    INDEX idx_dates (arrival_date, departure_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Upravíme ENUM pro status v tabulce orders
ALTER TABLE orders MODIFY COLUMN status ENUM('Nová', 'Potvrzená', 'Dokončená', 'Zrušená') DEFAULT 'Nová';

-- Upravíme tabulku orders pro správné kódování
ALTER DATABASE berounka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE orders MODIFY COLUMN status ENUM('Nová', 'Potvrzená', 'Dokončená', 'Zrušená') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nová';

-- Nejdřív vypneme kontrolu cizích klíčů
SET FOREIGN_KEY_CHECKS=0;

-- Smazat a znovu vytvořit tabulky v správném pořadí
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS warehouses;

-- Vytvoření tabulky pro sklady
CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE KEY unique_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vytvoření tabulky pro skladové položky
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    item_type ENUM('kanoe', 'kanoe_rodinna', 'velky_raft', 'padlo', 'padlo_detske', 'vesta', 'vesta_detska', 'barel') NOT NULL,
    total_quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    UNIQUE KEY unique_item_warehouse (warehouse_id, item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vložení nových skladů
INSERT INTO warehouses (location, name) VALUES
('Chrást - dolany', 'Sklad Chrást'),
('Nadryby - Pravý břeh', 'Sklad Nadryby'),
('Liblín - Tábořiště kobylka', 'Sklad Liblín'),
('Třímany - U Mloka', 'Sklad Třímany'),
('Zvíkovec - U Varských', 'Sklad Zvíkovec'),
('Skryje - U Fišera', 'Sklad Skryje'),
('Višňová', 'Sklad Višňová'),
('Roztoky - U Jezzu', 'Sklad Roztoky');

-- Vložit náhodná data do skladů
INSERT INTO inventory_items (warehouse_id, item_type, total_quantity)
SELECT 
    w.id,
    t.item_type,
    CASE 
        WHEN t.item_type IN ('padlo', 'vesta') THEN FLOOR(30 + RAND() * 20)
        ELSE FLOOR(10 + RAND() * 20)
    END as total_quantity
FROM warehouses w
CROSS JOIN (
    SELECT 'kanoe' as item_type UNION ALL
    SELECT 'kanoe_rodinna' UNION ALL
    SELECT 'velky_raft' UNION ALL
    SELECT 'padlo' UNION ALL
    SELECT 'padlo_detske' UNION ALL
    SELECT 'vesta' UNION ALL
    SELECT 'vesta_detska' UNION ALL
    SELECT 'barel'
) t;

-- Znovu zapneme kontrolu cizích klíčů
SET FOREIGN_KEY_CHECKS=1;

-- Vytvoření uživatele a práva
CREATE USER IF NOT EXISTS 'berounka'@'%' IDENTIFIED BY 'berounka123';
GRANT ALL PRIVILEGES ON berounka.* TO 'berounka'@'%';
FLUSH PRIVILEGES;
