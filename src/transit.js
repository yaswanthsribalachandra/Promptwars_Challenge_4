/**
 * @fileoverview Smart transit helper: manages transit lines and computes Wait times
 * and congestion recommendations.
 */

/**
 * Transit option configuration dictionary.
 */
export const transitOptions = [
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

/**
 * Computes dynamic wait times based on active operations incidents count and base times.
 *
 * @param {number} baseWaitMinutes - Standard wait time.
 * @param {number} activeIncidentsCount - Number of critical operations alerts.
 * @returns {number} Estimated wait minutes.
 */
export function computeTransitWaitTime(baseWaitMinutes, activeIncidentsCount) {
  const cleanIncidents = Math.max(0, parseInt(activeIncidentsCount, 10) || 0);
  const cleanBase = Math.max(0, parseInt(baseWaitMinutes, 10) || 0);
  // Each critical incident adds 5 minutes to wait times due to logistics delays
  return cleanBase + cleanIncidents * 5;
}

/**
 * Returns dynamic transit recommendation tip.
 *
 * @param {string} highestCongestionOptionId - ID of option experiencing heavy queue.
 * @returns {string} Transit guidance tip.
 */
export function getTransitTip(highestCongestionOptionId) {
  if (highestCongestionOptionId === 'metro-a') {
    return '🚇 **AI Transit Tip:** Metro Line A is highly congested due to the post-game rush. We recommend walking along the green pathway to the Shuttles or Rideshare Hub in Zone F to save 20 minutes.';
  }
  return '🚌 **AI Transit Tip:** Transit lines are operating normally. Shuttles are currently the most efficient green transit method available.';
}
