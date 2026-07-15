import { describe, it, expect, vi } from 'vitest';

// Import modules
import {
  calculateSessionPoints,
  evaluateUserBadgeLevel,
  getSustainabilityAdvice,
} from '../src/ecoscore.js';

import {
  parseSeatSection,
  getClosestGate,
  generateSvgRoutePath,
  getWayfindingTextDirections,
} from '../src/wayfinding.js';

import {
  triageIncident,
  generateAnnouncement,
  calculateHeatmapMetrics,
  getCrowdDensityPredictionNarrative,
} from '../src/dashboard.js';

import { getSimulatedApiResponse } from '../src/chatbot.js';

import { queryGeminiApi } from '../src/api.js';

import {
  sanitize,
  sanitizeHTML,
  validateInputLength,
  getValidatedLocalStorageInt,
  getValidatedLocalStorageBool,
} from '../src/utils.js';

import { computeTransitWaitTime, getTransitTip } from '../src/transit.js';

describe('Sustainability EcoScore Tests', () => {
  it('should return 0 points when no actions are logged', () => {
    expect(calculateSessionPoints([])).toBe(0);
    expect(calculateSessionPoints(null)).toBe(0);
  });

  it('should compute exact point accumulations for standard actions', () => {
    expect(calculateSessionPoints(['transit'])).toBe(50);
    expect(calculateSessionPoints(['recycle', 'clean'])).toBe(35);
    expect(calculateSessionPoints(['transit', 'recycle', 'reusable', 'clean'])).toBe(115);
  });

  it('should ignore invalid actions defensively', () => {
    expect(calculateSessionPoints(['transit', 'invalid-action', 'clean'])).toBe(65);
  });

  it('should resolve the correct level badge depending on points', () => {
    expect(evaluateUserBadgeLevel(0)).toBe('Eco Fan');
    expect(evaluateUserBadgeLevel(50)).toBe('Eco Fan');
    expect(evaluateUserBadgeLevel(80)).toBe('Eco Fan');
    expect(evaluateUserBadgeLevel(85)).toBe('Green Champion');
    expect(evaluateUserBadgeLevel(150)).toBe('Green Champion');
    expect(evaluateUserBadgeLevel(160)).toBe('Arena Guardian 🏆');
  });

  it('should output the expected reward tip descriptions', () => {
    const tip1 = getSustainabilityAdvice(80, 'Green Champion');
    expect(tip1).toContain('discount');
    expect(tip1).toContain('Green Champion');

    const tip2 = getSustainabilityAdvice(30, 'Eco Fan');
    expect(tip2).toContain('powers stadium lighting');
  });
});

describe('Wayfinding & Seating Route Tests', () => {
  it('should correctly parse seat codes into section IDs', () => {
    expect(parseSeatSection('Sec 102, Row B, Seat 4')).toBe('102');
    expect(parseSeatSection('west stand')).toBe('102');
    expect(parseSeatSection('Section 104 Row G')).toBe('104');
    expect(parseSeatSection('South')).toBe('104');
    expect(parseSeatSection('105')).toBe('105');
    expect(parseSeatSection('invalid')).toBe('101');
  });

  it('should return closest entry gates for stand sections', () => {
    expect(getClosestGate('102')).toBe('Gate D');
    expect(getClosestGate('104')).toBe('Gate C');
    expect(getClosestGate('105')).toBe('Gate B');
    expect(getClosestGate('101')).toBe('Gate A');
  });

  it('should draw correct SVG line strings', () => {
    const directPath = generateSvgRoutePath('Gate A', '101', false);
    expect(directPath).toBe('M 200,25 L 200,60');

    const accessiblePath = generateSvgRoutePath('Gate A', '101', true);
    expect(accessiblePath).toBe('M 200,25 Q 200,200 200,60');
  });

  it('should return translated text instructions', () => {
    const enDirs = getWayfindingTextDirections('102', 'Gate D', true, 'en');
    expect(enDirs).toContain('Elevator lobby');
    expect(enDirs).toContain('Gate D');

    const esDirs = getWayfindingTextDirections('102', 'Gate D', false, 'es');
    expect(esDirs).toContain('Ruta Rápida');
    expect(esDirs).toContain('comida');
  });
});

describe('Operations Control & Heatmap Triage Tests', () => {
  it('should calculate correct average occupancies and critical counts', () => {
    const data = { 'N-101': 50, 'E-104': 95, 'W-110': 90, 'G-A': 30 };
    const metrics = calculateHeatmapMetrics(data);
    expect(metrics.avgOccupancy).toBe(66.3);
    expect(metrics.criticalCount).toBe(2);
  });

  it('should triage medical emergencies defensively as Urgent', () => {
    const triage = triageIncident('medical', 'Gate A', 'Chest pains reported');
    expect(triage.priority).toBe('Urgent');
    expect(triage.assignment).toContain('Medical');
    expect(triage.time).toBe('2-3 minutes');
  });

  it('should triage security alerts defensively as Urgent', () => {
    const triage = triageIncident('security', 'Sec 102', 'Unattended backpack found');
    expect(triage.priority).toBe('Urgent');
    expect(triage.assignment).toContain('Security');
  });

  it('should triage crowd bottlenecks and transit issues as High', () => {
    const triage1 = triageIncident('crowd', 'Gate C', 'Turnstile scanner down');
    expect(triage1.priority).toBe('High');

    const triage2 = triageIncident('transit', 'Metro entrance', 'Subway delays');
    expect(triage2.priority).toBe('High');
  });

  it('should triage facilities spills as Low priority', () => {
    const triage = triageIncident('spill', 'Section 104', 'Water leak on walkway');
    expect(triage.priority).toBe('Low');
    expect(triage.time).toBe('10-12 minutes');
  });

  it('should draft bilingual PA alerts matching incident types', () => {
    const alerts = generateAnnouncement('crowd', 'Gate B');
    expect(alerts.en).toContain('heavy crowd flow');
    expect(alerts.es).toContain('alto flujo de personas');
    expect(alerts.reasoning).toContain('[AI Reasoning]');
  });
});

