SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Drop and recreate database
DROP DATABASE IF EXISTS berounka;
CREATE DATABASE berounka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE berounka;

-- Nejdřív vypneme kontrolu cizích klíčů
SET FOREIGN_KEY_CHECKS=0;

-- Vytvoření tabulky users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Vytvoření tabulky orders
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
    status ENUM('Nová', 'Potvrzená', 'Dokončená', 'Zrušená') DEFAULT 'Nová',
    
    -- Indexy pro rychlejší vyhledávání
    INDEX idx_email (email),
    INDEX idx_dates (arrival_date, departure_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Nejprve smažeme a znovu vytvoříme tabulku skladů
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS warehouses;

CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE KEY unique_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Vytvoření tabulky pro skladové položky
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    item_type ENUM('kanoe', 'kanoe_rodinna', 'velky_raft', 'padlo', 
                   'padlo_detske', 'vesta', 'vesta_detska', 'barel') NOT NULL,
    base_quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    UNIQUE KEY unique_item_warehouse (warehouse_id, item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Vytvoření tabulky pro edity skladů
CREATE TABLE warehouse_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    material_type VARCHAR(50) NOT NULL,
    edit_date DATE NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT DEFAULT NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    INDEX idx_warehouse_date (warehouse_id, edit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Znovu zapneme kontrolu cizích klíčů
SET FOREIGN_KEY_CHECKS=1;

-- Vložení výchozích dat do skladů
INSERT INTO warehouses (location, name) VALUES
('Chrást - dolany', 'Sklad Chrást'),
('Nadryby - Pravý břeh', 'Sklad Nadryby'),
('Liblín - Tábořiště kobylka', 'Sklad Liblín'),
('Třímany - U Mloka', 'Sklad Třímany'),
('Zvíkovec - U Varských', 'Sklad Zvíkovec'),
('Skryje - U Fišera', 'Sklad Skryje'),
('Višňová', 'Sklad Višňová'),
('Roztoky - U Jezzu', 'Sklad Roztoky');

-- Vložíme výchozí hodnoty pro všechny sklady a všechny typy položek
INSERT INTO inventory_items (warehouse_id, item_type, base_quantity)
SELECT 
    w.id,
    t.item_type,
    FLOOR(10 + RAND() * 20)
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

-- Vytvoříme tabulku pro historii skladových pohybů
CREATE TABLE IF NOT EXISTS inventory_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    date DATE NOT NULL,
    movement_type ENUM('IN', 'OUT') NOT NULL,
    order_id INT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_date (date),
    INDEX idx_warehouse_date (warehouse_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Vložíme testovací data
INSERT INTO orders (name, email, phone, kanoe, padlo, vesta, arrival_date, arrival_time, 
                   pickup_location, departure_date, departure_time, return_location, status)
SELECT 
    CONCAT('Test User ', n) as name,
    CONCAT('test', n, '@example.com') as email,
    CONCAT('123456', n) as phone,
    FLOOR(1 + RAND() * 3) as kanoe,
    FLOOR(2 + RAND() * 6) as padlo,
    FLOOR(2 + RAND() * 6) as vesta,
    DATE_ADD('2024-06-01', INTERVAL n DAY) as arrival_date,
    TIME_FORMAT(TIME('08:00:00') + INTERVAL FLOOR(RAND() * 8) HOUR, '%H:%i:00') as arrival_time,
    (SELECT location FROM warehouses ORDER BY RAND() LIMIT 1) as pickup_location,
    DATE_ADD('2024-06-01', INTERVAL n+FLOOR(1+RAND()*3) DAY) as departure_date,
    TIME_FORMAT(TIME('14:00:00') + INTERVAL FLOOR(RAND() * 6) HOUR, '%H:%i:00') as departure_time,
    (SELECT location FROM warehouses ORDER BY RAND() LIMIT 1) as return_location,
    'Potvrzená' as status
FROM (
    SELECT a.N + b.N * 10 as n 
    FROM (SELECT 0 as N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) a,
         (SELECT 0 as N UNION SELECT 1) b
    WHERE a.N + b.N * 10 < 20
) numbers;
