/* =========================================================
   SERVICIO DE CONTENIDO
   Responsabilidad única: entregar las actividades y los
   bancos de palabras del juego. No tiene base de datos
   porque su contenido es fijo (no cambia por usuario).
========================================================= */
const express = require('express');
const cors = require('cors');
const datos = require('./datos');

const app = express();
app.use(cors());

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'contenido' }));

app.get('/api/contenido/actividades', (req, res) => {
  res.json(datos.ACTIVITIES);
});

app.get('/api/contenido/completa', (req, res) => {
  res.json(datos.COMPLETA_WORDS);
});

app.get('/api/contenido/vocales', (req, res) => {
  res.json({ intro: datos.VOWEL_INTRO, palabras: datos.VOWEL_WORDS });
});

app.get('/api/contenido/silabas', (req, res) => {
  res.json({ palabras: datos.SILABA_WORDS, pool: datos.SILABA_POOL });
});

app.get('/api/contenido/sopa', (req, res) => {
  res.json({
    pool: datos.SOPA_WORD_POOL,
    categorias: datos.SOPA_CATEGORIES,
    tamano: datos.SOPA_SIZE,
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Servicio de contenido escuchando en puerto ${PORT}`));
