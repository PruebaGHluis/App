export const CATEGORIES = {
  largo:      { name: 'Juego largo', short: 'Largo' },
  approach:   { name: 'Approach (wedges)', short: 'Approach' },
  juegocorto: { name: 'Juego corto', short: 'Juego corto' },
  bunker:     { name: 'Bunker', short: 'Bunker' },
  putt:       { name: 'Putt', short: 'Putt' },
};

export const CLUBS = [
  { id: 'D', name: 'Driver' },
  { id: 'M3', name: 'Madera 3' },
  { id: 'M5', name: 'Madera 5' },
  { id: 'HIB', name: 'Híbrido' },
  { id: 'H4', name: 'Hierro 4' },
  { id: 'H5', name: 'Hierro 5' },
  { id: 'H6', name: 'Hierro 6' },
  { id: 'H7', name: 'Hierro 7' },
  { id: 'H8', name: 'Hierro 8' },
  { id: 'H9', name: 'Hierro 9' },
  { id: 'PW', name: 'Pitching wedge' },
  { id: 'GW', name: 'Gap wedge' },
  { id: 'SW', name: 'Sand wedge' },
  { id: 'LW', name: 'Lob wedge' },
];

export const DEFAULT_CLUBS = ['D', 'M3', 'HIB', 'H5', 'H6', 'H7', 'H8', 'H9', 'PW', 'GW', 'SW', 'LW'];

