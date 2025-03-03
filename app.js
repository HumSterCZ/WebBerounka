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

// Inicializace databáze
async function initDatabase() {
  try {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `);
    console.log('Databáze úspěšně inicializována');
  } catch (err) {
    console.error('Chyba při inicializaci databáze:', err);
  }
}

// Spustíme inicializaci při startu
initDatabase();

// Routy
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Spuštění serveru
app.listen(port, () => {
  console.log(`Aplikace běží na http://localhost:${port}`);
});
