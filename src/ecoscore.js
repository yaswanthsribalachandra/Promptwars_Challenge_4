/**
 * @fileoverview Sustainability tracker: EcoScore calculations, levels, and green recommendations.
 */

import { ecoActions } from './constants.js';

export { ecoActions };

/**
 * Calculates total session points based on logged actions.
 * Defensive checking on inputs.
 *
 * @param {string[]} selectedActionIds - Array of selected eco actions.
 * @returns {number} Points generated in this session.
 */
export function calculateSessionPoints(selectedActionIds) {
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
 * Evaluates the user badge level based on cumulative EcoScore points.
 *
 * @param {number} totalPoints - Combined historical points.
 * @returns {string} Level badge name.
 */
export function evaluateUserBadgeLevel(totalPoints) {
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
 * Generates custom AI sustainability tip text based on points and level badge.
 *
 * @param {number} sessionPoints - Points generated in this session.
 * @param {string} badgeLevel - Active reward level badge name.
 * @returns {string} Custom advice tip.
 */
export function getSustainabilityAdvice(sessionPoints, badgeLevel) {
  if (sessionPoints >= 80) {
    return `⭐ Awesome! You unlocked the **${badgeLevel}** badge! By taking public transit and recycling today, you saved approximately 1,200g of CO2 emissions. Show this screen at concessions near Section 102 for a 15% discount on reusable souvenir cups!`;
  }
  return `🌱 Good job! You added ${sessionPoints} points to your EcoScore. Continue recycling and clean your section to earn the Green Champion badge. Level: **${badgeLevel}**. Did you know recycling just one plastic bottle powers stadium lighting for 10 minutes?`;
}
