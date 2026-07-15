/**
 * @fileoverview General utility functions for DOM manipulation, input sanitization,
 * localStorage validation, and input debouncing.
 */

/**
 * Helper to select a single DOM element.
 * @param {string} selector - CSS selector query.
 * @param {Element} [context=document] - Optional context element to search within.
 * @returns {Element|null} The matching DOM element or null.
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Helper to select multiple DOM elements as an Array.
 * @param {string} selector - CSS selector query.
 * @param {Element} [context=document] - Optional context element to search within.
 * @returns {Element[]} Array of matching elements.
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Sanitizes input string to prevent cross-site scripting (XSS) by encoding html entities.
 * @param {string} str - Raw input string.
 * @returns {string} Sanitized string.
 */
export function sanitize(str) {
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
 * Sanitizes text with allowed structural formatting tags (e.g., <strong>, <p>, <br>)
 * while dropping potential vector tags like <script>, <iframe>, or events.
 * @param {string} html - Raw HTML snippet.
 * @returns {string} Sanitized HTML string.
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }
  // Remove script tags, iframe, onload, onerror handlers, javascript: links
  return html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, '');
}

/**
 * Validates and reads integer values from local storage.
 * @param {string} key - Cache key.
 * @param {number} defaultValue - Default fallback value if invalid or empty.
 * @returns {number} Validated integer value.
 */
export function getValidatedLocalStorageInt(key, defaultValue) {
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
export function getValidatedLocalStorageBool(key, defaultValue) {
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
export function debounce(func, wait) {
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
