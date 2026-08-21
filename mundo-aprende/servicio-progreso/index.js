/* =========================================================
   SERVICIO DE PROGRESO
   Responsabilidad única: guardar y consultar resultados de partidas.
========================================================= 
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





  */





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
  // NUEVO: cuántos segundos tardó el alumno en esa actividad.
  // Si la tabla ya existía de antes, esto la actualiza sin borrar datos.
  await pool.query(`
    ALTER TABLE progreso ADD COLUMN IF NOT EXISTS duracion_segundos INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('Tabla "progreso" lista');
}

// -----------------------------------------------------------------------
// MÓDULO DE INDICADORES
// Traduce cada actividad del juego a un "curso" del currículo, para
// poder calcular el indicador de notas bimestrales por área.
const CURSOS = {
  suma: 'Matemática', resta: 'Matemática', contar: 'Matemática', comparar: 'Matemática',
  completa: 'Comunicación', vocales: 'Comunicación', silabas: 'Comunicación',
  pronuncia: 'Comunicación', sopa: 'Comunicación',
  colores: 'Arte', formas: 'Arte',
  ingles: 'Inglés',
};
// Debe coincidir con la cantidad de actividades en servicio-contenido/datos.js (ACTIVITIES.length)
const TOTAL_ACTIVIDADES_DISPONIBLES = 12;

// Calcula los 5 indicadores de la matriz de la tesis para UN alumno.
async function calcularIndicadores(nombre) {
  // 1) %AT = Tiempo Atención / Tiempo Total x 100  (del día de hoy)
  const sesion = await pool.query(
    `SELECT COALESCE(SUM(tiempo_total_segundos),0) AS tiempo_total
     FROM sesiones WHERE nombre = $1 AND fecha = CURRENT_DATE`,
    [nombre]
  );
  const atencion = await pool.query(
    `SELECT COALESCE(SUM(duracion_segundos),0) AS tiempo_atencion
     FROM progreso WHERE nombre = $1 AND fecha::date = CURRENT_DATE`,
    [nombre]
  );
  const tiempoTotal = Number(sesion.rows[0].tiempo_total);
  const tiempoAtencion = Number(atencion.rows[0].tiempo_atencion);
  const porcentajeAtencion = tiempoTotal > 0
    ? Number(((tiempoAtencion / tiempoTotal) * 100).toFixed(2))
    : null;

  // 2) %ACTIVIDADES = Participaciones (actividades distintas) / Actividades Totales x 100
  const distintas = await pool.query(
    `SELECT COUNT(DISTINCT actividad) AS n FROM progreso WHERE nombre = $1`,
    [nombre]
  );
  const porcentajeActividades =
    (Number(distintas.rows[0].n) / TOTAL_ACTIVIDADES_DISPONIBLES) * 100;

  // 3) NOTA = promedio de notas (0-20) agrupadas por "curso"
  const filas = await pool.query(
    `SELECT actividad, puntaje, total FROM progreso WHERE nombre = $1`,
    [nombre]
  );
  const sumaPorCurso = {};
  const cantPorCurso = {};
  for (const fila of filas.rows) {
    const curso = CURSOS[fila.actividad] || 'Otros';
    const nota20 = fila.total > 0 ? (fila.puntaje / fila.total) * 20 : 0;
    sumaPorCurso[curso] = (sumaPorCurso[curso] || 0) + nota20;
    cantPorCurso[curso] = (cantPorCurso[curso] || 0) + 1;
  }
  const notasPorCurso = Object.keys(sumaPorCurso).map(curso => ({
    curso,
    nota: Number((sumaPorCurso[curso] / cantPorCurso[curso]).toFixed(1)),
  }));
  const promedioBimestral = notasPorCurso.length
    ? Number((notasPorCurso.reduce((a, c) => a + c.nota, 0) / notasPorCurso.length).toFixed(1))
    : null;

  // 4) VOCABULARIO = Palabras Correctas / Total Minutos (solo actividad "pronuncia")
  const pronuncia = await pool.query(
    `SELECT COALESCE(SUM(puntaje),0) AS correctas, COALESCE(SUM(duracion_segundos),0) AS segundos
     FROM progreso WHERE nombre = $1 AND actividad = 'pronuncia'`,
    [nombre]
  );
  const minutosPronuncia = Number(pronuncia.rows[0].segundos) / 60;
  const vocabulario = minutosPronuncia > 0
    ? Number((Number(pronuncia.rows[0].correctas) / minutosPronuncia).toFixed(0))
    : null;

  // 5) NIVEL RAZONAMIENTO = Suma de Puntos (escala 1-5) / Total Actividad Semanal
  //    Cada partida se convierte a una escala de 1 a 5 según su % de aciertos,
  //    y se agrupa por semana calendario.
  const semanal = await pool.query(
    `SELECT date_trunc('week', fecha) AS semana,
            AVG(CASE WHEN total > 0 THEN GREATEST(1, CEIL((puntaje::float / total) * 5)) ELSE 1 END) AS nivel
     FROM progreso WHERE nombre = $1
     GROUP BY semana ORDER BY semana DESC LIMIT 1`,
    [nombre]
  );
  const nivelRazonamiento = semanal.rows.length
    ? Number(Number(semanal.rows[0].nivel).toFixed(1))
    : null;

  return {
    nombre,
    tiempoAtencion: { valor: porcentajeAtencion, unidad: '%' },
    participacionActividades: { valor: Number(porcentajeActividades.toFixed(1)), unidad: '%' },
    promedioNotasBimestrales: { valor: promedioBimestral, unidad: '/20', porCurso: notasPorCurso },
    pronunciacionLectura: { valor: vocabulario, unidad: 'palabras/min' },
    lecturaRazonamiento: { valor: nivelRazonamiento, unidad: '/5 (última semana)' },
  };
}

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'progreso' }));

// Guarda el resultado de una partida (se llama al terminar cada actividad)
app.post('/api/progreso', async (req, res) => {
  try {
    const { nombre, actividad, puntaje, total, duracion } = req.body;
    if (!nombre || !actividad || puntaje == null || total == null) {
      return res.status(400).json({ error: 'Faltan datos: nombre, actividad, puntaje, total' });
    }
    const duracionSegundos = Math.max(0, Number(duracion) || 0);
    const result = await pool.query(
      `INSERT INTO progreso (nombre, actividad, puntaje, total, duracion_segundos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, actividad, puntaje, total, duracion_segundos, fecha`,
      [nombre, actividad, puntaje, total, duracionSegundos]
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

// Indicadores de UN alumno (matriz de la tesis)
app.get('/api/indicadores/:nombre', async (req, res) => {
  try {
    const datos = await calcularIndicadores(req.params.nombre);
    res.json(datos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular los indicadores' });
  }
});

// Indicadores de TODOS los alumnos que tienen progreso (para el dashboard docente)
app.get('/api/indicadores', async (req, res) => {
  try {
    const alumnos = await pool.query(`SELECT DISTINCT nombre FROM progreso ORDER BY nombre ASC`);
    const resultados = [];
    for (const fila of alumnos.rows) {
      resultados.push(await calcularIndicadores(fila.nombre));
    }
    res.json(resultados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular los indicadores' });
  }
});

const PORT = process.env.PORT || 3003;
initDB()
  .then(() => app.listen(PORT, () => console.log(`Servicio de progreso escuchando en puerto ${PORT}`)))
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });