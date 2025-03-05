const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Upravíme pool konfiguraci
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'berounka',
  password: process.env.DB_PASSWORD || 'berounka123',
  database: process.env.DB_NAME || 'berounka',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
});

// Příprava promise wrapperu pro pool
const promisePool = pool.promise();

// Upravená funkce initDatabase
async function initDatabase() {
  try {
    // Vytvoření users tabulky
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `);

    // Vytvoření orders tabulky
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
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
        pickup_location VARCHAR(255) NOT NULL,
        departure_date DATE NOT NULL,
        departure_time TIME NOT NULL,
        return_location VARCHAR(255) NOT NULL,
        transport_items ENUM('Ano', 'Ne', 'Nezvoleno') DEFAULT 'Nezvoleno',
        transport_people ENUM('Žádná', 'Microbus', 'Autobus', 'Nezvoleno') DEFAULT 'Nezvoleno',
        order_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('new', 'confirmed', 'completed', 'cancelled') DEFAULT 'new',
        INDEX idx_email (email),
        INDEX idx_dates (arrival_date, departure_date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Databáze úspěšně inicializována');
  } catch (err) {
    console.error('Chyba při inicializaci databáze:', err);
    throw err; // Přehodíme chybu dál, aby aplikace věděla o problému
  }
}

// Přidáme funkci pro čekání na databázi
async function waitForDatabase() {
  const maxRetries = 60; // Zvýšíme počet pokusů
  const retryInterval = 5000; // Prodloužíme interval mezi pokusy na 5 sekund
  
  console.log('Čekání na inicializaci databáze...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Pokus o připojení k databázi (${i + 1}/${maxRetries})...`);
      await promisePool.query('SELECT 1');
      console.log('Úspěšně připojeno k databázi!');
      return true;
    } catch (error) {
      console.log(`Připojení selhalo (pokus ${i + 1}/${maxRetries}): ${error.message}`);
      if (i < maxRetries - 1) {
        console.log(`Čekám ${retryInterval/1000} sekund před dalším pokusem...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
  }
  throw new Error(`Nepodařilo se připojit k databázi po ${maxRetries} pokusech`);
}

// Upravíme spuštění serveru, aby počkalo na inicializaci databáze
async function startServer() {
  try {
    console.log('Čekání na dostupnost databáze...');
    await waitForDatabase();
    
    console.log('Inicializace databáze...');
    await initDatabase();
    
    app.listen(port, () => {
      console.log(`Aplikace běží na http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Kritická chyba při spouštění serveru:', error);
    process.exit(1); // Ukončíme aplikaci při chybě
  }
}

// Spustíme server
startServer();

// Sekretní klíč pro JWT
const JWT_SECRET = process.env.JWT_SECRET || 'berounka-secret-key';

// Middleware pro ověření JWT tokenu
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Není přihlášen' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Neplatný token' 
        });
    }
};

// Přihlašovací endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'berounka123') {
        const token = jwt.sign(
            { username, role: 'admin' }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            token,
            message: 'Přihlášení úspěšné'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Nesprávné přihlašovací údaje' 
        });
    }
});

