/**
 * @fileoverview Wayfinding logic for mapping seat codes to stadium stand coordinates,
 * resolving entry gates, and computing standard/accessible paths.
 */

// SVG Coordinate mapping database for Stands and Gates
export const standCoordinates = {
  101: { cx: 200, cy: 60, name: 'North Stand (Sec 101)' },
  102: { cx: 55, cy: 200, name: 'West Stand (Sec 102)' },
  103: { cx: 200, cy: 60, name: 'North Stand (Sec 103)' },
  104: { cx: 200, cy: 340, name: 'South Stand (Sec 104)' },
  105: { cx: 345, cy: 200, name: 'East Stand (Sec 105)' },
  106: { cx: 200, cy: 340, name: 'South Stand (Sec 106)' },
};

export const gateCoordinates = {
  'Gate A': { cx: 200, cy: 25 },
  'Gate B': { cx: 380, cy: 200 },
  'Gate C': { cx: 200, cy: 375 },
  'Gate D': { cx: 20, cy: 200 },
};

/**
 * Parses seat input string and extracts section identifier.
 * Validates the seat code input defensively.
 *
 * @param {string} seatCode - User inputted seat string (e.g. "Sec 102, Row B").
 * @returns {string} Stand Section ID ('101', '102', '104', '105').
 */
export function parseSeatSection(seatCode) {
  if (typeof seatCode !== 'string') {
    return '101';
  }
  const cleanCode = seatCode.trim().toLowerCase();

  if (cleanCode.includes('102') || cleanCode.includes('west')) {
    return '102';
  }
  if (cleanCode.includes('104') || cleanCode.includes('south') || cleanCode.includes('106')) {
    return '104';
  }
  if (cleanCode.includes('105') || cleanCode.includes('east')) {
    return '105';
  }
  return '101'; // Default North Stand
}

/**
 * Resolves the closest stadium entry gate for a given stand section.
 *
 * @param {string} section - Stand section ID.
 * @returns {string} Closest Gate Name.
 */
export function getClosestGate(section) {
  switch (section) {
    case '102':
      return 'Gate D';
    case '104':
      return 'Gate C';
    case '105':
      return 'Gate B';
    default:
      return 'Gate A';
  }
}

/**
 * Computes SVG Path markup string for drawing wayfinding line.
 * Uses curved bezier paths for accessibility routing to denote ramps/elevators.
 *
 * @param {string} gate - Entry Gate name.
 * @param {string} section - Section Stand ID.
 * @param {boolean} useAccessible - True if accessible routing is requested.
 * @returns {string} SVG Path 'd' attribute value.
 */
export function generateSvgRoutePath(gate, section, useAccessible) {
  const start = gateCoordinates[gate] || { cx: 200, cy: 25 };
  const end = standCoordinates[section] || { cx: 200, cy: 60 };

  if (useAccessible) {
    // Generates a smooth detour curve representing accessible elevators/ramps
    return `M ${start.cx},${start.cy} Q 200,200 ${end.cx},${end.cy}`;
  }
  // Direct direct route line
  return `M ${start.cx},${start.cy} L ${end.cx},${end.cy}`;
}

/**
 * Generates descriptive multilingual text directions.
 * Defensive checking on inputs.
 *
 * @param {string} section - Section stand ID.
 * @param {string} gate - Entry gate name.
 * @param {boolean} useAccessible - True if accessible route is toggled.
 * @param {string} lang - Language code ('en', 'es', etc.).
 * @returns {string} HTML/Text direction instructions.
 */
export function getWayfindingTextDirections(section, gate, useAccessible, lang = 'en') {
  const directionDict = {
    en: {
      accessible: `♿ <strong>Accessible Directions to Section ${section}:</strong> Enter the stadium via <strong>${gate}</strong>. Bypass the staircases, turn left, and follow the blue accessible signs for 80 meters to the <strong>West Elevator lobby</strong>. Take Elevator 3 to Level 2. Section ${section} is immediately to your right. Accessible unisex restrooms and sensory support lockers are 15 meters down the concourse.`,
      direct: `🚶 <strong>Fast-Track Directions to Section ${section}:</strong> Enter the stadium via <strong>${gate}</strong>. Scan your digital ticket, proceed past the concessions hub, and climb the Stand staircase directly ahead to Row B. Section ${section} is located on the lower concourse, seats are numbered left-to-right.`,
    },
    es: {
      accessible: `♿ <strong>Ruta Accesible a la Sección ${section}:</strong> Ingrese por la <strong>${gate}</strong>. Evite las escaleras, gire a la izquierda y siga los carteles azules durante 80 metros hacia los **ascensores del Oeste**. Suba al Piso 2. La Sección ${section} está a la derecha. Baños accesibles a 15 metros.`,
      direct: `🚶 <strong>Ruta Rápida a la Sección ${section}:</strong> Ingrese por la <strong>${gate}</strong>. Escanee su ticket, pase la zona de comida y suba por la escalera principal hacia la fila B. La Sección ${section} está en la plataforma inferior.`,
    },
  };

  const selectedLang = directionDict[lang] ? lang : 'en';
  return useAccessible
    ? directionDict[selectedLang].accessible
    : directionDict[selectedLang].direct;
}
