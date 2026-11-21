/* =========================================================
   STATE
========================================================= */
const state = {
  name: '',
  totalStars: 0,
  activity: null,
  qIndex: 0,
  score: 0,
  questions: [],
  answered: false,
  loginTime: null,      // NUEVO: para calcular el indicador %AT
  activityStart: null,  // NUEVO: duración de cada actividad
  nivel: 1,             // IA: nivel actual de la actividad
  respuestas: [],       // IA: detalle de cada respuesta de la ronda
  qStart: null,         // IA: momento en que se mostró la pregunta
};

const app = document.getElementById('app');
const topbarMount = document.getElementById('topbar-mount');

/* =========================================================
   API — llamadas a los 3 microservicios (ver config.js)
========================================================= */
async function apiLogin(nombre) {
  const res = await fetch(`${API_CONFIG.USUARIOS}/api/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  });
  if (!res.ok) throw new Error('No se pudo iniciar sesión');
  return res.json();
}

// "Dispara y olvida": no bloqueamos el juego si el servicio de usuarios
// está lento o dormido (los servicios gratis en la nube tardan en despertar).
function sumarEstrellas(cantidad) {
  state.totalStars += cantidad;
  fetch(`${API_CONFIG.USUARIOS}/api/usuarios/${encodeURIComponent(state.name)}/estrellas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad }),
  }).catch(err => console.warn('No se pudo guardar la estrella en el servidor:', err));
}

function guardarProgreso(actividad, puntaje, total) {
  // Duración de ESTA actividad (segundos desde que se abrió con startActivity)
  const duracion = state.activityStart
    ? Math.round((Date.now() - state.activityStart) / 1000)
    : 0;

  fetch(`${API_CONFIG.PROGRESO}/api/progreso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: state.name, actividad, puntaje, total, duracion }),
  }).catch(err => console.warn('No se pudo guardar el progreso en el servidor:', err));

  // NUEVO: avisa cuánto tiempo total lleva conectado el alumno hoy
  // (se usa para el indicador %AT). Es "dispara y olvida", no bloquea el juego.
  if (state.loginTime) {
    const segundosSesion = Math.round((Date.now() - state.loginTime) / 1000);
    fetch(`${API_CONFIG.USUARIOS}/api/usuarios/${encodeURIComponent(state.name)}/sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segundos: segundosSesion }),
    }).catch(err => console.warn('No se pudo guardar la sesión en el servidor:', err));
  }
}

let CONTENIDO_LISTO = false;

async function cargarContenido() {
  const [actividades, completa, vocales, silabas, sopa, pronuncia, extra] = await Promise.all([
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/actividades`).then(r => r.json()),
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/completa`).then(r => r.json()),
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/vocales`).then(r => r.json()),
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/silabas`).then(r => r.json()),
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/sopa`).then(r => r.json()),
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/pronuncia`).then(r => r.json()),
    fetch(`${API_CONFIG.CONTENIDO}/api/contenido/extra`).then(r => r.json()),
  ]);
  ACTIVITIES = actividades.map(a => ({
    ...a,
    c1: `var(--${a.theme}-a)`,
    c2: `var(--${a.theme}-b)`,
  }));
  COMPLETA_WORDS = completa;
  VOWEL_INTRO = vocales.intro;
  VOWEL_WORDS = vocales.palabras;
  SILABA_WORDS = silabas.palabras;
  SILABA_POOL = silabas.pool;
  SOPA_WORD_POOL = sopa.pool;
  SOPA_CATEGORIES = sopa.categorias;
  SOPA_SIZE = sopa.tamano;
  PRONUNCIA_WORDS = pronuncia;
  COLOR_WORDS = extra.colores;
  ENGLISH_WORDS = extra.ingles;
  SHAPE_WORDS = extra.formas;
  CONTENIDO_LISTO = true;
}

/* =========================================================
   HELPERS
========================================================= */
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function setBodyTheme(theme){
  document.body.className = 'theme-' + theme;
}
function initials(name){
  return (name.trim()[0] || '?').toUpperCase();
}
function emojiGroup(count, emoji){
  let s = '<span class="emoji-group">';
  for(let i=0;i<count;i++) s += `<span>${emoji}</span>`;
  s += '</span>';
  return s;
}
function confettiBurst(container){
  const emojis = ['✨','🎉','⭐','🌟'];
  const pop = document.createElement('div');
  pop.className = 'confetti-pop';
  for(let i=0;i<8;i++){
    const s = document.createElement('span');
    s.textContent = emojis[randInt(0,emojis.length-1)];
    const angle = (Math.PI*2*i)/8;
    s.style.setProperty('--dx', (Math.cos(angle)*70)+'px');
    s.style.setProperty('--dy', (Math.sin(angle)*70)+'px');
    pop.appendChild(s);
  }
  container.appendChild(pop);
  setTimeout(()=>pop.remove(), 850);
}

/* =========================================================
   TOPBAR
========================================================= */
function renderTopbar(mode){ // mode: 'none' | 'menu' | 'activity'
  if(mode === 'none'){ topbarMount.innerHTML=''; return; }
  const backHTML = mode === 'activity'
    ? `<button class="back-btn" onclick="goToMenu()">← Volver al menú</button>`
    : `<span></span>`;
  topbarMount.innerHTML = `
    <div class="topbar">
      ${backHTML}
      <div class="brand">🌈 Mundo Aprende</div>
      <div class="user-chip">
        <div class="avatar">${initials(state.name)}</div>
        <div>
          <div>${state.name}</div>
          <div class="stars">⭐ ${state.totalStars} estrellas</div>
        </div>
      </div>
    </div>`;
}

function renderFloaters(active){
  const el = document.getElementById('floaters');
  if(!active){ el.innerHTML=''; return; }
  const items = ['⭐','✨','🎈','🌟','☁️','🎨','📘','🔢'];
  let html = '';
  items.forEach((ic,i)=>{
    const top = randInt(2,90);
    const left = randInt(2,92);
    const delay = randInt(0,6);
    const dur = randInt(10,18);
    html += `<span style="top:${top}%; left:${left}%; animation-delay:${delay}s; animation-duration:${dur}s;">${ic}</span>`;
  });
  el.innerHTML = html;
}

/* =========================================================
   LOGIN
========================================================= */
function showLogin(){
  setBodyTheme('login');
  renderFloaters(true);
  renderTopbar('none');
  app.innerHTML = `
    <div class="login-wrap">
      <div class="login-mascot">📚</div>
      <h1 class="login-title">¡Bienvenido a Mundo Aprende!</h1>
      <p class="login-sub">Un lugar mágico para jugar y aprender</p>
      <div class="login-card">
        <label for="nameInput">¿Cómo te llamas?</label>
        <input id="nameInput" type="text" placeholder="Escribe tu nombre" maxlength="18" autocomplete="off" />
        <div class="login-hint" id="loginHint"></div>
        <button class="btn-go" id="goBtn">Ingresar 🚀</button>
      </div>
    </div>
  `;
  const input = document.getElementById('nameInput');
  const hint = document.getElementById('loginHint');
  const go = document.getElementById('goBtn');
  input.focus();
  async function tryEnter(){
    const val = input.value.trim();
    if(val.length < 2){
      hint.textContent = 'Escribe tu nombre para continuar (mínimo 2 letras)';
      return;
    }
    go.disabled = true;
    hint.textContent = 'Ingresando...';
    try{
      const usuario = await apiLogin(val);
      state.name = usuario.nombre;
      state.totalStars = usuario.estrellas;
      state.loginTime = Date.now(); // NUEVO: inicio de sesión, para %AT
      goToMenu();
    } catch(err){
      console.error(err);
      hint.textContent = 'No se pudo conectar con el servicio de usuarios. Intenta de nuevo.';
      go.disabled = false;
    }
  }
  go.addEventListener('click', tryEnter);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') tryEnter(); });
}

/* =========================================================
   MENU
========================================================= */
// ACTIVITIES ahora se carga desde el servicio de contenido (ver cargarContenido()).
let ACTIVITIES = [];

function goToMenu(){
  setBodyTheme('menu');
  renderFloaters(true);
  renderTopbar('menu');
  const cards = ACTIVITIES.map(a => `
    <div class="activity-card" style="--c1:${a.c1};--c2:${a.c2}" onclick="startActivity('${a.id}')">
      <div class="icon">${a.icon}</div>
      <div class="eyebrow">Actividad</div>
      <h3>${a.title}</h3>
      <p>${a.desc}</p>
      <span class="tag">${a.tag}</span>
    </div>
  `).join('');

  // NUEVO: tarjeta de Indicadores, con el mismo estilo que las de actividad
  const cardIndicadores = `
    <div class="activity-card" style="--c1:var(--menu-a);--c2:var(--menu-b)" onclick="verIndicadores()">
      <div class="icon">📊</div>
      <div class="eyebrow">Mi avance</div>
      <h3>Indicadores</h3>
      <p>Revisa tus resultados: tiempo, participación, notas y más</p>
      <span class="tag">Resumen personal</span>
    </div>
  `;

  app.innerHTML = `
    <div class="menu-head">
      <div class="menu-badge">🌟</div>
      <h2 class="menu-title">¡Hola, ${state.name}!</h2>
      <p class="menu-sub">Elige una actividad para empezar a jugar</p>
    </div>
    <div class="menu-grid">${cards}${cardIndicadores}</div>
  `;
}

/* =========================================================
   INDICADORES (matriz de la tesis)
========================================================= */
async function verIndicadores(){
  setBodyTheme('menu');
  renderFloaters(true);
  renderTopbar('menu');
  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="card result-card" id="indicadoresCard">
        <div style="font-size:2.6rem;">📊</div>
        <h3 style="margin:6px 0 18px;">Mis indicadores</h3>
        <p class="result-msg">Cargando tus resultados...</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch(`${API_CONFIG.PROGRESO}/api/indicadores/${encodeURIComponent(state.name)}`);
    if (!res.ok) throw new Error('Respuesta no válida');
    const d = await res.json();

    const filas = [
      ['⏱️', 'Tiempo de atención', d.tiempoAtencion.valor == null
        ? null
        : Number(d.tiempoAtencion.valor).toFixed(2), '%'],
      ['🎮', 'Participación en actividades', d.participacionActividades.valor, '%'],
      ['📚', 'Promedio de notas', d.promedioNotasBimestrales.valor, '/20'],
      ['🎤', 'Fluidez lectora', d.fluidezLectora.valor, ' palabras/min'],
      ['🧠', 'Nivel de razonamiento', d.lecturaRazonamiento.valor, '/5'],
    ];

    const filasHTML = filas.map(([icono, nombre, valor, unidad]) => `
      <div class="indicador-fila">
        <span class="indicador-icono">${icono}</span>
        <span class="indicador-nombre">${nombre}</span>
        <span class="indicador-valor">${valor == null ? 'Sin datos aún' : valor + unidad}</span>
      </div>
    `).join('');

    document.getElementById('indicadoresCard').innerHTML = `
      <div style="font-size:2.6rem;">📊</div>
      <h3 style="margin:6px 0 18px;">Indicadores de ${state.name}</h3>
      <div class="indicador-lista">${filasHTML}</div>
      <p class="result-msg" style="margin-top:18px; font-size:.8rem;">
        Los indicadores se actualizan cada vez que terminas una actividad.
      </p>
      <div class="result-actions">
        <button class="btn-ghost" onclick="goToMenu()">Volver al menú</button>
      </div>
    `;
  } catch (err) {
    console.warn('No se pudieron cargar los indicadores:', err);
    document.getElementById('indicadoresCard').innerHTML = `
      <div style="font-size:2.6rem;">📊</div>
      <h3 style="margin:6px 0 18px;">Mis indicadores</h3>
      <p class="result-msg">No se pudo conectar con el servicio de progreso. Intenta de nuevo más tarde.</p>
      <div class="result-actions">
        <button class="btn-ghost" onclick="goToMenu()">Volver al menú</button>
      </div>
    `;
  }
}

/* =========================================================
   GENERIC MCQ ENGINE (suma, resta, contar, completa, vocales-quiz)
========================================================= */
function numOptions(correct, min, max){
  const set = new Set([correct]);
  while(set.size < 4){
    set.add(randInt(min,max));
  }
  return shuffle(Array.from(set)).map(v => ({label:String(v), value:v}));
}

/* ====== SUMA ADAPTATIVA (IA con Claude) ====== */
function parSumaPorNivel(nivel){
  switch(nivel){
    case 1: return [randInt(1,3), randInt(1,3)];                 // 1+1, 2+2
    case 2: return [randInt(1,6), randInt(1,6)];                 // nivel original
    case 3: return [randInt(5,9), randInt(5,9)];                 // 7+8
    case 4: { const u = randInt(0,8);                            // 20+9, 31+5 (sin llevar)
              return [randInt(1,9)*10 + u, randInt(1, 9-u)]; }
    case 5: { const u = randInt(2,9);                            // 28+7 (con llevada)
              return [randInt(1,8)*10 + u, randInt(10-u, 9)]; }
    default: return [randInt(10,50), randInt(10,49)];            // nivel 6: 2 cifras + 2 cifras
  }
}
function genSuma(nivel = 2){
  const qs = [];
  for(let i=0;i<10;i++){
    const [a, b] = parSumaPorNivel(nivel);
    const sum = a+b;
    qs.push({
      eyebrow:`Suma · Nivel ${nivel}`,
      prompt:`${a} + ${b} = ?`,
      visual: nivel <= 3 ? `${emojiGroup(a,'🔵')} <span class="op">+</span> ${emojiGroup(b,'🔵')}` : '',
      options: numOptions(sum, Math.max(0,sum-5), sum+5),
      correct: sum,
    });
  }
  return qs;
}
async function iniciarSumaAdaptativa(){
  state.respuestas = [];
  try{
    const r = await fetch(`${API_CONFIG.IA}/api/ia/nivel/${encodeURIComponent(state.name)}/suma`);
    const d = await r.json();
    state.nivel = d.nivel || 1;
  }catch(e){ state.nivel = 1; }   // si el servicio está dormido o falla, empieza en nivel 1
  state.activityStart = Date.now(); // la duración empieza cuando ya se muestran las preguntas
  state.questions = genSuma(state.nivel);
  renderQuestionScreen();
}
async function evaluarConIA(actividad){
  try{
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), 9000);
    const res = await fetch(`${API_CONFIG.IA}/api/ia/evaluar`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nombre: state.name, actividad, respuestas: state.respuestas }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok ? await res.json() : null;
  }catch(e){ return null; }
}
function genResta(){
  const qs = [];
  for(let i=0;i<10;i++){
    const a = randInt(3,9), b = randInt(0,a);
    const diff = a-b;
    qs.push({
      eyebrow:'Resta',
      prompt:`${a} − ${b} = ?`,
      visual: `${emojiGroup(a,'🍎')} <span class="op">−</span> <span style="font-size:1.6rem;font-weight:800;">${b}</span>`,
      options: numOptions(diff, 0, a),
      correct: diff,
    });
  }
  return qs;
}

function genContar(){
  const pool = ['🎈','⭐','🍎','🚗','🐶','🍉','🌸','⚽'];
  const qs = [];
  for(let i=0;i<10;i++){
    const count = randInt(3,10);
    const emoji = pool[randInt(0,pool.length-1)];
    qs.push({
      eyebrow:'Contar',
      prompt:'¿Cuántos hay?',
      visual: emojiGroup(count, emoji),
      options: numOptions(count, Math.max(1,count-4), count+4),
      correct: count,
    });
  }
  return qs;
}

// COMPLETA_WORDS ahora se carga desde el servicio de contenido.
let COMPLETA_WORDS = [];
let COLOR_WORDS = [];
let ENGLISH_WORDS = [];
let SHAPE_WORDS = [];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function genCompleta(){
  return shuffle(COMPLETA_WORDS).map(item => {
    const letters = item.word.split('');
    const correctLetter = letters[item.blankIndex];
    const display = letters.map((l,i)=> i===item.blankIndex ? '_' : l).join('');
    const set = new Set([correctLetter]);
    while(set.size < 4) set.add(LETTERS[randInt(0,25)]);
    return {
      eyebrow:'Completa la palabra',
      prompt:`${display}`,
      visual: `<span class="activity-visual">${item.emoji}</span>`,
      options: shuffle(Array.from(set)).map(l => ({label:l, value:l})),
      correct: correctLetter,
    };
  });
}