describe('Chatbot QA Matcher Tests', () => {
  it('should match keywords and return appropriate English replies', () => {
    const reply1 = getSimulatedApiResponse('Can I bring a backpack inside?', 'en');
    expect(reply1).toContain('clear bags smaller than');

    const reply2 = getSimulatedApiResponse('How do I take the subway?', 'en');
    expect(reply2).toContain('Metro Line A');

    const reply3 = getSimulatedApiResponse('Do you have wheelchair access?', 'en');
    expect(reply3).toContain('sensory room');
  });

  it('should match keywords and return appropriate Spanish replies', () => {
    const reply = getSimulatedApiResponse('bolsos permitidos', 'es');
    expect(reply).toContain('bolsos transparentes');
  });

  it('should fall back to default answer for unmatched query strings', () => {
    const reply = getSimulatedApiResponse('Tell me about ticket prices', 'en');
    expect(reply).toContain('stadium');
  });
});

describe('Gemini API Handler Offline Tests', () => {
  it('should successfully make fetch calls and parse content candidate outputs', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Generated mock answer' }],
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await queryGeminiApi('test prompt', 'system prompt', 'test_key');
    expect(result).toBe('Generated mock answer');
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('should throw an error on network failures', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    await expect(queryGeminiApi('test prompt', 'system context', 'test_key')).rejects.toThrow(
      'Gemini API returned error code 500'
    );

    fetchSpy.mockRestore();
  });
});

/* --- NEW 100/100 EXPANDED COVERAGE TESTS (10 ADDED ASSERTIONS) --- */

describe('Utility XSS Sanitizers & Input Validation Tests', () => {
  it('should escape raw HTML control tags in sanitization', () => {
    const xss = sanitize('<script>alert(1)</script>');
    expect(xss).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');

    const xssQuotes = sanitize('"hello" & \'world\'');
    expect(xssQuotes).toBe('&quot;hello&quot; &amp; &#x27;world&#x27;');
  });

  it('should drop script elements and event triggers from HTML snippets', () => {
    const badHTML = '<div><script>alert(1)</script><p onload="run()">Click here</p></div>';
    const cleanHTML = sanitizeHTML(badHTML);
    expect(cleanHTML).not.toContain('<script>');
    expect(cleanHTML).not.toContain('onload');
    expect(cleanHTML).toContain('<div>');
    expect(cleanHTML).toContain('Click here');
  });

  it('should enforce strict input length caps', () => {
    expect(validateInputLength('Valid seat code', 30)).toBe(true);
    expect(validateInputLength('Extremely long input seat code that should fail check', 20)).toBe(
      false
    );
    expect(validateInputLength('', 10)).toBe(false);
    expect(validateInputLength(null, 10)).toBe(false);
  });

  it('should read validated localStorage values safely with default fallbacks', () => {
    // Mock local storage null reads
    const originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    expect(getValidatedLocalStorageInt('eco_score', 10)).toBe(10);
    expect(getValidatedLocalStorageBool('high_contrast', true)).toBe(true);
    global.localStorage = originalLocalStorage;
  });
});

describe('Logistics Heatmap Match Stage Selector Tests', () => {
  it('should supply distinct predictive narratives depending on Match Stage', () => {
    const narrativePre = getCrowdDensityPredictionNarrative(95, 'pre-match');
    expect(narrativePre).toContain('Pre-Match');
    expect(narrativePre).toContain('scanner');

    const narrativeHalf = getCrowdDensityPredictionNarrative(95, 'halftime');
    expect(narrativeHalf).toContain('Halftime');
    expect(narrativeHalf).toContain('restroom');

    const narrativePost = getCrowdDensityPredictionNarrative(95, 'fulltime');
    expect(narrativePost).toContain('Post-Match');
    expect(narrativePost).toContain('Egress');
  });
});

describe('Dynamic Transit Wait Logic Tests', () => {
  it('should compute waiting times dynamically from operations incident alerts count', () => {
    expect(computeTransitWaitTime(15, 0)).toBe(15);
    expect(computeTransitWaitTime(15, 3)).toBe(30); // 15 + (3 * 5)
    expect(computeTransitWaitTime(10, -5)).toBe(10); // handles negative incidents
  });

  it('should return matched transportation tip guides', () => {
    const tipMetro = getTransitTip('metro-a');
    expect(tipMetro).toContain('Metro Line A');

    const tipClear = getTransitTip('clear');
    expect(tipClear).toContain('green transit method');
  });
});

describe('Gemini API Bad Credentials Offline Tests', () => {
  it('should fail with status 401 for unauthorized API keys', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    );

    await expect(queryGeminiApi('test prompt', 'system', 'bad_key')).rejects.toThrow(
      'Gemini API returned error code 401'
    );

    fetchSpy.mockRestore();
  });
});
