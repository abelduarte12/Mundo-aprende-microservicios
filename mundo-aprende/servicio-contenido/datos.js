/* =========================================================
   Bancos de datos del juego, extraídos del frontend original.
   Este servicio NO necesita base de datos: es contenido fijo
   que se sirve tal cual. Si luego quieres que el profesor
   pueda editarlo desde un panel, aquí es donde conectarías
   una tabla en la base de datos en vez de estos arreglos.
========================================================= */

const ACTIVITIES = [
  { id: 'suma', icon: '➕', title: 'Suma', desc: 'Suma grupos de objetos y descubre el resultado', tag: '10 preguntas', theme: 'suma' },
  { id: 'resta', icon: '➖', title: 'Resta', desc: 'Quita elementos y encuentra cuántos quedan', tag: '10 preguntas', theme: 'resta' },
  { id: 'contar', icon: '🔢', title: 'Contar', desc: 'Cuenta los objetos y elige el número correcto', tag: '10 preguntas', theme: 'contar' },
  { id: 'sopa', icon: '🔎', title: 'Sopa de Letras', desc: 'Encuentra las palabras escondidas en la cuadricula', tag: '5 palabras al azar', theme: 'sopa' },
  { id: 'completa', icon: '✏️', title: 'Completa las Palabras', desc: 'Descubre la letra que falta en cada palabra', tag: '10 preguntas', theme: 'completa' },
  { id: 'vocales', icon: '🔤', title: 'Las Vocales', desc: 'Aprende la a, e, i, o, u y complétalas en palabras', tag: '5 tarjetas + 8 preguntas', theme: 'vocal' },
  { id: 'silabas', icon: '🧩', title: 'Palabras con MA, ME, MI, MO, MU...', desc: 'Une sílabas con todas sus vocales y forma palabras divertidas', tag: '8 palabras al azar', theme: 'silaba' },
  { id: 'pronuncia', icon: '🎤', title: 'Di la Palabra', desc: 'Practica tu pronunciación diciendo la palabra en voz alta', tag: '8 palabras', theme: 'pronuncia' },
  { id: 'colores', icon: '🎨', title: 'Los Colores', desc: 'Identifica el color de cada objeto', tag: '8 preguntas', theme: 'colores' },
  { id: 'ingles', icon: '🌎', title: 'Inglés Básico', desc: 'Aprende cómo se dicen los animales en inglés', tag: '10 preguntas', theme: 'ingles' },
  { id: 'comparar', icon: '⚖️', title: 'Mayor o Menor', desc: 'Elige el grupo que tiene más elementos', tag: '10 preguntas', theme: 'comparar' },
  { id: 'formas', icon: '🔷', title: 'Formas Geométricas', desc: 'Reconoce círculos, cuadrados, triángulos y más', tag: '6 preguntas', theme: 'formas' },
];

const COMPLETA_WORDS = [
  { word: 'PERRO', blankIndex: 1, emoji: '🐶' },
  { word: 'GATO', blankIndex: 1, emoji: '🐱' },
  { word: 'SOL', blankIndex: 1, emoji: '☀️' },
  { word: 'CASA', blankIndex: 1, emoji: '🏠' },
  { word: 'LUNA', blankIndex: 2, emoji: '🌙' },
  { word: 'PEZ', blankIndex: 1, emoji: '🐟' },
  { word: 'FLOR', blankIndex: 1, emoji: '🌸' },
  { word: 'MANO', blankIndex: 1, emoji: '✋' },
  { word: 'OSO', blankIndex: 1, emoji: '🐻' },
  { word: 'RATON', blankIndex: 1, emoji: '🐭' },
];

const VOWEL_INTRO = [
  { v: 'A', word: 'ARAÑA', emoji: '🕷️' },
  { v: 'E', word: 'ELEFANTE', emoji: '🐘' },
  { v: 'I', word: 'IGLÚ', emoji: '🧊' },
  { v: 'O', word: 'OSO', emoji: '🐻' },
  { v: 'U', word: 'UVA', emoji: '🍇' },
];

const VOWEL_WORDS = [
  { word: 'CASA', blankIndex: 1, emoji: '🏠' },
  { word: 'PELOTA', blankIndex: 1, emoji: '⚽' },
  { word: 'ISLA', blankIndex: 0, emoji: '🏝️' },
  { word: 'OSO', blankIndex: 1, emoji: '🐻' },
  { word: 'UVA', blankIndex: 0, emoji: '🍇' },
  { word: 'MESA', blankIndex: 1, emoji: '🪑' },
  { word: 'LUNA', blankIndex: 2, emoji: '🌙' },
  { word: 'ARBOL', blankIndex: 0, emoji: '🌳' },
];