// VOWEL_INTRO y VOWEL_WORDS ahora se cargan desde el servicio de contenido.
let VOWEL_INTRO = [];
let VOWEL_WORDS = [];
const VOWELS = ['A','E','I','O','U'];

function genVocalesQuiz(){
  return shuffle(VOWEL_WORDS).map(item=>{
    const letters = item.word.split('');
    const correctLetter = letters[item.blankIndex];
    const display = letters.map((l,i)=> i===item.blankIndex ? '_' : l).join('');
    return {
      eyebrow:'¿Qué vocal falta?',
      prompt:`${display}`,
      visual: `<span class="activity-visual">${item.emoji}</span>`,
      options: shuffle(VOWELS).map(v=>({label:v, value:v})),
      correct: correctLetter,
    };
  });
}

function genColores(){
  return shuffle(COLOR_WORDS).map(item => {
    const set = new Set([item.color]);
    while(set.size < 4) set.add(COLOR_WORDS[randInt(0,COLOR_WORDS.length-1)].color);
    return {
      eyebrow:'Colores',
      prompt:'¿De qué color es esto?',
      visual: `<span class="activity-visual activity-visual-large">${item.emoji}</span>`,
      options: shuffle(Array.from(set)).map(c => ({label:c, value:c})),
      correct: item.color,
    };
  });
}

function genIngles(){
  return shuffle(ENGLISH_WORDS).map(item => {
    const set = new Set([item.english]);
    while(set.size < 4) set.add(ENGLISH_WORDS[randInt(0,ENGLISH_WORDS.length-1)].english);
    return {
      eyebrow:'Inglés',
      prompt:`¿Cómo se dice "${item.spanish}" en inglés?`,
      visual: `<span class="activity-visual activity-visual-large">${item.emoji}</span>`,
      options: shuffle(Array.from(set)).map(e => ({label:e, value:e})),
      correct: item.english,
    };
  });
}

function genFormas(){
  return shuffle(SHAPE_WORDS).map(item => {
    const set = new Set([item.shape]);
    while(set.size < 4) set.add(SHAPE_WORDS[randInt(0,SHAPE_WORDS.length-1)].shape);
    return {
      eyebrow:'Formas',
      prompt:'¿Qué forma es esta?',
      visual: `<span class="activity-visual activity-visual-shape">${item.emoji}</span>`,
      options: shuffle(Array.from(set)).map(s => ({label:s, value:s})),
      correct: item.shape,
    };
  });
}

function genComparar(){
  const emojisPool = ['🍓','⭐','🎈','🍪','🐟','🌸'];
  const qs = [];
  for(let i=0;i<10;i++){
    const emoji = emojisPool[randInt(0,emojisPool.length-1)];
    let a = randInt(1,8), b = randInt(1,8);
    while(a === b) b = randInt(1,8);
    const mayor = a > b ? 'Izquierda' : 'Derecha';
    qs.push({
      eyebrow:'¿Cuál grupo tiene más?',
      prompt:'Elige el grupo con más elementos',
      visual: `<div class="comparison-visual">${emojiGroup(a,emoji)}<span class="op">vs</span>${emojiGroup(b,emoji)}</div>`,
      options: [{label:'Izquierda', value:'Izquierda'},{label:'Derecha', value:'Derecha'}],
      correct: mayor,
    });
  }
  return qs;
}

/* =========================================================
   RENDER GENERIC QUESTION SCREEN
========================================================= */
function renderQuestionScreen(){
  const act = ACTIVITIES.find(a=>a.id===state.activity);
  setBodyTheme(act.theme);
  renderFloaters(false);
  renderTopbar('activity');

  const q = state.questions[state.qIndex];
  const total = state.questions.length;
  const pct = Math.round(((state.qIndex)/total)*100);

  const optsHTML = q.options.map((o,i)=>`
    <button class="opt-btn" data-idx="${i}" onclick="answerGeneric(${i})">${o.label}</button>
  `).join('');

  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="progress-label">Pregunta ${state.qIndex+1} de ${total}</div>
      <div class="progress-bar"><div style="width:${pct}%; background:${act.c2}"></div></div>
      <div class="card" style="--c1:${act.c1}" id="quizCard">
        <div class="q-eyebrow">${q.eyebrow}</div>
        <h2 class="q-prompt">${q.prompt}</h2>
        ${q.visual ? `<div class="q-visual">${q.visual}</div>` : ''}
        <div class="options-grid">${optsHTML}</div>
        <div class="feedback" id="feedback"></div>
        <button class="btn-next hidden" id="nextBtn" style="--c1:${act.c1};--c2:${act.c2}" onclick="nextGeneric()">Siguiente →</button>
      </div>
    </div>
  `;
  state.qStart = Date.now(); // IA: mide cuánto tarda en responder
}

function answerGeneric(idx){
  if(state.answered) return;
  state.answered = true;
  const q = state.questions[state.qIndex];
  const buttons = document.querySelectorAll('.opt-btn');
  const feedback = document.getElementById('feedback');
  const chosen = q.options[idx];
  const isCorrect = chosen.value === q.correct;
  state.respuestas.push({ // IA: guarda el detalle de cada respuesta
    pregunta: q.prompt,
    correcta: q.correct,
    elegida: chosen.value,
    segundos: Math.round((Date.now() - (state.qStart || Date.now()))/1000),
  });

  buttons.forEach((b,i)=>{
    b.classList.add('disabled');
    if(q.options[i].value === q.correct) b.classList.add('correct');
  });
  if(!isCorrect) buttons[idx].classList.add('wrong');

  if(isCorrect){
    state.score++;
    sumarEstrellas(1);
    feedback.textContent = '¡Muy bien! 🎉';
    feedback.className = 'feedback ok';
    confettiBurst(document.getElementById('quizCard'));
  } else {
    feedback.textContent = `Casi... la respuesta correcta es ${q.correct} 💪`;
    feedback.className = 'feedback bad';
  }
  renderTopbar('activity');
  document.getElementById('nextBtn').classList.remove('hidden');
}

function nextGeneric(){
  state.qIndex++;
  state.answered = false;
  if(state.qIndex < state.questions.length){
    renderQuestionScreen();
  } else {
    renderResultScreen();
  }
}

/* =========================================================
   RESULT SCREEN (shared)
========================================================= */
function renderResultScreen(){
  const act = ACTIVITIES.find(a=>a.id===state.activity);
  const total = state.questions.length || state.score;
  const pct = total ? state.score/total : 1;
  let stars = 1;
  if(pct >= 0.9) stars = 3; else if(pct >= 0.6) stars = 2;
  const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
  guardarProgreso(act.id, state.score, total);

  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="card result-card">
        <div style="font-size:3rem;">🏆</div>
        <div class="result-stars">${starDisplay}</div>
        <div class="result-score">${state.score} de ${total} correctas</div>
        <p class="result-msg">¡Buen trabajo, ${state.name}! Sigue practicando para ganar más estrellas.</p>
        <p class="result-msg" id="msgIA"></p>
        <div class="result-actions">
          <button class="btn-next" style="--c1:${act.c1};--c2:${act.c2}" onclick="startActivity('${act.id}')">Volver a intentar</button>
          <button class="btn-ghost" onclick="goToMenu()">Volver al menú</button>
        </div>
      </div>
    </div>
  `;
  if(act.id === 'suma'){
    evaluarConIA('suma').then(r=>{
      const el = document.getElementById('msgIA');
      if(!r || !el) return;
      el.textContent = r.mensaje_nino + (r.decision === 'subir' ? ' ⬆️ ¡Subiste de nivel!' : '');
    });
  }
}

