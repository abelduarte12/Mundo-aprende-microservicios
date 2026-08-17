/* =========================================================
   SERVICIO DE USUARIOS
   Responsabilidad única: login por nombre y conteo de estrellas.
========================================================= 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos Postgres (ej: Supabase, Render, ElephantSQL...)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT UNIQUE NOT NULL,
      estrellas INTEGER NOT NULL DEFAULT 0,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Tabla "usuarios" lista');
}

// Health check: útil para saber si el servicio está vivo (Render lo usa para "despertar")
app.get('/health', (req, res) => res.json({ ok: true, servicio: 'usuarios' }));

// Login simple: si el nombre no existe lo crea, si existe devuelve sus estrellas actuales
app.post('/api/usuarios/login', async (req, res) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    if (nombre.length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 letras' });
    }
    const result = await pool.query(
      `INSERT INTO usuarios (nombre) VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING nombre, estrellas`,
      [nombre]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Suma (o resta) estrellas a un usuario ya existente
app.post('/api/usuarios/:nombre/estrellas', async (req, res) => {
  try {
    const cantidad = Number(req.body.cantidad) || 0;
    const result = await pool.query(
      `UPDATE usuarios SET estrellas = estrellas + $1
       WHERE nombre = $2
       RETURNING nombre, estrellas`,
      [cantidad, req.params.nombre]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al sumar estrellas' });
  }
});

// Consultar un usuario (por si el frontend necesita refrescar el dato)
app.get('/api/usuarios/:nombre', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT nombre, estrellas FROM usuarios WHERE nombre = $1',
      [req.params.nombre]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar usuario' });
  }
});
// -----------------------------------------------------------------------
// Lista de todos los alumnos registrados (para el dashboard del profesor)
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT nombre, estrellas, creado_en FROM usuarios ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});
//----------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
initDB()
  .then(() => app.listen(PORT, () => console.log(`Servicio de usuarios escuchando en puerto ${PORT}`)))
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });


  */



/* =========================================================
   SERVICIO DE USUARIOS
   Responsabilidad única: login por nombre y conteo de estrellas.
========================================================= */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos Postgres (ej: Supabase, Render, ElephantSQL...)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT UNIQUE NOT NULL,
      estrellas INTEGER NOT NULL DEFAULT 0,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Tabla "usuarios" lista');

  // NUEVO: guarda cuántos segundos estuvo conectado cada alumno cada día.
  // Junto con "progreso.duracion_segundos" permite calcular el indicador
  // %AT = (Tiempo Atención / Tiempo Total) x 100
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sesiones (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      tiempo_total_segundos INTEGER NOT NULL DEFAULT 0,
      UNIQUE (nombre, fecha)
    );
  `);
  console.log('Tabla "sesiones" lista');
}

// Health check: útil para saber si el servicio está vivo (Render lo usa para "despertar")
app.get('/health', (req, res) => res.json({ ok: true, servicio: 'usuarios' }));

// Login simple: si el nombre no existe lo crea, si existe devuelve sus estrellas actuales
app.post('/api/usuarios/login', async (req, res) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    if (nombre.length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 letras' });
    }
    const result = await pool.query(
      `INSERT INTO usuarios (nombre) VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING nombre, estrellas`,
      [nombre]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Suma (o resta) estrellas a un usuario ya existente
app.post('/api/usuarios/:nombre/estrellas', async (req, res) => {
  try {
    const cantidad = Number(req.body.cantidad) || 0;
    const result = await pool.query(
      `UPDATE usuarios SET estrellas = estrellas + $1
       WHERE nombre = $2
       RETURNING nombre, estrellas`,
      [cantidad, req.params.nombre]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al sumar estrellas' });
  }
});

// Consultar un usuario (por si el frontend necesita refrescar el dato)
app.get('/api/usuarios/:nombre', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT nombre, estrellas FROM usuarios WHERE nombre = $1',
      [req.params.nombre]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar usuario' });
  }
});
// NUEVO: el frontend llama esto tras cada actividad con el total de
// segundos transcurridos desde el login (Date.now() - loginTime).
// Guarda siempre el valor más alto del día, así no importa el orden
// en que lleguen las peticiones.
app.post('/api/usuarios/:nombre/sesion', async (req, res) => {
  try {
    const segundos = Math.max(0, Number(req.body.segundos) || 0);
    const result = await pool.query(
      `INSERT INTO sesiones (nombre, fecha, tiempo_total_segundos)
       VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (nombre, fecha)
       DO UPDATE SET tiempo_total_segundos = GREATEST(sesiones.tiempo_total_segundos, EXCLUDED.tiempo_total_segundos)
       RETURNING nombre, fecha, tiempo_total_segundos`,
      [req.params.nombre, segundos]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la sesión' });
  }
});

// -----------------------------------------------------------------------
// Lista de todos los alumnos registrados (para el dashboard del profesor)
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT nombre, estrellas, creado_en FROM usuarios ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});
//----------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
initDB()
  .then(() => app.listen(PORT, () => console.log(`Servicio de usuarios escuchando en puerto ${PORT}`)))
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });








