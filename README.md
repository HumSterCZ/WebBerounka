# Berounka Web

Tento projekt představuje webovou aplikaci určenou k objednávání půjčení lodí a dalšího vybavení (kanoe, vesty, pádla, atd.) pro splutí řeky Berounky. Součástí aplikace je také administrátorská sekce, která umožňuje správu objednávek, inventarizaci skladů a tvorbu převozových lístků.

## Funkcionality

### Objednávky
- **Uživatelské údaje:**  
  - Jméno  
  - Email  
  - Telefon  
- **Detaily objednávky:**  
  - Vybrané vybavení:  
    - Kanoe  
    - Kanoe rodinná  
    - Velký raft (6 osob)  
    - Pádlo  
    - Pádlo dětské  
    - Vesta  
    - Vesta dětská  
    - Barel  
  - Datum příjezdu a čas příjezdu  
  - Místo převzetí materiálu  
  - Datum odjezdu a čas odjezdu  
  - Místo odevzdání materiálu  
  - Přeprava věcí (Ano/Ne)  
  - Přeprava osob (Ano/Ne)  
  - Poznámka

### Sklady
- **Informace o skladu:**  
  - Název skladu  
  - Stav vybavení:  
    - Kanoe  
    - Kanoe rodinná  
    - Velký raft (6 osob)  
    - Pádlo  
    - Pádlo dětské  
    - Vesta  
    - Vesta dětská  
    - Barel

### Administrátorská sekce
- **CRUD operace:**  
  - Přidání, editace, mazání a filtrování objednávek.
- **Inventarizace skladů:**  
  - Možnost fyzické kontroly a aktualizace počtů vybavení.
- **Převozové lístky:**  
  - Automatický výpočet stavu skladu dle objednávek a aktuálního počtu vybavení.  
  - Generování a tisk převozových lístků s přehledem, odkud kam a jaký materiál se má přesouvat.
- **Přístup:**  
  - Administrace je chráněna heslem: `BerounkaAdmin2025*`  
  - Pro zvýšení bezpečnosti doporučujeme uložit heslo jako environmentální proměnnou a provozovat aplikaci přes HTTPS.

## Technický Stack

- **Backend:** MySQL – relační databáze pro uchovávání dat (tabulky: Osoby, Objednávky, Sklady)
- **Kontejnerizace:** Docker – spuštění aplikace i databáze v Docker kontejnerech
- **Vývojové nástroje:**  
  - VS Code jako vývojové prostředí  
  - Git pro správu verzí a spolupráci

## Instalace a Spuštění

1. **Klonování repozitáře:**
   ```bash
   git clone https://github.com/HumSterCZ/WebBerounka.git
   cd berounka-web

Vždy pro vyhodnocení je potřeba projet kompletně všechny objednávky a edit cyklem a vyhodnotit "od startu databáze" až do zvoleného data co mám zobrazit za hodnoty materiálů.
Je to moc důležité tak to prosím tak udělej. 

Příklady funkce 
Inicializace databáze Skladů:
Sklad A se inicializoval s 20 loděmi.
Sklad B se inicializoval s 10 loděmi.

Objednávky
Výdej 4.5.2025 ze skladu A 5 lodí | Příjem 7.5.2025 do Skladu B 5 Lodí.
Výdej 5.5.2025 ze skladu A 10 lodí | Příjem 6.5.2025 do Skladu B 10 Lodí.
Výdej 5.5.2025 ze skladu A 15 lodí | Příjem 7.5.2025 do Skladu B 15 Lodí.
Výdej 6.5.2025 ze skladu A 20 lodí | Příjem 8.5.2025 do Skladu B 20 Lodí.

Sklady:
Sklad|Zvolené datum v date pickeru|Počet lodí Základ|Počet lodí Změna|Počet lodí Aktuální|
A|3.5.2025|20|0|20|
B|3.5.2025|10|0|10|
A|4.5.2025|20|-5|15|
B|4.5.2025|10|0|10|
A|5.5.2025|15|-10-15|-10|
B|5.5.2025|10|0|10|
A|6.5.2025|-10|-20|-30|
B|6.5.2025|10|+10|20|
zadaná změna materiálu na skladu A počet lodí změněn z -10 na 30
A|6.5.2025|30|-20|10|
B|6.5.2025|10|+10|20|
A|7.5.2025|10|0|10|
B|7.5.2025|10|+5+15|30|
zadaná změna materiálu na skladu B počet lodí změněn z 10 na -20
A|7.5.2025|10|0|10|
B|7.5.2025|-20|+5+15|0|
A|8.5.2025|10|0|10|
B|8.5.2025|0|+20|20|
A|9.5.2025|10|0|10|
B|9.5.2025|20|0|20|

Pořadí kliknutí na dny:
Pokud kliknu na den 9.5. Uvidím:
A|6.5.2025|10|0|10|
B|6.5.2025|20|0|20|

Pokud kliknu na den 4.5. Uvidím:
A|4.5.2025|20|-5|15|
B|4.5.2025|10|0|10|

Pokud kliknu na den 6.5. Uvidím:
A|6.5.2025|30|-20|10|
B|6.5.2025|10|+10|20|