/* =========================================================
   SOPA DE LETRAS
========================================================= */
// SOPA_WORD_POOL, SOPA_SIZE y SOPA_CATEGORIES ahora vienen del servicio de contenido.
let SOPA_WORD_POOL = [];
let SOPA_SIZE = 8;
let SOPA_CATEGORIES = [];
let sopaState = null;
let SOPA_WORDS = [];

function buildSopaGrid(words){
  const grid = Array.from({length:SOPA_SIZE}, ()=> Array(SOPA_SIZE).fill(''));
  const dirs = [[0,1],[1,0],[1,1],[-1,1]]; // right, down, diag-down-right, diag-up-right
  const placed = [];

  words.forEach(word=>{
    let ok = false, attempts = 0;
    while(!ok && attempts < 200){
      attempts++;
      const dir = dirs[randInt(0,dirs.length-1)];
      const row = randInt(0, SOPA_SIZE-1);
      const col = randInt(0, SOPA_SIZE-1);
      const endRow = row + dir[0]*(word.length-1);
      const endCol = col + dir[1]*(word.length-1);
      if(endRow < 0 || endRow >= SOPA_SIZE || endCol < 0 || endCol >= SOPA_SIZE) continue;

      let fits = true;
      for(let i=0;i<word.length;i++){
        const r = row + dir[0]*i, c = col + dir[1]*i;
        const cell = grid[r][c];
        if(cell !== '' && cell !== word[i]){ fits = false; break; }
      }
      if(!fits) continue;

      for(let i=0;i<word.length;i++){
        const r = row + dir[0]*i, c = col + dir[1]*i;
        grid[r][c] = word[i];
      }
      placed.push({word, cells:[...Array(word.length)].map((_,i)=>({r:row+dir[0]*i, c:col+dir[1]*i}))});
      ok = true;
    }
  });

  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(let r=0;r<SOPA_SIZE;r++){
    for(let c=0;c<SOPA_SIZE;c++){
      if(grid[r][c] === '') grid[r][c] = abc[randInt(0,25)];
    }
  }
  return {grid, placed};
}

function startSopa(){
  SOPA_WORDS = shuffle(SOPA_WORD_POOL).slice(0,5);
  const {grid, placed} = buildSopaGrid(SOPA_WORDS);
  const wordCategory = {};
  SOPA_WORDS.forEach(w => { wordCategory[w] = SOPA_CATEGORIES[randInt(0, SOPA_CATEGORIES.length-1)]; });
  sopaState = { grid, placed, found:new Set(), selected:[], wordCategory };
  renderSopa();
}

function sopaCellCategory(r,c){
  for(const pw of sopaState.placed){
    if(sopaState.found.has(pw.word) && pw.cells.some(cc=>cc.r===r && cc.c===c)){
      return sopaState.wordCategory[pw.word];
    }
  }
  return null;
}

