-- Oprava kódování databáze
ALTER DATABASE berounka CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Odstranění a znovuvytvoření tabulky orders
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    -- ...všechny ostatní sloupce zůstávají stejné...
    status ENUM('Nová', 'Potvrzená', 'Dokončená', 'Zrušená') 
    CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci 
    DEFAULT 'Nová'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