const SILABA_WORDS = [
  { word: ['MA', 'PA'], full: 'MAPA', emoji: '🗺️' },
  { word: ['PA', 'LA'], full: 'PALA', emoji: '⛏️' },
  { word: ['RA', 'MA'], full: 'RAMA', emoji: '🌿' },
  { word: ['SA', 'LA'], full: 'SALA', emoji: '🛋️' },
  { word: ['PU', 'MA'], full: 'PUMA', emoji: '🐆' },
  { word: ['MU', 'LA'], full: 'MULA', emoji: '🐴' },
  { word: ['MA', 'SA'], full: 'MASA', emoji: '🍞' },
  { word: ['PA', 'SA'], full: 'PASA', emoji: '🍇' },
  { word: ['ME', 'SA'], full: 'MESA', emoji: '🪑' },
  { word: ['PE', 'SA'], full: 'PESA', emoji: '🏋️' },
  { word: ['RI', 'SA'], full: 'RISA', emoji: '😂' },
  { word: ['RO', 'SA'], full: 'ROSA', emoji: '🌹' },
  { word: ['SO', 'PA'], full: 'SOPA', emoji: '🍲' },
  { word: ['SA', 'PO'], full: 'SAPO', emoji: '🐸' },
  { word: ['LO', 'RO'], full: 'LORO', emoji: '🦜' },
  { word: ['MO', 'RA'], full: 'MORA', emoji: '🫐' },
  { word: ['PE', 'RA'], full: 'PERA', emoji: '🍐' },
  { word: ['MI', 'MO'], full: 'MIMO', emoji: '🤡' },
  { word: ['PO', 'LO'], full: 'POLO', emoji: '🍦' },
  { word: ['RO', 'PA'], full: 'ROPA', emoji: '👕' },
  { word: ['LU', 'PA'], full: 'LUPA', emoji: '🔍' },
  { word: ['LI', 'MA'], full: 'LIMA', emoji: '🍋' },
  { word: ['RI', 'MA'], full: 'RIMA', emoji: '📝' },
  { word: ['LE', 'MA'], full: 'LEMA', emoji: '🏷️' },
  { word: ['RE', 'MO'], full: 'REMO', emoji: '🚣' },
  { word: ['SU', 'MA'], full: 'SUMA', emoji: '➕' },
  { word: ['PI', 'PA'], full: 'PIPA', emoji: '🌻' },
  { word: ['MU', 'RO'], full: 'MURO', emoji: '🧱' },
  { word: ['PE', 'LO'], full: 'PELO', emoji: '💇' },
  { word: ['SI', 'LO'], full: 'SILO', emoji: '🌾' },
];
const SILABA_POOL = ['MA','ME','MI','MO','MU','PA','PE','PI','PO','PU','RA','RE','RI','RO','RU','SA','SE','SI','SO','SU','LA','LE','LI','LO','LU'];

const SOPA_WORD_POOL = ['SOL','LUNA','GATO','PEZ','FLOR','RATA','OSO','PATO','LORO','MESA','CASA','LIMA','PERA','ROSA','SAPO'];
const SOPA_SIZE = 8;

const PRONUNCIA_WORDS = [
  { word: 'GATO', emoji: '🐱' },
  { word: 'PERRO', emoji: '🐶' },
  { word: 'SOL', emoji: '☀️' },
  { word: 'LUNA', emoji: '🌙' },
  { word: 'CASA', emoji: '🏠' },
  { word: 'FLOR', emoji: '🌸' },
  { word: 'PEZ', emoji: '🐟' },
  { word: 'OSO', emoji: '🐻' },
];

const COLOR_WORDS = [
  { emoji: '🍎', color: 'Rojo' },
  { emoji: '🍌', color: 'Amarillo' },
  { emoji: '🍇', color: 'Morado' },
  { emoji: '🥦', color: 'Verde' },
  { emoji: '🍊', color: 'Naranja' },
  { emoji: '🫐', color: 'Azul' },
  { emoji: '🍫', color: 'Marrón' },
  { emoji: '🐘', color: 'Gris' },
];

const ENGLISH_WORDS = [
  { emoji: '🐶', spanish: 'Perro', english: 'Dog' },
  { emoji: '🐱', spanish: 'Gato', english: 'Cat' },
  { emoji: '🐘', spanish: 'Elefante', english: 'Elephant' },
  { emoji: '🦁', spanish: 'León', english: 'Lion' },
  { emoji: '🐦', spanish: 'Pájaro', english: 'Bird' },
  { emoji: '🐟', spanish: 'Pez', english: 'Fish' },
  { emoji: '🐴', spanish: 'Caballo', english: 'Horse' },
  { emoji: '🐮', spanish: 'Vaca', english: 'Cow' },
  { emoji: '🐷', spanish: 'Cerdo', english: 'Pig' },
  { emoji: '🐸', spanish: 'Rana', english: 'Frog' },
];

const SHAPE_WORDS = [
  { emoji: '⭕', shape: 'Círculo' },
  { emoji: '⬛', shape: 'Cuadrado' },
  { emoji: '🔺', shape: 'Triángulo' },
  { emoji: '⭐', shape: 'Estrella' },
  { emoji: '🔷', shape: 'Rombo' },
  { emoji: '❤️', shape: 'Corazón' },
];

module.exports = {
  ACTIVITIES,
  COMPLETA_WORDS,
  VOWEL_INTRO,
  VOWEL_WORDS,
  SILABA_WORDS,
  SILABA_POOL,
  SOPA_WORD_POOL,
  SOPA_SIZE,
  PRONUNCIA_WORDS,
  COLOR_WORDS,
  ENGLISH_WORDS,
  SHAPE_WORDS,
};