function renderSopa(){
  const act = ACTIVITIES.find(a=>a.id==='sopa');
  setBodyTheme('sopa');
  renderFloaters(false);
  renderTopbar('activity');

  let cellsHTML = '';
  for(let r=0;r<SOPA_SIZE;r++){
    for(let c=0;c<SOPA_SIZE;c++){
      const cat = sopaCellCategory(r,c);
      const selected = sopaState.selected.some(cell => cell.r===r && cell.c===c);
      const style = cat ? ` style="background:${cat.color}26;color:${cat.color};border:2px solid ${cat.color};"` : '';
      const cls = cat ? 'sopa-cell found' : `sopa-cell${selected?' selected':''}`;
      cellsHTML += `<div class="${cls}" id="cell-${r}-${c}"${style} onclick="sopaClickCell(${r},${c})">${sopaState.grid[r][c]}</div>`;
    }
  }

  const wordsHTML = SOPA_WORDS.map(w => {
    const cat = sopaState.wordCategory[w];
    const isDone = sopaState.found.has(w);
    return `<li class="${isDone?'done':''}">
      <span class="cat-badge" style="background:${cat.color}22;color:${cat.color};">${cat.name}</span>
      <span>${w}</span>
    </li>`;
  }).join('');

  app.innerHTML = `
    <div class="quiz-wrap" style="max-width:720px;">
      <div class="progress-label">Encontradas: ${sopaState.found.size} de ${SOPA_WORDS.length}</div>
      <div class="progress-bar"><div style="width:${(sopaState.found.size/SOPA_WORDS.length)*100}%; background:${act.c2}"></div></div>
      <div class="card">
        <div class="q-eyebrow" style="color:${act.c1}">Sopa de letras</div>
        <h2 class="q-prompt">Toca cada letra de la palabra en orden</h2>
        <div class="sopa-layout">
          <div class="sopa-grid" style="grid-template-columns:repeat(${SOPA_SIZE}, 1fr);">${cellsHTML}</div>
          <div class="sopa-words">
            <h4>Palabras</h4>
            <ul>${wordsHTML}</ul>
          </div>
        </div>
      </div>
    </div>
  `;

  if(sopaState.found.size === SOPA_WORDS.length){
    sumarEstrellas(3);
    guardarProgreso('sopa', SOPA_WORDS.length, SOPA_WORDS.length);
    setTimeout(()=>{
      app.innerHTML = `
        <div class="quiz-wrap">
          <div class="card result-card">
            <div style="font-size:3rem;">🏆</div>
            <div class="result-stars">⭐⭐⭐</div>
            <div class="result-score">¡Encontraste las ${SOPA_WORDS.length} palabras!</div>
            <p class="result-msg">¡Excelente búsqueda, ${state.name}!</p>
            <div class="result-actions">
              <button class="btn-next" style="--c1:${act.c1};--c2:${act.c2}" onclick="startActivity('sopa')">Volver a intentar</button>
              <button class="btn-ghost" onclick="goToMenu()">Volver al menú</button>
            </div>
          </div>
        </div>
      `;
    }, 500);
  }
}

function sopaClickCell(r,c){
  const cell = {r,c};
  const availableWords = sopaState.placed.filter(pw => !sopaState.found.has(pw.word));
  const followsWord = pw => sopaState.selected.length < pw.cells.length &&
    sopaState.selected.every((selectedCell,i) =>
      pw.cells[i].r===selectedCell.r && pw.cells[i].c===selectedCell.c
    ) && pw.cells[sopaState.selected.length].r===r && pw.cells[sopaState.selected.length].c===c;
  let candidates = availableWords.filter(followsWord);

  if(candidates.length===0){
    sopaState.selected = [];
    candidates = availableWords.filter(pw => pw.cells[0].r===r && pw.cells[0].c===c);
  }

  if(candidates.length===0){
    renderSopa();
    const el = document.getElementById(`cell-${r}-${c}`);
    if(el){ el.classList.add('shake'); setTimeout(()=>el.classList.remove('shake'), 300); }
    return;
  }

  sopaState.selected.push(cell);
  const match = candidates.find(pw => pw.cells.length===sopaState.selected.length);
  if(match){
    sopaState.found.add(match.word);
    sopaState.selected = [];
    state.score = sopaState.found.size;
  }
  renderSopa();
}

/* =========================================================
   SILABAS (MA, PA, RA, SA, LA)
========================================================= */
// SILABA_WORDS y SILABA_POOL ahora vienen del servicio de contenido.
let SILABA_WORDS = [];
let SILABA_POOL = [];
let PRONUNCIA_WORDS = [];
let silabaState = null;

function startSilabas(){
  silabaState = { order: shuffle(SILABA_WORDS).slice(0,8), index:0, slots:[null,null], score:0, answered:false };
  renderSilaba();
}

