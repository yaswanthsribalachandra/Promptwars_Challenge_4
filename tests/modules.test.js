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

import { triageIncident, generateAnnouncement, calculateHeatmapMetrics } from '../src/dashboard.js';

import { getSimulatedApiResponse } from '../src/chatbot.js';

import { queryGeminiApi } from '../src/api.js';

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

    // Spy on global fetch
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
