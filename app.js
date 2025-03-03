const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Vytvoření connection poolu místo jednoho připojení
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'berounka',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
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

// Routy
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

app.post('/api/orders', async (req, res) => {
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

    // Příprava dat pro vložení
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
      order_note: req.body.order_note || ''
    };

    console.log('Upravená data pro databázi:', orderData);

    const [result] = await promisePool.query(
      'INSERT INTO orders SET ?',
      orderData
    );

    console.log('Výsledek insertu:', result);

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

app.get('/users', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Chyba při načítání uživatelů:', error);
    res.status(500).send('Chyba při načítání dat z databáze');
  }
});

// Přidat nový endpoint pro získání všech objednávek
app.get('/api/orders', async (req, res) => {
  try {
    // Zkontrolujeme připojení k databázi
    await promisePool.query('SELECT 1');
    
    const [rows] = await promisePool.query(`
      SELECT id, created_at, name, email, phone, 
             arrival_date, arrival_time, departure_date, departure_time, 
             status 
      FROM orders 
      ORDER BY created_at DESC
    `);
    
    console.log('Načtené objednávky:', rows); // Pro debugging
    res.json(rows);
  } catch (error) {
    console.error('Detailní chyba při načítání objednávek:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Chyba při načítání objednávek z databáze',
      error: error.message
    });
  }
});

// Přidáme základní autentizaci pro admin sekci
app.get('/admin.html', (req, res, next) => {
  const auth = {login: 'admin', password: 'berounka123'};
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Admin sekce"');
  res.status(401).send('Přístup zamítnut');
});