// level: 'medio' = apto para todos; 'avanzado' = se incluye en el plan con hándicap <= 10.
// attempts: intentos por defecto. target: % de éxito objetivo.
export const DRILLS = [
  // ── Juego largo ──
  {
    id: 'calles', cat: 'largo', level: 'medio', minutes: 15, attempts: 14, target: 60,
    name: 'Calles imaginarias',
    summary: 'Precisión desde el tee con driver o madera.',
    steps: [
      'Elige dos referencias en el campo de prácticas separadas unos 30 m: esa es tu calle.',
      'Haz tu rutina completa antes de cada golpe, como en el campo.',
      'Juega 14 golpes (una vuelta) alternando driver y madera 3.',
    ],
    success: 'La bola termina dentro de la calle.',
    tip: 'Cambia de calle cada 3 golpes para no coger ritmo de máquina.',
  },
  {
    id: 'tres-alturas', cat: 'largo', level: 'medio', minutes: 15, attempts: 9, target: 60,
    name: 'Tres alturas',
    summary: 'Control de trayectoria con un hierro medio.',
    steps: [
      'Con un hierro 6 o 7, juega bajo, medio y alto, en ese orden.',
      'Varía la posición de bola y la altura del finish, no la fuerza.',
      'Repite el ciclo tres veces (9 golpes).',
    ],
    success: 'La altura de la bola es la que habías anunciado.',
    tip: 'Para el golpe bajo, bola un poco atrasada y finish corto a la altura del pecho.',
  },
  {
    id: 'hierros-bandera', cat: 'largo', level: 'medio', minutes: 15, attempts: 10, target: 40,
    name: 'Hierros a bandera',
    summary: 'Golpes de aproximación largos con objetivo concreto.',
    steps: [
      'Elige una bandera a la distancia de tu hierro 7 y otra a la de tu hierro 5.',
      'Alterna objetivo y palo en cada golpe (10 golpes).',
      'Anota mentalmente si fallas corto, largo o lateral.',
    ],
    success: 'La bola queda a menos de 10 m de la bandera.',
    tip: 'Si fallas casi siempre corto, revisa tu tabla de distancias: quizá estés sobreestimando.',
  },
  {
    id: 'draw-fade', cat: 'largo', level: 'avanzado', minutes: 15, attempts: 10, target: 50,
    name: 'Draw y fade a demanda',
    summary: 'Dar efecto a la bola en ambos sentidos.',
    steps: [
      'Con un hierro 7, anuncia draw o fade antes de cada golpe.',
      'Alterna sin repetir el mismo efecto más de dos veces seguidas.',
      'Usa una referencia vertical (un árbol o un poste) como línea de salida.',
    ],
    success: 'La bola curva en el sentido anunciado y termina cerca de la línea objetivo.',
    tip: 'Ajusta la cara hacia el objetivo y la trayectoria del swing hacia la línea de salida.',
  },
  {
    id: 'nueve-hoyos-range', cat: 'largo', level: 'avanzado', minutes: 20, attempts: 9, target: 60,
    name: 'Nueve hoyos en el range',
    summary: 'Simular un recorrido cambiando de palo en cada golpe.',
    steps: [
      'Imagina los hoyos de tu campo: salida y segundo golpe de cada hoyo.',
      'Cambia de palo y objetivo en cada golpe, con rutina completa.',
      'Puntúa solo el golpe de salida de cada hoyo (9 en total).',
    ],
    success: 'Un golpe que en el campo te dejaría en posición jugable.',
    tip: 'Es el ejercicio que más se parece a jugar: úsalo antes de un torneo.',
  },

  // ── Approach ──
  {
    id: 'escalera-wedges', cat: 'approach', level: 'medio', minutes: 15, attempts: 12, target: 50,
    name: 'Escalera de distancias',
    summary: 'Control de distancia con wedges de 40 a 90 m.',
    steps: [
      'Juega a 40, 50, 60, 70, 80 y 90 m, en orden.',
      'Dos bolas por distancia (12 golpes).',
      'Si tienes medidor láser, comprueba cada bandera.',
    ],
    success: 'La bola queda a ±5 m de la distancia objetivo.',
    tip: 'Los golpes de 40 a 90 m son donde un jugador medio pierde más golpes. Pásate tiempo aquí.',
  },
  {
    id: 'reloj-wedge', cat: 'approach', level: 'medio', minutes: 15, attempts: 15, target: 55,
    name: 'Sistema del reloj',
    summary: 'Calibrar tres largos de swing por wedge.',
    steps: [
      'Con un solo wedge, haz swings con el brazo izquierdo en las 7:30, las 9:00 y las 10:30.',
      'Cinco bolas por longitud de swing (15 golpes).',
      'Anota la distancia media de cada una: tendrás tres distancias fijas por wedge.',
    ],
    success: 'La bola queda a ±4 m de la distancia media de esa longitud de swing.',
    tip: 'Mantén el mismo ritmo en los tres swings: lo que cambia es solo la longitud.',
  },
  {
    id: 'wedges-aleatorio', cat: 'approach', level: 'avanzado', minutes: 15, attempts: 10, target: 45,
    name: 'Distancias aleatorias',
    summary: 'Elegir palo y swing sin repetir distancia.',
    steps: [
      'Pide a alguien (o usa un generador) una distancia aleatoria entre 30 y 100 m.',
      'Elige palo y swing y juega una sola bola por distancia.',
      'Diez golpes, sin repetir distancia.',
    ],
    success: 'La bola queda a ±6 m de la distancia pedida.',
    tip: 'Imita el campo: nunca juegas dos veces seguidas la misma distancia.',
  },

  // ── Juego corto ──
  {
    id: 'up-down', cat: 'juegocorto', level: 'medio', minutes: 20, attempts: 9, target: 45,
    name: 'Up & down',
    summary: 'Salvar el par desde fuera del green.',
    steps: [
      'Coloca 9 bolas alrededor del green: buen lie, mal lie, cuesta arriba, cuesta abajo, rough…',
      'Juega cada bola hasta embocar, como en el campo.',
      'Cuenta cuántas embocas en dos golpes (chip y putt).',
    ],
    success: 'Embocas en dos golpes o menos.',
    tip: 'Es el dato que mejor se traslada al campo. Compara este porcentaje con el de tus vueltas.',
  },
  {
    id: 'circulo-chip', cat: 'juegocorto', level: 'medio', minutes: 15, attempts: 15, target: 40,
    name: 'Círculo de chips',
    summary: 'Chips rodados desde 10 a 20 m.',
    steps: [
      'Marca un círculo de 1,5 m de radio alrededor de un hoyo (con tees o una cuerda).',
      'Juega 5 bolas desde 10 m, 5 desde 15 m y 5 desde 20 m.',
      'Bota la bola en el green lo antes posible y deja que ruede.',
    ],
    success: 'La bola se queda dentro del círculo.',
    tip: 'Elige el punto de bote antes que el palo.',
  },
  {
    id: 'tres-palos', cat: 'juegocorto', level: 'medio', minutes: 15, attempts: 12, target: 45,
    name: 'Mismo chip, tres palos',
    summary: 'Aprender el bote y el rodado de cada palo.',
    steps: [
      'Elige un hoyo a unos 15 m.',
      'Juega 4 bolas con hierro 8, 4 con PW y 4 con SW.',
      'Ajusta el punto de bote según el palo.',
    ],
    success: 'La bola queda a menos de 2 m del hoyo.',
    tip: 'Anota con qué palo te quedas más cerca: ese es tu chip por defecto.',
  },
  {
    id: 'pitch-obstaculo', cat: 'juegocorto', level: 'avanzado', minutes: 15, attempts: 10, target: 40,
    name: 'Pitch por encima de un obstáculo',
    summary: 'Golpes altos con poco green.',
    steps: [
      'Pon un obstáculo (una bolsa o un bunker) entre la bola y el hoyo.',
      'Bandera a 6–10 m del obstáculo.',
      'Diez golpes con lob wedge o sand wedge con la cara abierta.',
    ],
    success: 'Pasa el obstáculo y queda a menos de 3 m.',
    tip: 'Acelera hasta el finish. La mayoría de errores vienen de frenar el palo.',
  },

  // ── Bunker ──
  {
    id: 'linea-arena', cat: 'bunker', level: 'medio', minutes: 10, attempts: 20, target: 80,
    name: 'Línea en la arena',
    summary: 'Controlar dónde entra el palo en la arena.',
    steps: [
      'Dibuja una línea en la arena perpendicular a tu objetivo.',
      'Haz 20 swings sin bola, entrando en la arena justo en la línea o unos centímetros antes.',
      'Revisa la marca después de cada swing.',
    ],
    success: 'El palo entra en la línea o hasta 5 cm por detrás.',
    tip: 'Luego coloca bolas 5 cm por delante de la línea y repite.',
  },
  {
    id: 'salida-3m', cat: 'bunker', level: 'medio', minutes: 15, attempts: 10, target: 50,
    name: 'Salida de bunker a 3 m',
    summary: 'Salir de bunker de green y dejarla cerca.',
    steps: [
      'Bunker de green con bandera a 10–15 m.',
      'Cambia de lie cada dos bolas: plano, cuesta arriba, enterrada.',
      'Diez bolas.',
    ],
    success: 'Sale a la primera y queda a menos de 3 m.',
    tip: 'Cara abierta antes de agarrar el palo, no después.',
  },
  {
    id: 'bunker-calle', cat: 'bunker', level: 'avanzado', minutes: 15, attempts: 10, target: 50,
    name: 'Bunker de calle',
    summary: 'Golpe limpio desde arena con hierro.',
    steps: [
      'Desde un bunker de calle (o simulado), juega un hierro 8 o 9.',
      'Afírmate en la arena sin hundirte y agarra el palo un poco más corto.',
      'Diez bolas a un objetivo de green.',
    ],
    success: 'Contacto limpio (bola antes que arena) y llega a la distancia prevista ±10 m.',
    tip: 'Elige un palo más de lo normal y haz un swing a tres cuartos.',
  },

  // ── Putt ──
  {
    id: 'reloj-putt', cat: 'putt', level: 'medio', minutes: 10, attempts: 12, target: 75,
    name: 'Reloj de putts',
    summary: 'Putts cortos desde todas las caídas.',
    steps: [
      'Coloca bolas a las 12, 3, 6 y 9 de un hoyo con algo de pendiente.',
      'Repite a 1, 2 y 3 m (12 putts).',
      'Si fallas, vuelves a empezar la distancia.',
    ],
    success: 'Putt embocado.',
    tip: 'Desde 1 m, apunta dentro del hoyo y pégale firme para que no coja la caída.',
  },
  {
    id: 'puerta-tees', cat: 'putt', level: 'medio', minutes: 10, attempts: 20, target: 85,
    name: 'Puerta de tees',
    summary: 'Salida de bola recta desde 1,5 m.',
    steps: [
      'Pon dos tees a 20 cm delante de la bola, separados un poco más que el ancho de la bola.',
      'Putt recto a 1,5 m.',
      '20 putts.',
    ],
    success: 'La bola pasa por la puerta y entra.',
    tip: 'Si tocas los tees, revisa la cara del putter en el impacto, no el recorrido.',
  },
  {
    id: 'lag-putting', cat: 'putt', level: 'medio', minutes: 15, attempts: 9, target: 70,
    name: 'Putts largos de aproximación',
    summary: 'Control de velocidad a 10, 15 y 20 m.',
    steps: [
      'Tres bolas desde 10 m, tres desde 15 m y tres desde 20 m.',
      'Cambia de hoyo en cada serie.',
      'No embocar es normal: se trata de dejarla cerca.',
    ],
    success: 'La bola queda a menos de 1 m del hoyo.',
    tip: 'Mira al hoyo en el último ensayo antes de patear para calibrar la distancia.',
  },
  {
    id: 'putts-caida', cat: 'putt', level: 'avanzado', minutes: 15, attempts: 10, target: 35,
    name: 'Putts con caída de 3 a 5 m',
    summary: 'Lectura de green y velocidad.',
    steps: [
      'Elige un putt con caída clara de 3 a 5 m.',
      'Lee el putt, elige un punto de entrada y la velocidad.',
      'Diez putts desde distintos puntos.',
    ],
    success: 'Putt embocado.',
    tip: 'Cuanto más despacio llega la bola al hoyo, más caída coge.',
  },
  {
    id: 'circulo-1m', cat: 'putt', level: 'avanzado', minutes: 10, attempts: 16, target: 90,
    name: 'Círculo de 1 m bajo presión',
    summary: 'Putts cortos sin fallos.',
    steps: [
      'Coloca 8 bolas en círculo a 1 m del hoyo.',
      'Haz dos vueltas al círculo (16 putts).',
      'Rutina completa en cada putt, como si fuera para ganar.',
    ],
    success: 'Putt embocado.',
    tip: 'Cuando falles, haz tres putts más desde ese mismo punto antes de seguir.',
  },
];

export const drillById = (id) => DRILLS.find((d) => d.id === id);
export const clubById = (id) => CLUBS.find((c) => c.id === id);
