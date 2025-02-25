-- Vytvoření databáze (pokud ještě neexistuje)
CREATE DATABASE IF NOT EXISTS berounka_db 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_general_ci;

-- Použití databáze
USE berounka_db;

-- Tabulka pro osoby
CREATE TABLE osoby (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jmeno VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefon VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabulka pro sklady (místa pro výdej a vracení vybavení)
CREATE TABLE sklady (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nazev VARCHAR(255) NOT NULL,
  kanoe INT DEFAULT 0,
  kanoe_rodinna INT DEFAULT 0,
  velky_raft INT DEFAULT 0,
  padlo INT DEFAULT 0,
  padlo_detske INT DEFAULT 0,
  vesta INT DEFAULT 0,
  vesta_detska INT DEFAULT 0,
  barel INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hlavní tabulka objednávek
CREATE TABLE objednavky (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Volitelný odkaz na osobu, pokud budete chtít spojovat objednávku s existující osobou
  osoba_id INT,
  
  -- Přesto u objednávky zaznamenáme kontaktní údaje (pro případ, že se nevyužije existující záznam)
  jmeno VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefon VARCHAR(50),
  
  -- Počty vybavení, které si zákazník objednává
  kanoe INT DEFAULT 0,
  kanoe_rodinna INT DEFAULT 0,
  velky_raft INT DEFAULT 0,
  padlo INT DEFAULT 0,
  padlo_detske INT DEFAULT 0,
  vesta INT DEFAULT 0,
  vesta_detska INT DEFAULT 0,
  barel INT DEFAULT 0,
  
  -- Datum a čas příjezdu a odjezdu
  prijezd_datum DATE,
  prijezd_cas TIME,
  odjezd_datum DATE,
  odjezd_cas TIME,
  
  -- Místo převzetí a odevzdání materiálu (odkaz na tabulku sklady)
  sklad_prevzeti INT,
  sklad_odevzdani INT,
  
  -- Informace o přepravě
  preprava_veci TINYINT(1) DEFAULT 0,  -- 0 = Ne, 1 = Ano
  preprava_osob TINYINT(1) DEFAULT 0,   -- 0 = Ne, 1 = Ano
  
  -- Volitelná poznámka
  poznamka TEXT,
  
  -- Definice cizích klíčů
  CONSTRAINT fk_osoba FOREIGN KEY (osoba_id) REFERENCES osoby(id) ON DELETE SET NULL,
  CONSTRAINT fk_sklad_prevzeti FOREIGN KEY (sklad_prevzeti) REFERENCES sklady(id) ON DELETE SET NULL,
  CONSTRAINT fk_sklad_odevzdani FOREIGN KEY (sklad_odevzdani) REFERENCES sklady(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SHOW TABLES;