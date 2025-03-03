CREATE DATABASE
IF NOT EXISTS berounka;
USE berounka;

CREATE TABLE
IF NOT EXISTS users
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR
(255) NOT NULL,
    email VARCHAR
(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vytvoření uživatele a přidělení práv
CREATE USER
IF NOT EXISTS 'berounka'@'%' IDENTIFIED BY 'berounka123';
GRANT ALL PRIVILEGES ON berounka.* TO 'berounka'@'%';
FLUSH PRIVILEGES;
