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
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'berounka',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
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

// Upravíme spuštění serveru, aby počkalo na inicializaci databáze
async function startServer() {
  try {
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

// Připojíme admin routy pod /api/orders
app.use('/api/orders', adminRoutes);

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