function renderSilaba(){
  const act = ACTIVITIES.find(a=>a.id==='silabas');
  setBodyTheme('silaba');
  renderFloaters(false);
  renderTopbar('activity');

  const total = silabaState.order.length;
  const item = silabaState.order[silabaState.index];

  const distractors = shuffle(SILABA_POOL.filter(s => !item.word.includes(s))).slice(0,2);
  const buttons = shuffle([...item.word, ...distractors]);

  const slotsHTML = silabaState.slots.map(s => `
    <div class="silaba-slot ${s?'filled':''}">${s || ''}</div>
  `).join('');

  const poolHTML = buttons.map((s,i) => `
    <button class="silaba-btn" data-syll="${s}" onclick="silabaPick('${s}', this)">${s}</button>
  `).join('');

  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="progress-label">Palabra ${silabaState.index+1} de ${total}</div>
      <div class="progress-bar"><div style="width:${(silabaState.index/total)*100}%; background:${act.c2}"></div></div>
      <div class="card" id="silabaCard">
        <div class="q-eyebrow" style="color:${act.c1}">Forma la palabra</div>
        <div class="silaba-emoji">${item.emoji}</div>
        <div class="silaba-slots">${slotsHTML}</div>
        <div class="silaba-pool">${poolHTML}</div>
        <div class="feedback" id="silabaFeedback"></div>
        <button class="btn-next ${silabaState.answered ? '' : 'hidden'}" id="silabaNextBtn" style="--c1:${act.c1};--c2:${act.c2}" onclick="nextSilaba()">Siguiente →</button>
      </div>
    </div>
  `;
}

function silabaPick(syll, btn){
  if(silabaState.answered) return;
  const emptyIdx = silabaState.slots.findIndex(s => s===null);
  if(emptyIdx === -1) return;
  silabaState.slots[emptyIdx] = syll;
  btn.classList.add('used');

  const slotsEls = document.querySelectorAll('.silaba-slot');
  slotsEls[emptyIdx].textContent = syll;
  slotsEls[emptyIdx].classList.add('filled');

  if(silabaState.slots.every(s => s!==null)){
    const attempt = silabaState.slots.join('');
    const item = silabaState.order[silabaState.index];
    const feedback = document.getElementById('silabaFeedback');
    silabaState.answered = true;
    if(attempt === item.full){
      feedback.textContent = `¡Correcto! ${item.full} 🎉`;
      feedback.className = 'feedback ok';
      silabaState.score++;
      sumarEstrellas(1);
      confettiBurst(document.getElementById('silabaCard'));
    } else {
      feedback.textContent = 'Intenta de nuevo 💪';
      feedback.className = 'feedback bad';
    }
    document.getElementById('silabaNextBtn').classList.remove('hidden');
  }
}

function nextSilaba(){
  if(!silabaState) return;
  silabaState.index++;
  if(silabaState.index < silabaState.order.length){
    silabaState.slots = [null,null];
    silabaState.answered = false;
    renderSilaba();
  } else {
    state.score = silabaState.score;
    state.questions = silabaState.order;
    renderResultScreenSilaba();
  }
}

function renderResultScreenSilaba(){
  const act = ACTIVITIES.find(a=>a.id==='silabas');
  const total = silabaState.order.length;
  const pct = silabaState.score/total;
  let stars = 1;
  if(pct >= 0.9) stars = 3; else if(pct >= 0.6) stars = 2;
  const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
  guardarProgreso('silabas', silabaState.score, total);
  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="card result-card">
        <div style="font-size:3rem;">🏆</div>
        <div class="result-stars">${starDisplay}</div>
        <div class="result-score">${silabaState.score} de ${total} palabras correctas</div>
        <p class="result-msg">¡Gran trabajo formando palabras, ${state.name}!</p>
        <div class="result-actions">
          <button class="btn-next" style="--c1:${act.c1};--c2:${act.c2}" onclick="startActivity('silabas')">Volver a intentar</button>
          <button class="btn-ghost" onclick="goToMenu()">Volver al menú</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   VOCALES (intro cards + quiz)
========================================================= */
let vocalState = null;

function startVocales(){
  vocalState = { step: 0 }; // 0..4 intro, then quiz
  vocalState.quiz = genVocalesQuiz();
  renderVocalIntro();
}

function renderVocalIntro(){
  const act = ACTIVITIES.find(a=>a.id==='vocales');
  setBodyTheme('vocal');
  renderFloaters(false);
  renderTopbar('activity');

  const item = VOWEL_INTRO[vocalState.step];
  const total = VOWEL_INTRO.length;

  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="progress-label">Aprendiendo las vocales — ${vocalState.step+1} de ${total}</div>
      <div class="progress-bar"><div style="width:${((vocalState.step+1)/total)*100}%; background:${act.c2}"></div></div>
      <div class="card vowel-intro">
        <div class="vowel-letter">${item.v}</div>
        <div class="vowel-emoji">${item.emoji}</div>
        <div class="vowel-word">${item.word}</div>
        <button class="btn-next" style="--c1:${act.c1};--c2:${act.c2}; margin-top:26px;" onclick="nextVocalIntro()">
          ${vocalState.step < total-1 ? 'Siguiente vocal →' : 'Comenzar preguntas →'}
        </button>
      </div>
    </div>
  `;
}

function nextVocalIntro(){
  vocalState.step++;
  if(vocalState.step < VOWEL_INTRO.length){
    renderVocalIntro();
  } else {
    state.activity = 'vocales';
    state.questions = vocalState.quiz;
    state.qIndex = 0;
    state.score = 0;
    state.answered = false;
    renderQuestionScreen();
  }
}

/* =========================================================
   PRONUNCIACIÓN (Web Speech API — reconocimiento de voz)
========================================================= */
let pronunciaState = null;

function startPronuncia(){
  pronunciaState = { order: shuffle(PRONUNCIA_WORDS).slice(0,8), index:0, score:0, answered:false };
  renderPronuncia();
}

