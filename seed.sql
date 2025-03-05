-- Vložíme testovací data
INSERT INTO orders
    (
    name, email, phone,
    kanoe, kanoe_rodinna, velky_raft, padlo, padlo_detske, vesta, vesta_detska, barel,
    arrival_date, arrival_time,
    pickup_location, departure_date, departure_time, return_location,
    status
    )
WITH RECURSIVE dates AS
    (
        SELECT DATE('2024-06-01') as date
UNION ALL
    SELECT date + INTERVAL
1 DAY
    FROM dates
    WHERE date < '2024-06-20'
),
pickups AS
(
    SELECT id, location
FROM warehouses
)
,
returns AS
(
    SELECT id, location
FROM warehouses
)
SELECT
    CONCAT('Test User ', FLOOR(RAND() * 100)) as name,
    CONCAT('test', FLOOR(RAND() * 100), '@example.com') as email,
    CONCAT('12345', FLOOR(RAND() * 1000)) as phone,
    FLOOR(1 + RAND() * 3) as kanoe,
    FLOOR(RAND() * 2) as kanoe_rodinna,
    FLOOR(RAND() * 2) as velky_raft,
    FLOOR(2 + RAND() * 6) as padlo,
    FLOOR(RAND() * 3) as padlo_detske,
    FLOOR(2 + RAND() * 6) as vesta,
    FLOOR(RAND() * 3) as vesta_detska,
    FLOOR(RAND() * 2) as barel,
    d.date as arrival_date,
    TIME_FORMAT('08:00:00' + INTERVAL FLOOR
(RAND
() * 8) HOUR, '%H:%i:00') as arrival_time,
    p.location as pickup_location,
    DATE_ADD
(d.date, INTERVAL FLOOR
(1 + RAND
() * 3) DAY) as departure_date,
    TIME_FORMAT
('14:00:00' + INTERVAL FLOOR
(RAND
() * 6) HOUR, '%H:%i:00') as departure_time,
    r.location as return_location,
    'Potvrzená' as status
FROM 
    dates d
    CROSS JOIN pickups p
    CROSS JOIN returns r
WHERE 
    RAND
() < 0.3  -- Generujeme jen 30% možných kombinací pro realističtější data
LIMIT 20;  -- Omezíme na 20 objednávek
