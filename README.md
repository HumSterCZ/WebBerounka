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