function renderPronuncia(){
  const act = ACTIVITIES.find(a=>a.id==='pronuncia');
  setBodyTheme('pronuncia');
  renderFloaters(false);
  renderTopbar('activity');

  const total = pronunciaState.order.length;
  const item = pronunciaState.order[pronunciaState.index];
  const soportado = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="progress-label">Palabra ${pronunciaState.index+1} de ${total}</div>
      <div class="progress-bar"><div style="width:${(pronunciaState.index/total)*100}%; background:${act.c2}"></div></div>
      <div class="card" id="pronunciaCard" style="--c1:${act.c1};--c2:${act.c2}">
        <div class="q-eyebrow" style="color:${act.c1}">Di esta palabra en voz alta</div>
        <div class="activity-visual" style="margin:10px 0;">${item.emoji}</div>
        <h2 class="q-prompt">${item.word}</h2>
        <button class="mic-btn" id="micBtn" ${soportado?'':'disabled'} onclick="escucharPalabra()">🎤</button>
        <div class="feedback" id="pronunciaFeedback">
          ${soportado ? 'Toca el micrófono y di la palabra' : 'Tu navegador no soporta reconocimiento de voz. Prueba con Google Chrome.'}
        </div>
        <button class="btn-next hidden" id="pronunciaNextBtn" style="--c1:${act.c1};--c2:${act.c2}" onclick="nextPronuncia()">Siguiente →</button>
      </div>
    </div>
  `;
}

function escucharPalabra(){
  if(pronunciaState.answered) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return;

  const item = pronunciaState.order[pronunciaState.index];
  const micBtn = document.getElementById('micBtn');
  const feedback = document.getElementById('pronunciaFeedback');

  const recognition = new SpeechRecognition();
  recognition.lang = 'es-PE';
  recognition.interimResults = false;

  micBtn.classList.add('listening');
  feedback.textContent = 'Escuchando...';
  feedback.className = 'feedback';

  recognition.onresult = (event) => {
    const dicho = event.results[0][0].transcript.trim().toUpperCase();
    const esperado = item.word.toUpperCase();
    const correcto = dicho.includes(esperado) || esperado.includes(dicho);
    marcarResultadoPronuncia(correcto, dicho);
  };
  recognition.onerror = () => {
    micBtn.classList.remove('listening');
    feedback.textContent = 'No te escuché bien, intenta de nuevo 🎤';
  };
  recognition.onend = () => micBtn.classList.remove('listening');

  recognition.start();
}

function marcarResultadoPronuncia(correcto, dicho){
  pronunciaState.answered = true;
  const feedback = document.getElementById('pronunciaFeedback');
  document.getElementById('micBtn').disabled = true;

  if(correcto){
    pronunciaState.score++;
    sumarEstrellas(1);
    feedback.textContent = `¡Muy bien! Dijiste "${dicho}" 🎉`;
    feedback.className = 'feedback ok';
    confettiBurst(document.getElementById('pronunciaCard'));
  } else {
    feedback.textContent = `Escuché "${dicho}", intenta de nuevo 💪`;
    feedback.className = 'feedback bad';
  }
  document.getElementById('pronunciaNextBtn').classList.remove('hidden');
}

function nextPronuncia(){
  pronunciaState.index++;
  if(pronunciaState.index < pronunciaState.order.length){
    pronunciaState.answered = false;
    renderPronuncia();
  } else {
    renderResultPronuncia();
  }
}

function renderResultPronuncia(){
  const act = ACTIVITIES.find(a=>a.id==='pronuncia');
  const total = pronunciaState.order.length;
  const pct = pronunciaState.score/total;
  let stars = 1;
  if(pct >= 0.9) stars = 3; else if(pct >= 0.6) stars = 2;
  const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
  guardarProgreso('pronuncia', pronunciaState.score, total);

  app.innerHTML = `
    <div class="quiz-wrap">
      <div class="card result-card">
        <div style="font-size:3rem;">🏆</div>
        <div class="result-stars">${starDisplay}</div>
        <div class="result-score">${pronunciaState.score} de ${total} palabras bien pronunciadas</div>
        <p class="result-msg">¡Excelente pronunciación, ${state.name}!</p>
        <div class="result-actions">
          <button class="btn-next" style="--c1:${act.c1};--c2:${act.c2}" onclick="startActivity('pronuncia')">Volver a intentar</button>
          <button class="btn-ghost" onclick="goToMenu()">Volver al menú</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   ACTIVITY ROUTER
========================================================= */
function startActivity(id){
  state.activity = id;
  state.qIndex = 0;
  state.score = 0;
  state.answered = false;
  state.activityStart = Date.now(); // NUEVO: para el indicador de duración
  state.respuestas = [];            // IA: reinicia el detalle de respuestas

  if(id === 'suma'){ iniciarSumaAdaptativa(); }
  else if(id === 'resta'){ state.questions = genResta(); renderQuestionScreen(); }
  else if(id === 'contar'){ state.questions = genContar(); renderQuestionScreen(); }
  else if(id === 'completa'){ state.questions = genCompleta(); renderQuestionScreen(); }
  else if(id === 'vocales'){ startVocales(); }
  else if(id === 'sopa'){ startSopa(); }
  else if(id === 'silabas'){ startSilabas(); }
  else if(id === 'pronuncia'){ startPronuncia(); }
  else if(id === 'colores'){ state.questions = genColores(); renderQuestionScreen(); }
  else if(id === 'ingles'){ state.questions = genIngles(); renderQuestionScreen(); }
  else if(id === 'comparar'){ state.questions = genComparar(); renderQuestionScreen(); }
  else if(id === 'formas'){ state.questions = genFormas(); renderQuestionScreen(); }
}

/* =========================================================
   INIT
   Primero pedimos el contenido al microservicio de contenido
   (actividades y bancos de palabras) y recién luego mostramos
   el login. Los servicios gratis en la nube pueden tardar unos
   segundos en "despertar", por eso mostramos un mensaje simple.
========================================================= */
function initApp(){
  setBodyTheme('login');
  app.innerHTML = `<div class="login-wrap"><p class="login-sub" style="color:#fff;">Cargando actividades...</p></div>`;
  cargarContenido()
    .then(showLogin)
    .catch(err => {
      console.error(err);
      app.innerHTML = `<div class="login-wrap"><p class="login-sub" style="color:#fff;">
        No se pudo conectar con el servicio de contenido. Revisa que esté encendido e intenta recargar la página.
      </p></div>`;
    });
}
initApp();