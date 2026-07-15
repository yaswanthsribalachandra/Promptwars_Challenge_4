/**
 * @fileoverview Main entry point of ArenaPulse AI.
 * Combined self-contained script for native file:// protocol compatibility.
 * Decouples JSDoc functions, caches results, and runs debounced events.
 */

// ==========================================
// --- UTILITIES (utils.js) ---
// ==========================================

/**
 * Helper to select a single DOM element.
 * @param {string} selector - CSS selector query.
 * @param {Element|Document} [context=document] - Context element.
 * @returns {Element|null} The matching element.
 */
function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Helper to select multiple DOM elements as an Array.
 * @param {string} selector - CSS selector query.
 * @param {Element|Document} [context=document] - Context element.
 * @returns {Element[]} Array of matching elements.
 */
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Sanitizes input string to prevent XSS.
 * @param {string} str - Raw string.
 * @returns {string} Sanitized string.
 */
function sanitize(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes HTML tags to drop potential vector scripts.
 * @param {string} html - Raw HTML.
 * @returns {string} Sanitized HTML.
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }
  return html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, '');
}

/**
 * Validates the length of input string.
 * @param {string} str - Input string.
 * @param {number} maxLength - Max allowed characters.
 * @returns {boolean} True if string is valid and within limits.
 */
function validateInputLength(str, maxLength) {
  if (typeof str !== 'string') {
    return false;
  }
  return str.length > 0 && str.length <= maxLength;
}

/**
 * Validates and reads integer values from local storage.
 * @param {string} key - Cache key.
 * @param {number} defaultValue - Default fallback value if invalid or empty.
 * @returns {number} Validated integer value.
 */
function getValidatedLocalStorageInt(key, defaultValue) {
  try {
    const rawVal = localStorage.getItem(key);
    if (rawVal === null) {
      return defaultValue;
    }
    const parsed = parseInt(rawVal, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (_e) {
    return defaultValue;
  }
}

/**
 * Validates and reads boolean values from local storage.
 * @param {string} key - Cache key.
 * @param {boolean} defaultValue - Default fallback value.
 * @returns {boolean} Validated boolean value.
 */
function getValidatedLocalStorageBool(key, defaultValue) {
  try {
    const rawVal = localStorage.getItem(key);
    if (rawVal === null) {
      return defaultValue;
    }
    return rawVal === 'true';
  } catch (_e) {
    return defaultValue;
  }
}

/**
 * Debounces a function execution.
 * @param {Function} func - Function to execute.
 * @param {number} wait - Time in milliseconds to wait before executing.
 * @returns {Function} Debounced function wrapper.
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==========================================
// --- CONSTANTS (constants.js) ---
// ==========================================

const standCoordinates = {
  101: { cx: 200, cy: 60, name: 'North Stand (Sec 101)' },
  102: { cx: 55, cy: 200, name: 'West Stand (Sec 102)' },
  103: { cx: 200, cy: 60, name: 'North Stand (Sec 103)' },
  104: { cx: 200, cy: 340, name: 'South Stand (Sec 104)' },
  105: { cx: 345, cy: 200, name: 'East Stand (Sec 105)' },
  106: { cx: 200, cy: 340, name: 'South Stand (Sec 106)' },
};

const gateCoordinates = {
  'Gate A': { cx: 200, cy: 25 },
  'Gate B': { cx: 380, cy: 200 },
  'Gate C': { cx: 200, cy: 375 },
  'Gate D': { cx: 20, cy: 200 },
};

const heatmapSections = [
  'N-101',
  'N-102',
  'N-103',
  'E-104',
  'E-105',
  'E-106',
  'S-107',
  'S-108',
  'S-109',
  'W-110',
  'W-111',
  'W-112',
  'V-201',
  'V-202',
  'V-203',
  'V-204',
  'M-301',
  'M-302',
  'M-303',
  'M-304',
  'G-A',
  'G-B',
  'G-C',
  'G-D',
];

const transitOptions = [
  {
    id: 'metro-a',
    name: 'Stadium Metro Station (Line A)',
    baseWait: 35,
    congestion: 'high',
    statusText: 'Congested',
    badgeClass: 'badge-red',
  },
  {
    id: 'shuttles',
    name: 'Park & Ride Shuttles (East & West Lots)',
    baseWait: 15,
    congestion: 'moderate',
    statusText: 'Moderate',
    badgeClass: 'badge-orange',
  },
  {
    id: 'rideshare',
    name: 'Rideshare Hub (Zone F - Outer Ring)',
    baseWait: 10,
    congestion: 'clear',
    statusText: 'Clear',
    badgeClass: 'badge-green',
  },
];

const ecoActions = {
  transit: {
    points: 50,
    desc: 'Took Public Transport / Shuttles',
  },
  recycle: {
    points: 20,
    desc: 'Recycled Plastic Cups/Bottles at Smart Bin',
  },
  reusable: {
    points: 30,
    desc: 'Brought Reusable Cup/Bag',
  },
  clean: {
    points: 15,
    desc: 'Cleared Seat Trash after the Match',
  },
};

const simulatedQA = {
  en: {
    bag: '🎒 <strong>FIFA Stadium Bag Policy:</strong> Only clear bags smaller than 12x6x12 inches (30x15x30 cm) or small clutch bags (4.5x6.5 inches) are allowed. Backpacks and larger purses are prohibited.',
    transit:
      '🚇 <strong>Transit Status:</strong> Metro Line A is experiencing severe post-game congestion (wait times ~35 mins). We recommend taking the Park & Ride Shuttles (East/West gate lanes, wait ~15 mins) or walking to the Rideshare Hub in Zone F.',
    accessible:
      '♿ <strong>Accessibility Info:</strong> Elevators are located at Gates A, B, and C. A quiet sensory room is available behind Section 104 next to the medical station. Accessible ramps lead directly to Section 102 and 104.',
    food: '🌭 <strong>Concessions & Dietary Options:</strong> Vegetarian hot dogs, vegan burgers, and Halal-certified snacks are available at the concessions stand near Gate C (behind Section 104) and Section 102.',
    schedule:
      "🏆 <strong>Match Schedule:</strong> Today's World Cup Match features USA vs Mexico. Kickoff is at 8:00 PM. Stadium gates open 3 hours prior at 5:00 PM.",
    welcome:
      '⚽ Welcome to the stadium! How can I assist you with navigation, policies, accessibility, or transit?',
    default:
      "I've processed your query about the stadium. If you need navigation help, enter your seat code in the seat locator. Can I help you with transport, bags, or accessibility details?",
  },
  es: {
    bag: '🎒 <strong>Política de bolsos de la FIFA:</strong> Solo se permiten bolsos transparentes de menos de 12x6x12 pulgadas (30x15x30 cm) o bolsos de mano pequeños (4.5x6.5 pulgadas). Las mochilas están prohibidas.',
    transit:
      '🚇 <strong>Estado del tránsito:</strong> La Línea A del Metro experimenta una congestión severa después del partido (espera de ~35 min). Se recomienda tomar los autobuses de traslado (carriles A/C, espera de ~15 min) o caminar al Rideshare Hub en la Zona F.',
    accessible:
      '♿ <strong>Accesibilidad:</strong> Los ascensores se ubican en las Puertas A, B y C. Una sala sensorial tranquila está disponible detrás de la Sección 104. Las rampas accesibles conducen directamente a las secciones 102 y 104.',
    food: '🌭 <strong>Alimentos y opciones dietéticas:</strong> Hot dogs vegetarianos, hamburguesas veganas y alimentos Halal están disponibles cerca de la Puerta C (detrás de la Sección 104) y la Sección 102.',
    schedule:
      '🏆 <strong>Horario del partido:</strong> El partido de hoy es EE. UU. vs México. El inicio es a las 8:00 PM. Las puertas del estadio abren a las 5:00 PM.',
    welcome:
      '⚽ ¡Bienvenido al estadio! ¿Cómo puedo ayudarle con la navegación, las políticas, la accesibilidad o el tránsito?',
    default:
      'He procesado su consulta sobre el estadio. Si necesita ayuda de navegación, ingrese su código de asiento en el localizador. ¿Puedo ayudarle con transporte, bolsos o detalles de accesibilidad?',
  },
  fr: {
    bag: '🎒 <strong>Politique des sacs FIFA:</strong> Seuls les sacs transparents de moins de 12x6x12 pouces (30x15x30 cm) ou les petites pochettes (4.5x6.5 pouces) sont autorisés. Les sacs à dos sont interdits.',
    transit:
      '🚇 <strong>Info Transport:</strong> La ligne de métro A est très encombrée (attente ~35 min). Nous vous conseillons les navettes gratuites (portes Est/Ouest, attente ~15 min) ou le hub de covoiturage en Zone F.',
    accessible:
      "♿ <strong>Accessibilité:</strong> Des ascenseurs sont situés aux portes A, B et C. Une salle sensorielle calme est disponible derrière la section 104. Des rampes d'accès mènent directement aux sections 102 et 104.",
    food: '🌭 <strong>Restauration:</strong> Des options végétariennes, végétaliennes et Halal sont disponibles près de la porte C (derrière la section 104) et de la section 102.',
    schedule:
      "🏆 <strong>Match:</strong> Aujourd'hui: États-Unis contre Mexique. Coup d'envoi à 20h00. Les portes du stade ouvrent à 17h00.",
    welcome:
      "⚽ Bienvenue au stade ! Comment puis-je vous aider pour l'orientation, le règlement ou les transports ?",
    default:
      "J'ai traité votre demande. Pour obtenir de l'aide sur l'orientation, veuillez saisir votre numéro de siège. Puis-je vous aider pour les transports, les sacs ou l'accessibilité ?",
  },
  pt: {
    bag: '🎒 <strong>Política de Bolsas FIFA:</strong> Apenas bolsas transparentes menores que 12x6x12 polegadas (30x15x30 cm) ou bolsas de mão pequenas são permitidas. Mochilas são proibidas.',
    transit:
      '🚇 <strong>Trânsito:</strong> A linha A do metrô está com alta lentidão pós-jogo (espera ~35 min). Recomendamos os ônibus circulares de traslado (espera ~15 min) ou o ponto de Rideshare na Zona F.',
    accessible:
      '♿ <strong>Acessibilidade:</strong> Elevadores localizados nos Portões A, B e C. Sala sensorial disponível atrás do Setor 104. Rampas acessíveis levam aos Setores 102 e 104.',
    food: '🌭 <strong>Alimentação:</strong> Cachorros-quentes vegetarianos, hambúrgueres veganos e opções Halal perto do Portão C (atrás do Setor 104) e Setor 102.',
    schedule:
      '🏆 <strong>Horário do Jogo:</strong> O jogo de hoje é EUA contra México. Início às 20h. Portões abrem às 17h.',
    welcome:
      '⚽ Bem-vindo ao estádio! Como posso ajudar com a navegação, regras, acessibilidade ou transporte?',
    default:
      'Processei sua dúvida. Se precisar de direções, insira seu código de assento. Posso ajudar com transporte, bolsas ou acessibilidade?',
  },
  ar: {
    bag: '🎒 <strong>سياسة الحقائب للفيفا:</strong> يُسمح فقط بالحقائب الشفافة التي يقل حجمها عن 12×6×12 بوصة (30×15×30 سم) أو الحقائب الصغيرة جداً. يُمنع دخول حقائب الظهر.',
    transit:
      '🚇 <strong>حالة النقل:</strong> يشهد خط المترو A ازدحاماً شديداً بعد المباراة (الانتظار حوالي 35 دقيقة). نوصي باستخدام حافلات النقل الترددي (انتظار 15 دقيقة) أو التوجه إلى منطقة سيارات الأجرة في المنطقة F.',
    accessible:
      '♿ <strong>معلومات ذوي الاحتياجات الخاصة:</strong> تتوفر المصاعد في البوابات A و B و C. توجد غرفة حسية هادئة خلف القسم 104 بجوار النقطة الطبية.',
    food: '🌭 <strong>خيارات الأطعمة:</strong> تتوفر مأكولات نباتية وخيارات حلال في المطاعم القريبة من البوابة C (خلف القسم 104) والقسم 102.',
    schedule:
      '🏆 <strong>جدول المباراة:</strong> مباراة اليوم تجمع بين الولايات المتحدة والمكسيك. تنطلق المباراة الساعة 8:00 مساءً. تفتح البوابات الساعة 5:00 مساءً.',
    welcome: '⚽ مرحباً بكم في الاستاد! كيف يمكنني مساعدتك في التنقل، السياسات، أو النقل؟',
    default:
      'لقد عالجت استفسارك. إذا كنت بحاجة للمساعدة في تحديد موقع مقعدك، أدخل رمز المقعد في محدد المواقع. هل تحتاج لمساعدة إضافية؟',
  },
  ja: {
    bag: '🎒 <strong>FIFA手荷物持ち込み規制:</strong> 12x6x12インチ（30x15x30 cm）以下の透明なバッグ、または小型クラッチバッグのみ持ち込み可能です。リュックサック等は禁止されています規定。',
    transit:
      '🚇 <strong>交通状況:</strong> 地下鉄A線は試合後の大混雑が発生しています（待ち時間約35分）。パーク＆ライドシャトル（待ち時間約15分）またはゾーンFの配車アプリハブの利用をお勧めします。',
    accessible:
      '♿ <strong>アクセシビリティ情報:</strong> エレベーターはゲートA、B、Cにあります。静かなセンサリールームはセクション104 of 医療ステーション横に設置されています。',
    food: '🌭 <strong>飲食フードオプション:</strong> ベジタリアンホットドッグ、ヴィーガンバーガー、ハラール対応フードは、セクション102とゲートC付近（セクション104裏）で提供しています。',
    schedule:
      '🏆 <strong>試合日程:</strong> 本日の対戦カードはアメリカ対メキシコです。キックオフは午後8時。開場は午後5時（3時間前）です。',
    welcome:
      '⚽ スタジアムへようこそ！ご案内、規則、交通案内、バリアフリー情報など、何かお手伝いできることはありますか？',
    default:
      'スタジアムについてのお問い合わせを処理しました。シートの案内が必要な場合は、シートコードを入力してください。その他、バッグ、交通、バリアフリーについてお困りですか？',
  },
};

// ==========================================
// --- WAYFINDING (wayfinding.js) ---
// ==========================================

/**
 * Parses seat input string and extracts section identifier.
 * @param {string} seatCode - User inputted seat.
 * @returns {string} Stand Section ID.
 */
function parseSeatSection(seatCode) {
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
  return '101';
}

/**
 * Resolves closest entry gate.
 * @param {string} section - Stand section ID.
 * @returns {string} Gate name.
 */
function getClosestGate(section) {
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
 * Generates route line path string.
 * @param {string} gate - Entry Gate name.
 * @param {string} section - Stand section ID.
 * @param {boolean} useAccessible - True if accessible detour is needed.
 * @returns {string} Path 'd' attribute.
 */
function generateSvgRoutePath(gate, section, useAccessible) {
  const start = gateCoordinates[gate] || { cx: 200, cy: 25 };
  const end = standCoordinates[section] || { cx: 200, cy: 60 };
  if (useAccessible) {
    return `M ${start.cx},${start.cy} Q 200,200 ${end.cx},${end.cy}`;
  }
  return `M ${start.cx},${start.cy} L ${end.cx},${end.cy}`;
}

/**
 * Generates descriptive multilingual directions.
 * @param {string} section - Stand section ID.
 * @param {string} gate - Entry gate name.
 * @param {boolean} useAccessible - True if accessible.
 * @param {string} lang - Language code.
 * @returns {string} Direction instructions HTML.
 */
function getWayfindingTextDirections(section, gate, useAccessible, lang = 'en') {
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

// ==========================================
// --- CHATBOT (chatbot.js) ---
// ==========================================

/**
 * Searches queries for keywords and returns mock answers.
 * @param {string} promptText - User query.
 * @param {string} lang - Language code.
 * @returns {string} Response text.
 */
function getSimulatedApiResponse(promptText, lang = 'en') {
  if (typeof promptText !== 'string') {
    return '';
  }
  const query = promptText.toLowerCase();
  const dict = simulatedQA[lang] || simulatedQA.en;

  if (
    query.includes('bag') ||
    query.includes('pack') ||
    query.includes('purse') ||
    query.includes('bols') ||
    query.includes('sac') ||
    query.includes('持ち込み') ||
    query.includes('バッグ')
  ) {
    return dict.bag;
  }
  if (
    query.includes('transit') ||
    query.includes('metro') ||
    query.includes('subway') ||
    query.includes('bus') ||
    query.includes('shuttle') ||
    query.includes('train') ||
    query.includes('transport') ||
    query.includes('مترو') ||
    query.includes('交通') ||
    query.includes('電車')
  ) {
    return dict.transit;
  }
  if (
    query.includes('access') ||
    query.includes('wheelchair') ||
    query.includes('elevator') ||
    query.includes('sensory') ||
    query.includes('ramp') ||
    query.includes('disab') ||
    query.includes('كرسي') ||
    query.includes('車椅子') ||
    query.includes('バリアフリー') ||
    query.includes('エレベーター')
  ) {
    return dict.accessible;
  }
  if (
    query.includes('food') ||
    query.includes('eat') ||
    query.includes('drink') ||
    query.includes('vegetarian') ||
    query.includes('vegan') ||
    query.includes('halal') ||
    query.includes('comid') ||
    query.includes('nourriture') ||
    query.includes('طعام') ||
    query.includes('ベジタリアン') ||
    query.includes('フード')
  ) {
    return dict.food;
  }
  if (
    query.includes('schedule') ||
    query.includes('match') ||
    query.includes('time') ||
    query.includes('kickoff') ||
    query.includes('game') ||
    query.includes('partido') ||
    query.includes('heure') ||
    query.includes('مباراة') ||
    query.includes('スケジュール') ||
    query.includes('時間')
  ) {
    return dict.schedule;
  }
  return dict.default;
}

// ==========================================
// --- API (api.js) ---
// ==========================================

const apiCache = new Map();

/**
 * Fetches narrative content from Gemini API.
 * @param {string} userPrompt - User prompt.
 * @param {string} systemContext - Context guide.
 * @param {string} apiKey - Client key.
 * @returns {Promise<string>} Text reply.
 */
async function queryGeminiApi(userPrompt, systemContext, apiKey) {
  if (!apiKey) {
    throw new Error('API Key is missing');
  }
  const cacheKey = `${apiKey}:${systemContext}:${userPrompt}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey) || '';
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ parts: [{ text: `${systemContext}\n\nUser Prompt: ${userPrompt}` }] }],
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    throw new Error(`Gemini API returned error code ${response.status}`);
  }
  const data = await response.json();
  let resultText = '';
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    resultText = data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Response candidate format invalid');
  }
  apiCache.set(cacheKey, resultText);
  return resultText;
}

// ==========================================
// --- DASHBOARD (dashboard.js) ---
// ==========================================

/**
 * Generates randomized Stand occupancy levels.
 * @returns {Record<string, number>} Grid levels.
 */
function generateRandomOccupancy() {
  const data = {};
  heatmapSections.forEach((section) => {
    data[section] = Math.floor(Math.random() * (98 - 25) + 25);
  });
  return data;
}

/**
 * Calculates aggregate stats.
 * @param {Record<string, number>} data - Section occupancies.
 * @returns {{ avgOccupancy: number, criticalCount: number }} Metrics.
 */
function calculateHeatmapMetrics(data) {
  let total = 0;
  let criticalCount = 0;
  const sections = Object.keys(data);
  sections.forEach((sec) => {
    const val = data[sec];
    total += val;
    if (val >= 90) {
      criticalCount++;
    }
  });
  const avgOccupancy = sections.length > 0 ? parseFloat((total / sections.length).toFixed(1)) : 0;
  return { avgOccupancy, criticalCount };
}

/**
 * Triages venue incidents.
 * @param {string} type - Incident category.
 * @param {string} location - Selected sector.
 * @param {string} details - Log details.
 * @returns {{ priority: string, assignment: string, time: string, protocol: string }} Report.
 */
function triageIncident(type, location, details) {
  const cleanType = typeof type === 'string' ? type.trim().toLowerCase() : 'other';
  const cleanLoc = typeof location === 'string' ? location.trim() : 'Unknown';
  const cleanDetails = typeof details === 'string' ? details.trim() : '';

  let priority = 'Medium';
  let assignment = 'Zone Stewards & Volunteers';
  let time = '8-10 minutes';
  let protocol = 'Monitor area and report changes.';

  if (cleanType === 'medical') {
    priority = 'Urgent';
    assignment = 'Medical Emergency Squad Beta & Stadium First Aid Unit 2';
    time = '2-3 minutes';
    protocol = `[AI Reasoned Dispatch]: Medical emergency at ${cleanLoc}. Dispatching paramedic buggy with defibrillator immediately. Reason: high priority vital support. Instructing Zone stewards to clear corridor paths. Details noted: "${cleanDetails}".`;
  } else if (cleanType === 'security') {
    priority = 'Urgent';
    assignment = 'Venue Security Rapid Response Team & Local Police Unit';
    time = '3-5 minutes';
    protocol = `[AI Reasoned Dispatch]: Active security hazard reported at ${cleanLoc}. Dispatching tactical response team. Protocol: Secure local exit pathways, isolate section scanner, and review camera feeds. Details noted: "${cleanDetails}".`;
  } else if (cleanType === 'crowd') {
    priority = 'High';
    assignment = 'Crowd Logistics Team C & Auxiliary Gate Managers';
    time = '4-6 minutes';
    protocol = `[AI Reasoned Dispatch]: Major bottleneck forming at ${cleanLoc}. Directing Gate Operations to divert flow to auxiliary turnstiles. Reason: Prevent stampede risks. Instructing announcements team to broadcast routing redirect.`;
  } else if (cleanType === 'transit') {
    priority = 'High';
    assignment = 'Stadium Transport Coordinator & Metropolitan Bus Dispatch';
    time = '5-7 minutes';
    protocol = `[AI Reasoned Dispatch]: Transport failure affecting egress at ${cleanLoc}. Requesting 5 extra shuttle cars. Protocol: Direct outbound fans along path G to avoid subway backlog.`;
  } else if (cleanType === 'spill') {
    priority = 'Low';
    assignment = 'Venue Facilities & Sanitation Crew 3';
    time = '10-12 minutes';
    protocol = `[AI Reasoned Dispatch]: Facility spill at ${cleanLoc}. Dispatching cleanup crew. Protocol: Set slip warning cones. Reason: Minimizing structural hazard risks.`;
  }
  return { priority, assignment, time, protocol };
}

/**
 * Generates an PA announcements.
 * @param {string} type - Incident category.
 * @param {string} location - Selected sector.
 * @returns {{ en: string, es: string, reasoning: string }} Details.
 */
function generateAnnouncement(type, location) {
  const cleanType = typeof type === 'string' ? type.trim().toLowerCase() : 'other';
  const cleanLoc = typeof location === 'string' ? location.trim() : 'Unknown';

  let en = '';
  let es = '';
  let reasoning = '';

  if (cleanType === 'crowd' || cleanType === 'security') {
    en = `📢 Attention fans: Due to heavy crowd flow near ${cleanLoc}, we kindly request that you proceed slowly. Follow the directions of stadium volunteers. Thank you for your patience.`;
    es = `📢 Atención aficionados: Debido al alto flujo de personas cerca de ${cleanLoc}, les solicitamos avanzar lentamente. Sigan las indicaciones de los voluntarios. Gracias por su paciencia.`;
    reasoning = `[AI Reasoning]: Drafted to stabilize egress speed at ${cleanLoc} and leverage physical staff presence to reduce panic/bottlenecks.`;
  } else if (cleanType === 'transit') {
    en = `📢 Attention fans: Due to delays on Transit Line A near ${cleanLoc}, shuttle buses have been dispatched to Gate C for direct transport. Please consider using the shuttles.`;
    es = `📢 Atención: Debido a retrasos en la línea de tránsito A cerca de ${cleanLoc}, autobuses de enlace han sido desplegados en la Puerta C. Consideren usar las lanzaderas.`;
    reasoning =
      '[AI Reasoning]: Redirects passenger flow to secondary transport modes to relieve rail terminal congestions.';
  } else if (cleanType === 'medical') {
    en = `📢 Operational notification: Paramedic team responding near ${cleanLoc}. Please keep walkways clear for emergency personnel.`;
    es = `📢 Notificación de operaciones: Equipo de paramédicos respondiendo cerca de ${cleanLoc}. Por favor mantengan los pasillos despejados.`;
    reasoning =
      '[AI Reasoning]: Minimal panic wording to keep corridors open for emergency response teams.';
  } else {
    en = `📢 Operations announcement: General maintenance underway near ${cleanLoc}. Please use caution.`;
    es = `📢 Anuncio de operaciones: Mantenimiento general en curso cerca de ${cleanLoc}. Por favor procedan con precaución.`;
    reasoning =
      '[AI Reasoning]: Low-priority alert designed to raise awareness of minor facility issues.';
  }
  return { en, es, reasoning };
}

/**
 * Returns narrative predictions.
 * @param {number} occupancyPct - Occupancy level.
 * @param {string} matchStage - Active stage.
 * @returns {string} Narrative prediction.
 */
function getCrowdDensityPredictionNarrative(occupancyPct, matchStage = 'fulltime') {
  const stage = typeof matchStage === 'string' ? matchStage.toLowerCase() : 'fulltime';
  if (occupancyPct >= 90) {
    if (stage === 'pre-match') {
      return '🚨 [AI Crowd Predictor - Pre-Match]: Stadium is at near capacity. Security queues at Gates A and D will experience 25-minute delays. Action: Dynamically deploy volunteers to redirect arriving ticketholders to Gate B scanner lanes.';
    }
    if (stage === 'halftime') {
      return '⚠️ [AI Crowd Predictor - Halftime]: Concourse areas are critically packed. Restroom queue delays are estimated at 12 minutes. Action: Announce availability of auxiliary restrooms behind mid-stands.';
    }
    return '🚨 [AI Crowd Predictor - Post-Match]: CRITICAL exit congestion. Egress paths from upper decks are blocked. Action: Implement staged gate releases (hold VIP/mid stand flow for 10 mins) and deploy 5 extra shuttle buses to Gate C.';
  }
  if (occupancyPct >= 70) {
    if (stage === 'pre-match') {
      return '⚠️ [AI Crowd Predictor - Pre-Match]: High arrival rates. Scanner check times are estimated at 10 minutes. Suggest: Arrive early.';
    }
    return '⚠️ [AI Crowd Predictor - Post-Match]: Moderate-high exit flow. Metro terminal queues are building. Shuttles are clear.';
  }
  return '✅ [AI Crowd Predictor]: normal operations. Congestion indices are minimal.';
}

// ==========================================
// --- TRANSIT (transit.js) ---
// ==========================================

/**
 * Computes dynamic wait times based on critical incidents count.
 * @param {number} baseWaitMinutes - Standard wait.
 * @param {number} activeIncidentsCount - Critical operational alerts.
 * @returns {number} Estimated wait minutes.
 */
function computeTransitWaitTime(baseWaitMinutes, activeIncidentsCount) {
  const cleanIncidents = Math.max(0, parseInt(activeIncidentsCount, 10) || 0);
  const cleanBase = Math.max(0, parseInt(baseWaitMinutes, 10) || 0);
  return cleanBase + cleanIncidents * 5;
}

/**
 * Returns transit advice tip.
 * @param {string} highestCongestionOptionId - Heavy queue channel ID.
 * @returns {string} Tip.
 */
function getTransitTip(highestCongestionOptionId) {
  if (highestCongestionOptionId === 'metro-a') {
    return '🚇 **AI Transit Tip:** Metro Line A is highly congested due to the post-game rush. We recommend walking along the green pathway to the Shuttles or Rideshare Hub in Zone F to save 20 minutes.';
  }
  return '🚌 **AI Transit Tip:** Transit lines are operating normally. Shuttles are currently the most efficient green transit method available.';
}

// ==========================================
// --- ECOSCORE (ecoscore.js) ---
// ==========================================

/**
 * Calculates logged session points.
 * @param {string[]} selectedActionIds - Logged keys.
 * @returns {number} Points sum.
 */
function calculateSessionPoints(selectedActionIds) {
  if (!Array.isArray(selectedActionIds)) {
    return 0;
  }
  let total = 0;
  selectedActionIds.forEach((id) => {
    if (ecoActions[id]) {
      total += ecoActions[id].points;
    }
  });
  return total;
}

/**
 * Resolves reward badge name.
 * @param {number} totalPoints - Combined points.
 * @returns {string} Badge title.
 */
function evaluateUserBadgeLevel(totalPoints) {
  const points = Math.max(0, parseInt(totalPoints, 10) || 0);
  if (points > 150) {
    return 'Arena Guardian 🏆';
  }
  if (points > 80) {
    return 'Green Champion';
  }
  return 'Eco Fan';
}

/**
 * Generates custom advice.
 * @param {number} sessionPoints - Session points.
 * @param {string} badgeLevel - Badge level.
 * @returns {string} Custom tip text.
 */
function getSustainabilityAdvice(sessionPoints, badgeLevel) {
  if (sessionPoints >= 80) {
    return `⭐ Awesome! You unlocked the **${badgeLevel}** badge! By taking public transit and recycling today, you saved approximately 1,200g of CO2 emissions. Show this screen at concessions near Section 102 for a 15% discount on reusable souvenir cups!`;
  }
  return `🌱 Good job! You added ${sessionPoints} points to your EcoScore. Continue recycling and clean your section to earn the Green Champion badge. Level: **${badgeLevel}**. Did you know recycling just one plastic bottle powers stadium lighting for 10 minutes?`;
}

// ==========================================
// --- APPLICATION EVENT LOOPS ---
// ==========================================

function bootstrap() {
  // --- STATE VARIABLES (Validated from LocalStorage) ---
  let currentLanguage = 'en';
  let geminiApiKey = localStorage.getItem('arena_pulse_gemini_key') || '';
  let isHighContrast = getValidatedLocalStorageBool('arena_pulse_high_contrast', false);
  let textSize = localStorage.getItem('arena_pulse_text_size') || 'normal';
  let readAloudEnabled = getValidatedLocalStorageBool('arena_pulse_read_aloud', false);
  let userEcoScore = getValidatedLocalStorageInt('arena_pulse_eco_score', 0);

  // Validate API key syntax defensively
  if (geminiApiKey && (/[\s<>]/.test(geminiApiKey) || geminiApiKey.length > 80)) {
    geminiApiKey = '';
    localStorage.removeItem('arena_pulse_gemini_key');
  }

  // Validate text size value
  if (!['normal', 'large', 'extra-large'].includes(textSize)) {
    textSize = 'normal';
  }



  // --- TAB NAVIGATION SYSTEM ---
  const navButtons = $$('.nav-btn');
  const tabPanels = $$('.tab-panel');

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) {
        return;
      }

      // Batch state toggle updates to avoid layout thrashing
      navButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      tabPanels.forEach((panel) => {
        if (panel.id === targetTab) {
          panel.classList.add('active');
          panel.removeAttribute('aria-hidden');
        } else {
          panel.classList.remove('active');
          panel.setAttribute('aria-hidden', 'true');
        }
      });

      if (targetTab === 'ops-control') {
        renderHeatmap();
      }
    });
  });

  // --- SETTINGS MODALS CONTROL ---
  const apiConfigBtn = $('#api-config-btn');
  const apiModal = $('#api-modal');
  const apiModalClose = $('#api-modal-close');
  const saveApiKeyBtn = $('#save-api-key-btn');
  const clearApiKeyBtn = $('#clear-api-key-btn');
  const apiKeyInput = $('#api-key-input');

  const accessibilityToggleBtn = $('#accessibility-toggle-btn');
  const accessibilityModal = $('#accessibility-modal');
  const accessibilityModalClose = $('#accessibility-modal-close');
  const highContrastToggle = $('#high-contrast-toggle');
  const textSpeechToggle = $('#text-speech-toggle');
  const fontSizeSelect = $('#font-size-select');

  // Toggle API Modal
  apiConfigBtn.addEventListener('click', () => {
    apiModal.classList.add('active');
    apiModal.setAttribute('aria-hidden', 'false');
    apiKeyInput.focus();
  });
  apiModalClose.addEventListener('click', () => {
    apiModal.classList.remove('active');
    apiModal.setAttribute('aria-hidden', 'true');
  });

  // Toggle Accessibility Modal
  accessibilityToggleBtn.addEventListener('click', () => {
    accessibilityModal.classList.add('active');
    accessibilityModal.setAttribute('aria-hidden', 'false');
  });
  accessibilityModalClose.addEventListener('click', () => {
    accessibilityModal.classList.remove('active');
    accessibilityModal.setAttribute('aria-hidden', 'true');
  });

  // Save/Clear API key settings
  saveApiKeyBtn.addEventListener('click', () => {
    const rawVal = apiKeyInput.value.trim();
    if (!rawVal) {
      showToast('Please enter a valid key', 'warning');
      return;
    }
    if (/[\s<>]/.test(rawVal) || !validateInputLength(rawVal, 80)) {
      showToast('Invalid API key format or length', 'warning');
      return;
    }
    geminiApiKey = rawVal;
    localStorage.setItem('arena_pulse_gemini_key', rawVal);
    showToast('Gemini API key configured successfully!', 'success');
    updateApiStatusIndicator();
    apiModal.classList.remove('active');
  });

  clearApiKeyBtn.addEventListener('click', () => {
    geminiApiKey = '';
    localStorage.removeItem('arena_pulse_gemini_key');
    apiKeyInput.value = '';
    showToast('Gemini API key cleared. Running in local simulation mode.', 'info');
    updateApiStatusIndicator();
    apiModal.classList.remove('active');
  });

  // Accessibility Toggles
  highContrastToggle.addEventListener('change', (e) => {
    isHighContrast = e.target.checked;
    localStorage.setItem('arena_pulse_high_contrast', String(isHighContrast));
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
      showToast('High Contrast Mode Enabled', 'success');
    } else {
      document.body.classList.remove('high-contrast');
      showToast('High Contrast Mode Disabled', 'info');
    }
  });

  textSpeechToggle.addEventListener('change', (e) => {
    readAloudEnabled = e.target.checked;
    localStorage.setItem('arena_pulse_read_aloud', String(readAloudEnabled));
    showToast(readAloudEnabled ? 'Read Aloud Enabled' : 'Read Aloud Disabled', 'info');
  });

  fontSizeSelect.addEventListener('change', (e) => {
    textSize = e.target.value;
    localStorage.setItem('arena_pulse_text_size', textSize);
    document.body.classList.remove('font-large', 'font-extra-large');
    if (textSize === 'large') {
      document.body.classList.add('font-large');
    } else if (textSize === 'extra-large') {
      document.body.classList.add('font-extra-large');
    }
    showToast(`Text sizing updated to ${textSize}`, 'info');
  });

  // --- SMART WAYFINDING & SEAT LOCATOR ---
  const locateSeatBtn = $('#locate-seat-btn');
  const seatCodeInput = $('#seat-code');
  const accessibilityRouteToggle = $('#accessibility-route-toggle');
  const directionsText = $('#directions-text');
  const wayfindingRoute = $('#wayfinding-route');
  const mapTargetPin = $('#map-target-pin');

  const debouncedLocateSeat = debounce(() => {
    locateUserSeat();
  }, 300);

  locateSeatBtn.addEventListener('click', debouncedLocateSeat);
  seatCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      debouncedLocateSeat();
    }
  });

  $$('.gate-marker').forEach((marker) => {
    marker.addEventListener('click', () => {
      const gateName = marker.getAttribute('data-gate');
      if (gateName) {
        seatCodeInput.value = sanitize(gateName);
        debouncedLocateSeat();
      }
    });
  });

  function locateUserSeat() {
    const rawInput = seatCodeInput.value;
    const cleanInput = sanitize(rawInput);
    if (!validateInputLength(cleanInput, 40)) {
      showToast('Please enter a valid seat code (max 40 characters)', 'warning');
      return;
    }
    const section = parseSeatSection(cleanInput);
    const closestGate = getClosestGate(section);
    const useAccessible = accessibilityRouteToggle.checked;

    const pathDString = generateSvgRoutePath(closestGate, section, useAccessible);
    const standMap = {
      101: { cx: 200, cy: 60 },
      102: { cx: 55, cy: 200 },
      104: { cx: 200, cy: 340 },
      105: { cx: 345, cy: 200 },
    };
    const targetCoords = standMap[section] || { cx: 200, cy: 60 };

    wayfindingRoute.setAttribute('d', pathDString);
    mapTargetPin.setAttribute('transform', `translate(${targetCoords.cx}, ${targetCoords.cy})`);
    mapTargetPin.classList.remove('hidden');

    $$('.map-section').forEach((s) => s.classList.remove('active-target'));
    const svgSection = $(`.sec-${section}`);
    if (svgSection) {
      svgSection.classList.add('active-target');
    }

    const directionsHtml = getWayfindingTextDirections(
      section,
      closestGate,
      useAccessible,
      currentLanguage
    );
    directionsText.innerHTML = sanitizeHTML(directionsHtml);
    showToast(`Located seat in Section ${section}! Route generated.`, 'success');
    speakText(directionsHtml);
  }

  // --- MULTILINGUAL CHATBOT ---
  const chatLanguageSelect = $('#chat-language');
  const chatMessages = $('#chat-messages');
  const chatInputForm = $('#chat-input-form');
  const chatMessageInput = $('#chat-message-input');

  chatLanguageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    showToast(
      `Language switched to ${chatLanguageSelect.options[chatLanguageSelect.selectedIndex].text}`,
      'success'
    );
    const welcomeText = getSimulatedApiResponse('welcome', currentLanguage);
    addMessage(welcomeText, 'assistant');
    speakText(welcomeText);
  });

  $$('.chip-btn').forEach((chip) => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question');
      if (question) {
        chatMessageInput.value = sanitize(question);
        handleChatSubmit();
      }
    });
  });

  const debouncedChatSubmit = debounce(() => {
    handleChatSubmit();
  }, 300);

  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    debouncedChatSubmit();
  });

  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.setAttribute('role', 'log');
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = sanitizeHTML(text);
    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleChatSubmit() {
    const rawQuery = chatMessageInput.value;
    const cleanQuery = sanitize(rawQuery).trim();
    if (!validateInputLength(cleanQuery, 150)) {
      showToast('Please type a valid question (max 150 characters)', 'warning');
      return;
    }
    addMessage(cleanQuery, 'user');
    chatMessageInput.value = '';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message typing-indicator-msg';
    typingDiv.innerHTML = '<div class="message-content"><p>AI is thinking...</p></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      let reply = '';
      if (geminiApiKey) {
        const systemPrompt = `You are ArenaPulse AI, a stadium tournament assistant for FIFA World Cup 2026. Keep answers concise (max 3-4 sentences). Answer the user's prompt in the language code "${currentLanguage}".
        Context:
        - Match: USA vs Mexico today at 8:00 PM. Gates open at 5:00 PM.
        - Bag Policy: Clear bags only < 12x6x12 inches.
        - Transit: Metro line is congested. Suggest Shuttles or Rideshare Hub in Zone F.
        - Diet: Veg, Vegan, Halal stands at Sec 102/Gate C.
        - Accessibility: Elevators at A/B/C. Sensory room next to medical section 104.`;
        reply = await queryGeminiApi(cleanQuery, systemPrompt, geminiApiKey);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        reply = getSimulatedApiResponse(cleanQuery, currentLanguage);
      }
      const typingIndicator = $('.typing-indicator-msg', chatMessages);
      if (typingIndicator) {
        chatMessages.removeChild(typingIndicator);
      }
      addMessage(reply, 'assistant');
      speakText(reply);
    } catch (_error) {
      const typingIndicator = $('.typing-indicator-msg', chatMessages);
      if (typingIndicator) {
        chatMessages.removeChild(typingIndicator);
      }
      showToast('Generative query failed. Reverting to offline simulator.', 'warning');
      const fallbackReply = getSimulatedApiResponse(cleanQuery, currentLanguage);
      addMessage(fallbackReply, 'assistant');
      speakText(fallbackReply);
    }
  }

  // --- OPERATIONS CONTROL HEATMAP ---
  const refreshHeatmapBtn = $('#refresh-heatmap-btn');
  const stadiumHeatmap = $('#stadium-heatmap');
  const statOccupancy = $('#stat-occupancy');
  const statActiveIncidents = $('#stat-active-incidents');
  const statGateFlow = $('#stat-gate-flow');
  const matchStageSelect = $('#match-stage-select');

  if (matchStageSelect) {
    matchStageSelect.addEventListener('change', () => {
      renderHeatmap();
      showToast(`Simulation mode stage: ${matchStageSelect.value}`, 'success');
    });
  }

  refreshHeatmapBtn.addEventListener('click', () => {
    renderHeatmap();
    showToast('Stadium density metrics updated live.', 'success');
  });

  function renderHeatmap() {
    if (!stadiumHeatmap) {
      return;
    }
    stadiumHeatmap.innerHTML = '';
    const occupancyData = generateRandomOccupancy();
    const metrics = calculateHeatmapMetrics(occupancyData);
    const docFragment = document.createDocumentFragment();

    Object.keys(occupancyData).forEach((sec) => {
      const pct = occupancyData[sec];
      let densityClass = 'low';
      if (pct >= 40 && pct < 70) {
        densityClass = 'medium';
      } else if (pct >= 70 && pct < 90) {
        densityClass = 'high';
      } else if (pct >= 90) {
        densityClass = 'critical';
      }
      const cell = document.createElement('div');
      cell.className = `heatmap-cell ${densityClass}`;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-label', `Section ${sec}, Occupancy: ${pct}%`);
      const labelSpan = document.createElement('span');
      labelSpan.className = 'heatmap-cell-lbl';
      labelSpan.textContent = sec;
      const pctSpan = document.createElement('span');
      pctSpan.className = 'heatmap-cell-pct';
      pctSpan.textContent = `${pct}%`;
      cell.appendChild(labelSpan);
      cell.appendChild(pctSpan);

      cell.addEventListener('click', () => {
        const incidentLocInput = $('#incident-location');
        if (incidentLocInput) {
          incidentLocInput.value = `Section ${sec}`;
          showToast(`Selected Section ${sec} for incident reporting.`, 'info');
        }
      });
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cell.click();
        }
      });
      docFragment.appendChild(cell);
    });
    stadiumHeatmap.appendChild(docFragment);
    statOccupancy.textContent = `${metrics.avgOccupancy}%`;
    statActiveIncidents.textContent = String(metrics.criticalCount);
    const flowRate = Math.floor(Math.random() * (1600 - 800) + 800);
    statGateFlow.textContent = `${flowRate}/min`;
    const matchStage = matchStageSelect ? matchStageSelect.value : 'fulltime';
    renderCrowdPredictorNarrative(metrics.avgOccupancy, matchStage);
  }

  function renderCrowdPredictorNarrative(avgOccupancy, matchStage) {
    const predictionBox = $('.transit-alert-box.info-alert');
    if (predictionBox) {
      const narrative = getCrowdDensityPredictionNarrative(avgOccupancy, matchStage);
      const tipTextNode = $('div', predictionBox) || predictionBox;
      tipTextNode.innerHTML = `<strong>Operational Intel:</strong> ${sanitize(narrative)}`;
    }
  }

  // --- OPERATIONS INCIDENT DISPATCH TRIAGE ---
  const incidentReportForm = $('#incident-report-form');
  const triageResultCard = $('#triage-result-card');
  const triagePriorityBadge = $('#triage-priority-badge');
  const triageAssignment = $('#triage-assignment');
  const triageTime = $('#triage-time');
  const triageProtocol = $('#triage-protocol');

  incidentReportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = $('#incident-type').value;
    const location = $('#incident-location').value;
    const details = $('#incident-details').value;
    const cleanLoc = sanitize(location).trim();
    const cleanDetails = sanitize(details).trim();

    if (!validateInputLength(cleanLoc, 40) || !validateInputLength(cleanDetails, 200)) {
      showToast('Invalid location or details character lengths', 'warning');
      return;
    }
    const triageReport = triageIncident(type, cleanLoc, cleanDetails);
    triagePriorityBadge.className = `triage-badge ${triageReport.priority.toLowerCase()}`;
    triagePriorityBadge.textContent = `${triageReport.priority} Priority`;
    triageAssignment.textContent = triageReport.assignment;
    triageTime.textContent = triageReport.time;
    triageProtocol.innerHTML = sanitizeHTML(triageReport.protocol);
    triageResultCard.classList.remove('hidden');
    showToast('GenAI Dispatch Triage completed successfully!', 'success');
    draftPAAnnouncement(type, cleanLoc);
  });

  const announcementTextBox = $('#announcement-text-box');
  const speakAnnouncementBtn = $('#speak-announcement-btn');

  function draftPAAnnouncement(type, location) {
    const draft = generateAnnouncement(type, location);
    announcementTextBox.setAttribute('data-en', draft.en);
    announcementTextBox.setAttribute('data-es', draft.es);
    const activeTab = $('.draft-lang-tab.active');
    const activeLang = activeTab ? activeTab.getAttribute('data-draft-lang') : 'en';
    const draftContent = activeLang === 'es' ? draft.es : draft.en;
    announcementTextBox.innerHTML = `${sanitizeHTML(draftContent)}<br><small style="color:var(--text-muted);display:block;margin-top:10px;">${sanitize(draft.reasoning)}</small>`;
  }

  $$('.draft-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-incident');
      if (presetKey) {
        draftPresetPA(presetKey);
      }
    });
  });

  function draftPresetPA(presetKey) {
    const presetMap = {
      'heavy-rain': {
        en: '⛈️ Attention Fans: Severe weather is expected during stadium egress. For your safety, exit channels at Gate D will be paused. We recommend staying inside the covered concourses until conditions clear.',
        es: '⛈️ Atención Aficionados: Se esperan lluvias intensas durante la salida del estadio. Por su seguridad, el canal de salida en la Puerta D se pausará.',
        reasoning:
          '[AI Reasoning]: Warns outgoing spectators ahead of time to minimize weather-induced gate stampedes.',
      },
      'gate-c-closed': {
        en: '🚫 Operations Alert: Exit Gate C is currently closed due to transit bottlenecking. Please exit via Gate B or Gate A.',
        es: '🚫 Alerta de Operaciones: La Puerta C está temporalmente cerrada. Por favor salgan por la Puerta B o Puerta A.',
        reasoning:
          '[AI Reasoning]: Re-routes exit foot traffic defensively to mitigate crowd densities near Gate C.',
      },
      'metro-delay': {
        en: '🚇 Transit Bulletin: Metro Station Line A is operating with a 40-minute delay. Shuttles are available at Outer Zone F.',
        es: '🚇 Boletín de Tránsito: La línea A del Metro opera con retraso de 40 minutos. Autobuses de enlace en la Zona F.',
        reasoning:
          '[AI Reasoning]: Informs commuters of delay details, offering free alternatives to alleviate crowd build-up.',
      },
    };
    const draft = presetMap[presetKey] || presetMap['metro-delay'];
    announcementTextBox.setAttribute('data-en', draft.en);
    announcementTextBox.setAttribute('data-es', draft.es);
    const activeTab = $('.draft-lang-tab.active');
    const activeLang = activeTab ? activeTab.getAttribute('data-draft-lang') : 'en';
    const draftContent = activeLang === 'es' ? draft.es : draft.en;
    announcementTextBox.innerHTML = `${sanitizeHTML(draftContent)}<br><small style="color:var(--text-muted);display:block;margin-top:10px;">${sanitize(draft.reasoning)}</small>`;
    showToast('Bilingual announcement drafted!', 'success');
  }

  $$('.draft-lang-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.draft-lang-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const selectedLang = tab.getAttribute('data-draft-lang');
      const cachedTxt = announcementTextBox.getAttribute(`data-${selectedLang}`);
      if (cachedTxt) {
        const currentHtml = announcementTextBox.innerHTML;
        const reasoningIndex = currentHtml.indexOf('<br><small');
        const reasoningSuffix = reasoningIndex !== -1 ? currentHtml.substring(reasoningIndex) : '';
        announcementTextBox.innerHTML = sanitizeHTML(cachedTxt) + reasoningSuffix;
      }
    });
  });

  speakAnnouncementBtn.addEventListener('click', () => {
    const textNode = announcementTextBox.cloneNode(true);
    const reasoningBlock = $('small', textNode);
    if (reasoningBlock) {
      textNode.removeChild(reasoningBlock);
    }
    const textToSpeak = textNode.textContent;
    if (textToSpeak && !textToSpeak.includes('Click one of the presets')) {
      const oldState = readAloudEnabled;
      readAloudEnabled = true;
      speakText(textToSpeak);
      readAloudEnabled = oldState;
      showToast('Speaking announcement over PA...', 'success');
    } else {
      showToast('No active announcement to speak', 'warning');
    }
  });

  // --- SUSTAINABILITY: GREEN FAN REWARDS ---
  const ecoActionsForm = $('#eco-actions-form');
  const userEcoPointsSpan = $('#user-eco-points');
  const greenTipText = $('#green-tip-text');

  ecoActionsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const checkedBoxes = $$('input[name="eco-action"]:checked', ecoActionsForm);
    if (checkedBoxes.length === 0) {
      showToast('Please check at least one green activity', 'warning');
      return;
    }
    const selectedIds = checkedBoxes.map((box) => box.value);
    const earnedPoints = calculateSessionPoints(selectedIds);
    userEcoScore += earnedPoints;
    localStorage.setItem('arena_pulse_eco_score', String(userEcoScore));
    userEcoPointsSpan.textContent = String(userEcoScore);
    const badgeLevel = evaluateUserBadgeLevel(userEcoScore);
    const adviceText = getSustainabilityAdvice(earnedPoints, badgeLevel);
    greenTipText.innerHTML = sanitizeHTML(adviceText);
    showToast(`Eco actions logged! +${earnedPoints} EcoScore points!`, 'success');
    checkedBoxes.forEach((box) => {
      box.checked = false;
    });
    updateTransitWaitTimesList();
  });

  function updateTransitWaitTimesList() {
    const activeIncidentsStr = statActiveIncidents.textContent || '0';
    const incidents = parseInt(activeIncidentsStr, 10) || 0;
    transitOptions.forEach((opt) => {
      const waitValue = computeTransitWaitTime(opt.baseWait, incidents);
      const optEl = $(`.transit-item.${opt.id}`);
      if (optEl) {
        const waitEl = $('.transit-wait strong', optEl);
        if (waitEl) {
          waitEl.textContent = `~${waitValue} mins`;
        }
      }
    });
    const tipContainer = $('.transit-alert-box div');
    if (tipContainer) {
      const rawTip = getTransitTip(incidents > 1 ? 'metro-a' : 'clear');
      tipContainer.innerHTML = sanitizeHTML(rawTip);
    }
  }

  // --- PRIVATE UTILITIES ---

  function initSettings() {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
      highContrastToggle.checked = true;
    }
    if (textSize !== 'normal') {
      document.body.classList.remove('font-large', 'font-extra-large');
      if (textSize === 'large') {
        document.body.classList.add('font-large');
      } else if (textSize === 'extra-large') {
        document.body.classList.add('font-extra-large');
      }
      fontSizeSelect.value = textSize;
    }
    textSpeechToggle.checked = readAloudEnabled;
    userEcoPointsSpan.textContent = String(userEcoScore);
    updateApiStatusIndicator();
  }

  function updateApiStatusIndicator() {
    const statusDot = $('.connection-status .status-indicator');
    const statusLabel = $('.connection-status .status-label');
    if (geminiApiKey) {
      statusLabel.textContent = 'Gemini 2.5 Active';
      statusDot.className = 'status-indicator online';
      apiKeyInput.value = geminiApiKey;
    } else {
      statusLabel.textContent = 'Simulated AI Active';
      statusDot.className = 'status-indicator offline';
      apiKeyInput.value = '';
    }
  }

  function speakText(text) {
    if (!readAloudEnabled || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/(?:🎒|🚇|♿|🌭|🏆|⚽|⭐|📢|⛈️|🚫|🌱)/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voiceLangs = {
      es: 'es-ES',
      fr: 'fr-FR',
      pt: 'pt-BR',
      ar: 'ar-SA',
      ja: 'ja-JP',
    };
    utterance.lang = voiceLangs[currentLanguage] || 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  function showToast(text, type = 'info') {
    const toastDiv = $('#toast');
    const toastTxt = $('#toast-text');
    const toastIco = $('#toast-icon');
    if (!toastDiv || !toastTxt) {
      return;
    }
    toastTxt.textContent = text;
    toastDiv.classList.remove('hidden', 'toast-success', 'toast-warning', 'toast-info');
    if (type === 'success') {
      toastIco.setAttribute('data-lucide', 'check-circle');
      toastDiv.classList.add('toast-success');
    } else if (type === 'warning') {
      toastIco.setAttribute('data-lucide', 'alert-triangle');
      toastDiv.classList.add('toast-warning');
    } else {
      toastIco.setAttribute('data-lucide', 'bell');
      toastDiv.classList.add('toast-info');
    }
    if (typeof window.lucide !== 'undefined') {
      window.lucide.createIcons();
    }
    setTimeout(() => {
      toastDiv.classList.add('hidden');
    }, 4000);
  }

  // --- INITIALIZE UI ENVIRONMENT ---
  initSettings();
  renderHeatmap();

  // Lazy-load Lucide Icons
  if (typeof window.lucide !== 'undefined') {
    window.lucide.createIcons();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