// Veřejný endpoint pro vytvoření objednávky (musí být PŘED admin routami)
app.post('/api/orders/create', async (req, res) => {
    try {
        console.log('Přijatá data:', req.body);

        // Validace povinných polí
        const requiredFields = ['name', 'email', 'phone', 'arrival_date', 'arrival_time', 
                          'pickup_location', 'departure_date', 'departure_time', 'return_location'];
        
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Chybí povinné pole: ${field}`);
            }
        }

        const orderData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            kanoe: parseInt(req.body.kanoe) || 0,
            kanoe_rodinna: parseInt(req.body.kanoe_rodinna) || 0,
            velky_raft: parseInt(req.body.velky_raft) || 0,
            padlo: parseInt(req.body.padlo) || 0,
            padlo_detske: parseInt(req.body.padlo_detske) || 0,
            vesta: parseInt(req.body.vesta) || 0,
            vesta_detska: parseInt(req.body.vesta_detska) || 0,
            barel: parseInt(req.body.barel) || 0,
            arrival_date: req.body.arrival_date,
            arrival_time: req.body.arrival_time,
            pickup_location: req.body.pickup_location,
            departure_date: req.body.departure_date,
            departure_time: req.body.departure_time,
            return_location: req.body.return_location,
            transport_items: req.body.transport_items || 'Nezvoleno',
            transport_people: req.body.transport_people || 'Nezvoleno',
            order_note: req.body.order_note || '',
            status: 'Nová' // Přidáme výchozí status
        };

        const [result] = await promisePool.query(
            'INSERT INTO orders SET ?',
            orderData
        );

        console.log('Objednávka uložena:', result.insertId);

        res.json({ 
            success: true, 
            orderId: result.insertId,
            message: 'Objednávka byla úspěšně uložena'
        });
    } catch (error) {
        console.error('Chyba při ukládání objednávky:', error);
        res.status(400).json({ 
            success: false, 
            message: `Chyba při ukládání objednávky: ${error.message}`
        });
    }
});

// Přesuneme endpoint pro inventář před připojení admin rout
app.get('/api/inventory/:date', async (req, res) => {
    try {
        const selectedDate = req.params.date;
        const [warehouses] = await promisePool.query('SELECT * FROM warehouses');
        
        // Inicializujeme prázdný objekt pro každý typ položky
        const createEmptyStock = () => {
            const stock = {};
            ITEM_TYPES.forEach(type => stock[type] = 0);
            return stock;
        };

        const inventoryPromises = warehouses.map(async (warehouse) => {
            try {
                // 1. Vytvoříme základní stav s nulovými hodnotami
                const baseStock = createEmptyStock();

                // 2. Načteme aktuální stav ze skladu
                const [baseItems] = await promisePool.query(
                    'SELECT item_type, base_quantity FROM inventory_items WHERE warehouse_id = ?',
                    [warehouse.id]
                );

                // 3. Aktualizujeme základní stav načtenými hodnotami
                if (baseItems && baseItems.length > 0) {
                    baseItems.forEach(item => {
                        if (item && item.item_type && ITEM_TYPES.includes(item.item_type)) {
                            baseStock[item.item_type] = parseInt(item.base_quantity) || 0;
                        }
                    });
                }

                // 4. Vytvoříme kopii pro aktuální stav
                const currentStock = { ...baseStock };

                // 5. Načteme všechny pohyby před vybraným datem
                const [previousMovements] = await promisePool.query(`
                    SELECT * FROM orders 
                    WHERE (
                        (pickup_location = ? AND arrival_date < ?)
                        OR 
                        (return_location = ? AND departure_date < ?)
                    )
                    AND status != 'Zrušená'
                    ORDER BY arrival_date, departure_date
                `, [warehouse.location, selectedDate,
                    warehouse.location, selectedDate]);

                // 6. Aplikujeme předchozí pohyby
                previousMovements.forEach(movement => {
                    ITEM_TYPES.forEach(type => {
                        const quantity = parseInt(movement[type] || 0);
                        if (quantity > 0) {
                            if (movement.pickup_location === warehouse.location) {
                                currentStock[type] -= quantity;
                            } else if (movement.return_location === warehouse.location) {
                                currentStock[type] += quantity;
                            }
                        }
                    });
                });

                // 7. Načteme dnešní pohyby
                const [todayMovements] = await promisePool.query(`
                    SELECT * FROM orders 
                    WHERE (
                        (pickup_location = ? AND arrival_date = ?)
                        OR 
                        (return_location = ? AND departure_date = ?)
                    )
                    AND status != 'Zrušená'
                    ORDER BY arrival_time, departure_time
                `, [warehouse.location, selectedDate,
                    warehouse.location, selectedDate]);

                // 8. Připravíme denní plán
                const departures = todayMovements
                    .filter(m => m.pickup_location === warehouse.location)
                    .map(m => ({
                        ...m,
                        items: ITEM_TYPES.reduce((acc, type) => {
                            acc[type] = parseInt(m[type] || 0);
                            return acc;
                        }, {})
                    }));

                const returns = todayMovements
                    .filter(m => m.return_location === warehouse.location)
                    .map(m => ({
                        ...m,
                        items: ITEM_TYPES.reduce((acc, type) => {
                            acc[type] = parseInt(m[type] || 0);
                            return acc;
                        }, {})
                    }));

                return {
                    id: warehouse.id,
                    name: warehouse.name || 'Neznámý sklad',
                    location: warehouse.location,
                    baseStock: baseStock || {},
                    currentStock: currentStock || {},
                    dailyPlan: {
                        departures: departures || [],
                        returns: returns || []
                    }
                };
            } catch (error) {
                console.error(`Error processing warehouse ${warehouse.id}:`, error);
                // Vrátíme prázdný sklad v případě chyby
                return {
                    id: warehouse.id,
                    name: warehouse.name || 'Chyba skladu',
                    location: warehouse.location,
                    baseStock: createEmptyStock(),
                    currentStock: createEmptyStock(),
                    dailyPlan: {
                        departures: [],
                        returns: []
                    },
                    error: error.message
                };
            }
        });

        const inventoryData = await Promise.all(inventoryPromises);
        res.json(inventoryData);

    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Chyba při načítání dat skladů: ' + error.message
        });
    }
});

// Pomocná funkce pro získání stavu skladu k určitému datu
async function getWarehouseStockForDate(warehouseId, date) {
    try {
        // Nejprve získáme poslední známý stav před daným datem
        const [lastKnownState] = await promisePool.query(`
            SELECT 
                item_type,
                SUM(
                    CASE movement_type 
                        WHEN 'IN' THEN quantity 
                        WHEN 'OUT' THEN -quantity 
                    END
                ) as total_quantity
            FROM inventory_history
            WHERE warehouse_id = ? AND date < ?
            GROUP BY item_type
        `, [warehouseId, date]);

        // Pokud nemáme historii, použijeme základní stav
        if (lastKnownState.length === 0) {
            const [baseItems] = await promisePool.query(
                'SELECT item_type, base_quantity as total_quantity FROM inventory_items WHERE warehouse_id = ?',
                [warehouseId]
            );
            return baseItems;
        }

        return lastKnownState;
    } catch (error) {
        console.error('Error getting warehouse stock:', error);
        throw error;
    }
}

// Funkce pro zaznamenání denních pohybů
async function recordDailyMovements(warehouseId, date, movements) {
    try {
        const records = movements.flatMap(movement => {
            const items = [];
            ['kanoe', 'kanoe_rodinna', 'velky_raft', 'padlo', 
             'padlo_detske', 'vesta', 'vesta_detska', 'barel'].forEach(item => {
                if (movement[item] > 0) {
                    items.push({
                        warehouse_id: warehouseId,
                        item_type: item,
                        quantity: movement[item],
                        date: date,
                        movement_type: movement.operation_type,
                        order_id: movement.id
                    });
                }
            });
            return items;
        });

        if (records.length > 0) {
            await promisePool.query(
                'INSERT INTO inventory_history (warehouse_id, item_type, quantity, date, movement_type, order_id) VALUES ?',
                [records.map(r => [r.warehouse_id, r.item_type, r.quantity, r.date, r.movement_type, r.order_id])]
            );
        }
    } catch (error) {
        console.error('Error recording daily movements:', error);
        throw error;
    }
}

// Nová funkce pro aktualizaci základního stavu
async function updateBaseStock(warehouseId, currentDate) {
    try {
        // 1. Nejdřív získáme původní hodnoty
        const [originalItems] = await promisePool.query(
            'SELECT item_type, total_quantity FROM inventory_items WHERE warehouse_id = ?',
            [warehouseId]
        );
        
        // 2. Načteme všechny předchozí pohyby
        const [transfers] = await promisePool.query(`
            SELECT 
                o.*,
                CASE 
                    WHEN o.pickup_location = w.location THEN -1
                    WHEN o.return_location = w.location THEN 1
                    ELSE 0
                END as movement_type
            FROM orders o
            CROSS JOIN (
                SELECT location 
                FROM warehouses 
                WHERE id = ?
            ) w
            WHERE 
                ((o.pickup_location = w.location AND o.arrival_date < ?)
                OR 
                (o.return_location = w.location AND o.departure_date < ?))
                AND o.status != 'Zrušená'
            ORDER BY 
                CASE 
                    WHEN o.pickup_location = w.location THEN o.arrival_date
                    ELSE o.departure_date
                END ASC,
                CASE 
                    WHEN o.pickup_location = w.location THEN o.arrival_time
                    ELSE o.departure_time
                END ASC
        `, [warehouseId, currentDate, currentDate]);

        // 3. Vytvoříme průběžný stav
        const runningStock = {};
        originalItems.forEach(item => {
            runningStock[item.item_type] = item.total_quantity;
        });

        // 4. Aplikujeme všechny historické změny
        transfers.forEach(transfer => {
            ['kanoe', 'kanoe_rodinna', 'velky_raft', 'padlo', 
             'padlo_detske', 'vesta', 'vesta_detska', 'barel'].forEach(item => {
                if (transfer[item]) {
                    runningStock[item] = (runningStock[item] || 0) + 
                        (transfer.movement_type * Number(transfer[item]));
                }
            });
        });

        // 5. Aktualizujeme základní stav v databázi pro každou položku
        const updatePromises = Object.entries(runningStock).map(([itemType, quantity]) => 
            promisePool.query(
                `INSERT INTO inventory_items (warehouse_id, item_type, total_quantity) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE total_quantity = ?`,
                [warehouseId, itemType, quantity, quantity]
            )
        );

        await Promise.all(updatePromises);
        
        console.log(`Updated base stock for warehouse ${warehouseId}:`, runningStock);
        
        return runningStock;
    } catch (error) {
        console.error('Error updating base stock:', error);
        throw error;
    }
}

// Zabezpečení POUZE pro admin API endpointy (přesunout před ostatní routy)
const adminRoutes = express.Router();
adminRoutes.use(verifyToken);

// Upravíme admin endpoint pro výpis objednávek
adminRoutes.get('/list', async (req, res) => {
    try {
        console.log('Načítání seznamu objednávek...');
        
        const [rows] = await promisePool.query(`
            SELECT * FROM orders 
            ORDER BY created_at DESC
        `);
        
        console.log(`Načteno ${rows.length} objednávek`);
        
        res.json(rows);
    } catch (error) {
        console.error('Chyba při načítání objednávek:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Chyba při načítání dat z databáze: ' + error.message 
        });
    }
});

// Ostatní admin routy
adminRoutes.get('/:id', async (req, res) => {
    try {
        console.log('Loading order detail:', req.params.id);
        
        const [rows] = await promisePool.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );
        
        console.log('Found data:', rows);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error loading order detail:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error',
            error: error.message 
        });
    }
});

adminRoutes.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Nová', 'Potvrzená', 'Dokončená', 'Zrušená'];
        
        console.log('Přijatý status:', status); // Pro debugging

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: `Neplatný status. Povolené hodnoty: ${validStatuses.join(', ')}` 
            });
        }

        const [result] = await promisePool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Objednávka nenalezena' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Status byl úspěšně aktualizován'
        });
    } catch (error) {
        console.error('Chyba při aktualizaci statusu:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Databázová chyba: ' + error.message 
        });
    }
});

adminRoutes.delete('/:id', async (req, res) => {
    try {
        const [result] = await promisePool.query(
            'DELETE FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Order deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error' 
        });
    }
});

// Přidáme nový endpoint pro editaci objednávky
adminRoutes.put('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const updateData = req.body;

        // Validace dat
        const requiredFields = ['name', 'email', 'phone', 'arrival_date', 'arrival_time', 
                              'pickup_location', 'departure_date', 'departure_time', 'return_location'];
        
        for (const field of requiredFields) {
            if (!updateData[field]) {
                throw new Error(`Chybí povinné pole: ${field}`);
            }
        }

        const [result] = await promisePool.query(
            'UPDATE orders SET ? WHERE id = ?',
            [updateData, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Objednávka nenalezena'
            });
        }

        res.json({
            success: true,
            message: 'Objednávka byla úspěšně aktualizována'
        });
    } catch (error) {
        console.error('Chyba při aktualizaci objednávky:', error);
        res.status(400).json({
            success: false,
            message: `Chyba při aktualizaci objednávky: ${error.message}`
        });
    }
});

// Přidáme endpoint pro získání stavu skladů
adminRoutes.get('/inventory/:date', async (req, res) => {
    try {
        const date = req.params.date;
        
        // Nejprve načteme všechny sklady
        const [warehouses] = await promisePool.query('SELECT * FROM warehouses');
        
        // Pro každý sklad spočítáme aktuální stav
        const inventoryPromises = warehouses.map(async (warehouse) => {
            // Načteme základní stav skladu
            const [items] = await promisePool.query(
                'SELECT item_type, total_quantity FROM inventory_items WHERE warehouse_id = ?',
                [warehouse.id]
            );
            
            // Načteme všechny výpůjčky pro tento den
            const [orders] = await promisePool.query(`
                SELECT * FROM orders 
                WHERE (arrival_date <= ? AND departure_date >= ?)
                AND (pickup_location = ? OR return_location = ?)
            `, [date, date, warehouse.location, warehouse.location]);
            
            // Spočítáme aktuální stav
            const currentStock = calculateCurrentStock(items, orders, warehouse.location, date);
            
            return {
                ...warehouse,
                items: currentStock
            };
        });
        
        const inventoryData = await Promise.all(inventoryPromises);
        res.json(inventoryData);
    } catch (error) {
        console.error('Chyba při načítání stavu skladů:', error);
        res.status(500).json({
            success: false,
            message: 'Chyba při načítání dat skladů: ' + error.message
        });
    }
});

// Pomocná funkce pro výpočet aktuálního stavu
function calculateCurrentStock(baseItems, orders, location, date) {
    const stock = {};
    
    // Inicializace základního stavu
    baseItems.forEach(item => {
        stock[item.item_type] = item.total_quantity;
    });
    
    // Započítání půjčeného a vráceného materiálu
    orders.forEach(order => {
        const itemTypes = [
            'kanoe', 'kanoe_rodinna', 'velky_raft', 
            'padlo', 'padlo_detske', 'vesta', 
            'vesta_detska', 'barel'
        ];
        
        itemTypes.forEach(type => {
            if (order[type]) {
                if (order.pickup_location === location) {
                    // Odečteme půjčený materiál
                    stock[type] = (stock[type] || 0) - order[type];
                }
                if (order.return_location === location) {
                    // Přičteme vrácený materiál
                    stock[type] = (stock[type] || 0) + order[type];
                }
            }
        });
    });
    
    return stock;
}

// Připojíme admin routy pod /api/orders
app.use('/api/orders', adminRoutes);

// Přidat nový endpoint pro aktualizaci množství
app.put('/api/inventory/update', verifyToken, async (req, res) => {
    try {
        const { warehouseId, itemType, quantity } = req.body;
        
        console.log('Updating inventory:', { warehouseId, itemType, quantity });

        if (quantity < 0) {
            throw new Error('Množství nemůže být záporné');
        }

        // Nejprve zkontrolujeme, zda položka existuje
        const [existing] = await promisePool.query(
            'SELECT id FROM inventory_items WHERE warehouse_id = ? AND item_type = ?',
            [warehouseId, itemType]
        );

        let result;
        if (existing.length === 0) {
            // Pokud položka neexistuje, vytvoříme ji
            [result] = await promisePool.query(
                'INSERT INTO inventory_items (warehouse_id, item_type, total_quantity) VALUES (?, ?, ?)',
                [warehouseId, itemType, quantity]
            );
        } else {
            // Pokud položka existuje, aktualizujeme ji
            [result] = await promisePool.query(
                'UPDATE inventory_items SET total_quantity = ? WHERE warehouse_id = ? AND item_type = ?',
                [quantity, warehouseId, itemType]
            );
        }

        if (result.affectedRows === 0) {
            throw new Error('Aktualizace se nezdařila');
        }

        // Načteme aktuální stav pro kontrolu
        const [updated] = await promisePool.query(
            'SELECT total_quantity FROM inventory_items WHERE warehouse_id = ? AND item_type = ?',
            [warehouseId, itemType]
        );

        console.log('Updated inventory:', updated[0]);

        res.json({
            success: true,
            message: 'Množství bylo úspěšně aktualizováno',
            currentQuantity: updated[0].total_quantity
        });
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(400).json({
            success: false,
            message: 'Chyba při aktualizaci: ' + error.message
        });
    }
});

// Ostatní routy...
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'domu.html'));
});

app.post('/submit', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).send('Chybí povinné údaje');
  }

  try {
    await promisePool.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
    res.send('Data byla úspěšně uložena');
  } catch (error) {
    console.error('Chyba při ukládání:', error);
    res.status(500).send('Chyba při ukládání dat do databáze');
  }
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Chyba při načítání uživatelů:', error);
    res.status(500).send('Chyba při načítání dat z databáze');
  }
});

// Směrování pro admin stránku
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Přidáme konstanty pro typy položek
const ITEM_TYPES = [
    'kanoe', 'kanoe_rodinna', 'velky_raft', 'padlo', 
    'padlo_detske', 'vesta', 'vesta_detska', 'barel'
];

// Pomocná funkce pro vytvoření prázdného stavu skladu
function createEmptyStock() {
    return ITEM_TYPES.reduce((acc, type) => {
        acc[type] = 0;
        return acc;
    }, {});
}

// Upravený endpoint pro inventář
app.get('/api/inventory/:date', async (req, res) => {
    try {
        if (!req.params.date) {
            throw new Error('Datum je povinné');
        }

        const selectedDate = req.params.date;
        console.log('Loading inventory for date:', selectedDate);

        const [warehouses] = await promisePool.query('SELECT * FROM warehouses');
        if (!warehouses || warehouses.length === 0) {
            throw new Error('Nebyly nalezeny žádné sklady');
        }

        const inventoryData = await Promise.all(warehouses.map(async (warehouse) => {
            try {
                const baseStock = createEmptyStock();
                const currentStock = createEmptyStock();

                const [baseItems] = await promisePool.query(
                    `SELECT item_type, base_quantity FROM inventory_items WHERE warehouse_id = ?`,
                    [warehouse.id]
                );
                console.log(`Base items for warehouse ${warehouse.id}:`, baseItems);
                baseItems.forEach(item => {
                    if (item && item.item_type) {
                        const quantity = parseQuantity(item.base_quantity);
                        baseStock[item.item_type] = quantity;
                        currentStock[item.item_type] = quantity;
                    }
                });

                const [movements] = await promisePool.query(
                    `SELECT * FROM orders 
                     WHERE ((pickup_location = ? AND arrival_date <= ?) OR 
                     (return_location = ? AND departure_date <= ?))
                     AND status != 'Zrušená'`,
                    [warehouse.location, selectedDate, warehouse.location, selectedDate]
                );
                console.log(`Movements for warehouse ${warehouse.id}:`, movements.length);

                const previousMovements = movements.filter(m =>
                    (m.pickup_location === warehouse.location && m.arrival_date < selectedDate) ||
                    (m.return_location === warehouse.location && m.departure_date < selectedDate)
                );
                const todayMovements = movements.filter(m =>
                    (m.pickup_location === warehouse.location && m.arrival_date === selectedDate) ||
                    (m.return_location === warehouse.location && m.departure_date === selectedDate)
                );

                previousMovements.forEach(movement => {
                    ITEM_TYPES.forEach(type => {
                        // Použijeme operátor ?? k zajištění číselné hodnoty
                        const quantity = parseQuantity(movement[type] ?? 0);
                        if (quantity > 0) {
                            if (movement.pickup_location === warehouse.location) {
                                currentStock[type] -= quantity;
                            } else {
                                currentStock[type] += quantity;
                            }
                        }
                    });
                });

                const dailyPlan = {
                    departures: todayMovements
                        .filter(m => m.pickup_location === warehouse.location)
                        .map(m => ({
                            id: m.id,
                            name: m.name,
                            time: m.arrival_time,
                            items: ITEM_TYPES.reduce((acc, type) => {
                                acc[type] = parseQuantity(m[type] ?? 0);
                                return acc;
                            }, {})
                        })),
                    returns: todayMovements
                        .filter(m => m.return_location === warehouse.location)
                        .map(m => ({
                            id: m.id,
                            name: m.name,
                            time: m.departure_time,
                            items: ITEM_TYPES.reduce((acc, type) => {
                                acc[type] = parseQuantity(m[type] ?? 0);
                                return acc;
                            }, {})
                        }))
                };

                return {
                    id: warehouse.id,
                    name: warehouse.name,
                    location: warehouse.location,
                    items: baseStock || {},
                    baseStock: baseStock || {},
                    currentStock: currentStock || {},
                    dailyPlan
                };

            } catch (error) {
                console.error(`Error processing warehouse ${warehouse.id}:`, error);
                return {
                    id: warehouse.id,
                    name: warehouse.name || 'Chyba skladu',
                    location: warehouse.location,
                    baseStock: createEmptyStock(),
                    currentStock: createEmptyStock(),
                    dailyPlan: { departures: [], returns: [] },
                    error: error.message
                };
            }
        }));

        console.log('Sending inventory data:', inventoryData);
        res.json(inventoryData);

    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Chyba při načítání dat skladů: ' + error.message
        });
    }
});

/* ...rest of the code... */
