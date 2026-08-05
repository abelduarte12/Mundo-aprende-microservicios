/* =========================================================
   SERVICIO DE PROGRESO
   Responsabilidad única: guardar y consultar resultados de partidas.
========================================================= */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS progreso (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      actividad TEXT NOT NULL,
      puntaje INTEGER NOT NULL,
      total INTEGER NOT NULL,
      fecha TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Tabla "progreso" lista');
}

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'progreso' }));

// Guarda el resultado de una partida (se llama al terminar cada actividad)
app.post('/api/progreso', async (req, res) => {
  try {
    const { nombre, actividad, puntaje, total } = req.body;
    if (!nombre || !actividad || puntaje == null || total == null) {
      return res.status(400).json({ error: 'Faltan datos: nombre, actividad, puntaje, total' });
    }
    const result = await pool.query(
      `INSERT INTO progreso (nombre, actividad, puntaje, total)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, actividad, puntaje, total, fecha`,
      [nombre, actividad, puntaje, total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el progreso' });
  }
});

// Historial de un alumno (útil para que el profesor vea su avance)
app.get('/api/progreso/:nombre', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT actividad, puntaje, total, fecha
       FROM progreso WHERE nombre = $1
       ORDER BY fecha DESC LIMIT 50`,
      [req.params.nombre]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar el progreso' });
  }
});

const PORT = process.env.PORT || 3003;
initDB()
  .then(() => app.listen(PORT, () => console.log(`Servicio de progreso escuchando en puerto ${PORT}`)))
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });
