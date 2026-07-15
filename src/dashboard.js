/**
 * @fileoverview Operations Control panel logic including crowd density grids,
 * live heatmap generation, incident triage, and AI-reasoned announcements helper.
 */

export const heatmapSections = [
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

/**
 * Generates an object of randomized section occupancy levels.
 *
 * @returns {Record<string, number>} Section occupancy map.
 */
export function generateRandomOccupancy() {
  const data = {};
  heatmapSections.forEach((section) => {
    // Generate occupancy between 25% and 98%
    data[section] = Math.floor(Math.random() * (98 - 25) + 25);
  });
  return data;
}

/**
 * Calculates aggregate crowd metrics from section occupancies.
 *
 * @param {Record<string, number>} data - Section occupancy mapping.
 * @returns {{ avgOccupancy: number, criticalCount: number }} Aggregate metrics.
 */
export function calculateHeatmapMetrics(data) {
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
 * Dynamically triages venue incidents using operational intelligence rules,
 * supplying rich GenAI-reasoned dispatch directives and estimated response times.
 * Defensive checking on parameters.
 *
 * @param {string} type - Incident category ('medical', 'security', 'spill', 'crowd', 'transit').
 * @param {string} location - Selected stadium sector or gate.
 * @param {string} details - Detailed text description.
 * @returns {{ priority: string, assignment: string, time: string, protocol: string }} Triage report.
 */
export function triageIncident(type, location, details) {
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
 * Generates an AI-reasoned bilingual stadium announcement and announcer reasoning,
 * customized dynamically to the incident type and location.
 *
 * @param {string} type - Incident category ('medical', 'security', 'spill', 'crowd', 'transit').
 * @param {string} location - Selected stadium sector or gate.
 * @returns {{ en: string, es: string, reasoning: string }} Announcement details.
 */
export function generateAnnouncement(type, location) {
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
 * Returns narrative predictions for crowd density based on occupancy rates.
 *
 * @param {number} occupancyPct - Total current stadium occupancy percent.
 * @returns {string} Narrative prediction.
 */
export function getCrowdDensityPredictionNarrative(occupancyPct) {
  if (occupancyPct >= 90) {
    return '🚨 [AI Crowd Predictor]: CRITICAL congestion. Exit wait times will exceed 40 minutes. Recommendation: Delay post-game gate opening for upper tiers, hold fans in stands for 15 mins to ease exit bottlenecks.';
  }
  if (occupancyPct >= 70) {
    return '⚠️ [AI Crowd Predictor]: HIGH congestion. Shuttles and Metro stations are experiencing heavy queues. Recommendation: Open auxiliary gates B and C immediately.';
  }
  return '✅ [AI Crowd Predictor]: MODERATE congestion. Normal operations. Exit patterns flowing smoothly.';
}
