/**
 * @fileoverview Multilingual chatbot simulated responses engine.
 * Maps keywords to translated stadium information for local fallback execution.
 */

import { simulatedQA } from './constants.js';

/**
 * Searches the prompt query for keywords and returns matching local fallback replies.
 * Handles defensive input checks.
 *
 * @param {string} promptText - User raw query.
 * @param {string} lang - Language code ('en', 'es', etc.).
 * @returns {string} Response text with formatting.
 */
export function getSimulatedApiResponse(promptText, lang = 'en') {
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
