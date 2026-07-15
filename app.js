/**
 * @fileoverview Main entry point of ArenaPulse AI.
 * Bootstraps ES6 feature modules, registers debounced event handlers,
 * validates inputs defensively, handles speech accessibility, and batches DOM updates.
 */

import {
  $,
  $$,
  sanitize,
  sanitizeHTML,
  getValidatedLocalStorageInt,
  getValidatedLocalStorageBool,
  debounce,
} from './src/utils.js';

import { queryGeminiApi } from './src/api.js';

import {
  parseSeatSection,
  getClosestGate,
  generateSvgRoutePath,
  getWayfindingTextDirections,
} from './src/wayfinding.js';

import { getSimulatedApiResponse } from './src/chatbot.js';

import {
  generateRandomOccupancy,
  calculateHeatmapMetrics,
  triageIncident,
  generateAnnouncement,
  getCrowdDensityPredictionNarrative,
} from './src/dashboard.js';

import { transitOptions, computeTransitWaitTime, getTransitTip } from './src/transit.js';

import {
  calculateSessionPoints,
  evaluateUserBadgeLevel,
  getSustainabilityAdvice,
} from './src/ecoscore.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE VARIABLES (Validated from LocalStorage) ---
  let currentLanguage = 'en';
  let geminiApiKey = localStorage.getItem('arena_pulse_gemini_key') || '';
  let isHighContrast = getValidatedLocalStorageBool('arena_pulse_high_contrast', false);
  let textSize = localStorage.getItem('arena_pulse_text_size') || 'normal';
  let readAloudEnabled = getValidatedLocalStorageBool('arena_pulse_read_aloud', false);
  let userEcoScore = getValidatedLocalStorageInt('arena_pulse_eco_score', 0);

  // Validate API key syntax lightly (must not contain spaces or control chars)
  if (geminiApiKey && /[\s<>]/.test(geminiApiKey)) {
    geminiApiKey = '';
    localStorage.removeItem('arena_pulse_gemini_key');
  }

  // Validate text size values to prevent stylesheet injections
  if (!['normal', 'large', 'extra-large'].includes(textSize)) {
    textSize = 'normal';
  }

  // --- INITIALIZE UI ENVIRONMENT ---
  initSettings();
  renderHeatmap();

  // Lazy-load Lucide Icons
  if (typeof window.lucide !== 'undefined') {
    window.lucide.createIcons();
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
    // Validate key string defensively
    if (/[\s<>]/.test(rawVal)) {
      showToast('Invalid API key format', 'warning');
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

    // Batch DOM updates
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

    // Batch updates to font layout classes
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

  // Debounced seat locator trigger (300ms delay to prevent layout thrashing)
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

  // Interactive Gate pulse markers click mappings
  $$('.gate-marker').forEach((marker) => {
    marker.addEventListener('click', () => {
      const gateName = marker.getAttribute('data-gate');
      if (gateName) {
        seatCodeInput.value = sanitize(gateName);
        debouncedLocateSeat();
      }
    });
  });

  /**
   * Evaluates seat code input, updates the SVG routing line, and renders instructions.
   */
  function locateUserSeat() {
    const rawInput = seatCodeInput.value;
    const cleanInput = sanitize(rawInput);
    if (!cleanInput) {
      showToast('Please enter a valid seat code', 'warning');
      return;
    }

    const section = parseSeatSection(cleanInput);
    const closestGate = getClosestGate(section);
    const useAccessible = accessibilityRouteToggle.checked;

    // SVG routing path coordinates computation
    const pathDString = generateSvgRoutePath(closestGate, section, useAccessible);

    // SVG standing target coordinates
    const standMap = {
      101: { cx: 200, cy: 60 },
      102: { cx: 55, cy: 200 },
      104: { cx: 200, cy: 340 },
      105: { cx: 345, cy: 200 },
    };
    const targetCoords = standMap[section] || { cx: 200, cy: 60 };

    // Batch SVG updates to avoid document reflow cycles
    wayfindingRoute.setAttribute('d', pathDString);
    mapTargetPin.setAttribute('transform', `translate(${targetCoords.cx}, ${targetCoords.cy})`);
    mapTargetPin.classList.remove('hidden');

    $$('.map-section').forEach((s) => s.classList.remove('active-target'));
    const svgSection = $(`.sec-${section}`);
    if (svgSection) {
      svgSection.classList.add('active-target');
    }

    // Sanitize and update HTML instructions
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

  // Debounced chat submission (300ms)
  const debouncedChatSubmit = debounce(() => {
    handleChatSubmit();
  }, 300);

  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    debouncedChatSubmit();
  });

  /**
   * Renders a message element into the chat list.
   * Prevents XSS script execution by sanitizing content before writing.
   *
   * @param {string} text - Message text snippet (supports allowed formatting tags).
   * @param {string} sender - Sender ID ('user', 'assistant', 'system').
   */
  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.setAttribute('role', 'log');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    // XSS sanitization check
    contentDiv.innerHTML = sanitizeHTML(text);

    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);

    // Smooth scrolling list batching
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Processes chatbot queries, queries real API or local simulated lookup, and updates DOM.
   */
  async function handleChatSubmit() {
    const rawQuery = chatMessageInput.value;
    const cleanQuery = sanitize(rawQuery).trim();
    if (!cleanQuery) {
      return;
    }

    addMessage(cleanQuery, 'user');
    chatMessageInput.value = '';

    // Render typing placeholder
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
        // Fallback simulated engine response
        await new Promise((resolve) => setTimeout(resolve, 800));
        reply = getSimulatedApiResponse(cleanQuery, currentLanguage);
      }

      // Remove typing placeholder
      const typingIndicator = $('.typing-indicator-msg', chatMessages);
      if (typingIndicator) {
        chatMessages.removeChild(typingIndicator);
      }

      addMessage(reply, 'assistant');
      speakText(reply);
    } catch (error) {
      const typingIndicator = $('.typing-indicator-msg', chatMessages);
      if (typingIndicator) {
        chatMessages.removeChild(typingIndicator);
      }
      addMessage(
        'Apologies, I encountered an error querying the generative model. Please check your API key configuration or network.',
        'assistant'
      );
    }
  }

  // --- OPERATIONS CONTROL heatmaps ---
  const refreshHeatmapBtn = $('#refresh-heatmap-btn');
  const stadiumHeatmap = $('#stadium-heatmap');
  const statOccupancy = $('#stat-occupancy');
  const statActiveIncidents = $('#stat-active-incidents');
  const statGateFlow = $('#stat-gate-flow');

  refreshHeatmapBtn.addEventListener('click', () => {
    renderHeatmap();
    showToast('Stadium density metrics updated live.', 'success');
  });

  /**
   * Generates occupancies, builds visual grid elements, and updates stats.
   * Avoids layout-thrashing by batching DOM element injections.
   */
  function renderHeatmap() {
    if (!stadiumHeatmap) {
      return;
    }

    // Clear elements
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

      // Interactive click selector
      cell.addEventListener('click', () => {
        const incidentLocInput = $('#incident-location');
        if (incidentLocInput) {
          incidentLocInput.value = `Section ${sec}`;
          showToast(`Selected Section ${sec} for incident reporting.`, 'info');
        }
      });

      // Keyboard navigation select binding
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cell.click();
        }
      });

      docFragment.appendChild(cell);
    });

    // Batch append to prevent multiple repaints
    stadiumHeatmap.appendChild(docFragment);

    // Update aggregate stats
    statOccupancy.textContent = `${metrics.avgOccupancy}%`;
    statActiveIncidents.textContent = String(metrics.criticalCount);

    const flowRate = Math.floor(Math.random() * (1600 - 800) + 800);
    statGateFlow.textContent = `${flowRate}/min`;

    // Render GenAI narrative crowd predictions based on metrics
    renderCrowdPredictorNarrative(metrics.avgOccupancy);
  }

  /**
   * Updates prediction narrative alert banner based on crowd predictions.
   *
   * @param {number} avgOccupancy - Total current stadium occupancy percent.
   */
  function renderCrowdPredictorNarrative(avgOccupancy) {
    const predictionBox = $('.transit-alert-box.info-alert');
    if (predictionBox) {
      const narrative = getCrowdDensityPredictionNarrative(avgOccupancy);
      // Clean previous tip and append narrative prediction
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

    if (!cleanLoc || !cleanDetails) {
      showToast('Please fill out all incident details', 'warning');
      return;
    }

    // Process Triage calculations
    const triageReport = triageIncident(type, cleanLoc, cleanDetails);

    // Batch updates to UI
    triagePriorityBadge.className = `triage-badge ${triageReport.priority.toLowerCase()}`;
    triagePriorityBadge.textContent = `${triageReport.priority} Priority`;
    triageAssignment.textContent = triageReport.assignment;
    triageTime.textContent = triageReport.time;
    triageProtocol.innerHTML = sanitizeHTML(triageReport.protocol);

    triageResultCard.classList.remove('hidden');
    showToast('GenAI Dispatch Triage completed successfully!', 'success');

    // Run announcement drafter reasoning
    draftPAAnnouncement(type, cleanLoc);
  });

  const announcementTextBox = $('#announcement-text-box');
  const speakAnnouncementBtn = $('#speak-announcement-btn');

  /**
   * Helper to draft PA announcements, caching multilingual translations and reasoning.
   *
   * @param {string} type - Incident category.
   * @param {string} location - Selected stadium sector or gate.
   */
  function draftPAAnnouncement(type, location) {
    const draft = generateAnnouncement(type, location);

    announcementTextBox.setAttribute('data-en', draft.en);
    announcementTextBox.setAttribute('data-es', draft.es);

    const activeTab = $('.draft-lang-tab.active');
    const activeLang = activeTab ? activeTab.getAttribute('data-draft-lang') : 'en';

    // Renders the announcement text combined with AI Reasoning explanation
    const draftContent = activeLang === 'es' ? draft.es : draft.en;
    announcementTextBox.innerHTML = `${sanitizeHTML(draftContent)}<br><small style="color:var(--text-muted);display:block;margin-top:10px;">${sanitize(draft.reasoning)}</small>`;
  }

  // Announcement preset buttons configuration
  $$('.draft-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-incident');
      if (presetKey) {
        draftPresetPA(presetKey);
      }
    });
  });

  /**
   * Generates preset announcements from action keys.
   *
   * @param {string} presetKey - Unique ID key.
   */
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

  // Language selectors within announcement tabs
  $$('.draft-lang-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.draft-lang-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const selectedLang = tab.getAttribute('data-draft-lang');
      const cachedTxt = announcementTextBox.getAttribute(`data-${selectedLang}`);
      if (cachedTxt) {
        // Maintain the JSDoc reasoning block if present
        const currentHtml = announcementTextBox.innerHTML;
        const reasoningIndex = currentHtml.indexOf('<br><small');
        const reasoningSuffix = reasoningIndex !== -1 ? currentHtml.substring(reasoningIndex) : '';
        announcementTextBox.innerHTML = sanitizeHTML(cachedTxt) + reasoningSuffix;
      }
    });
  });

  speakAnnouncementBtn.addEventListener('click', () => {
    const textNode = announcementTextBox.cloneNode(true);
    // Remove reasoning block prior to speech voice output
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

    // Extract values
    const selectedIds = checkedBoxes.map((box) => box.value);
    const earnedPoints = calculateSessionPoints(selectedIds);

    userEcoScore += earnedPoints;
    localStorage.setItem('arena_pulse_eco_score', String(userEcoScore));
    userEcoPointsSpan.textContent = String(userEcoScore);

    const badgeLevel = evaluateUserBadgeLevel(userEcoScore);
    const adviceText = getSustainabilityAdvice(earnedPoints, badgeLevel);

    // Sanitize and render green tips
    greenTipText.innerHTML = sanitizeHTML(adviceText);
    showToast(`Eco actions logged! +${earnedPoints} EcoScore points!`, 'success');

    // Uncheck boxes
    checkedBoxes.forEach((box) => {
      box.checked = false;
    });

    // Update wait times of transit options to reflect green changes
    updateTransitWaitTimesList();
  });

  /**
   * Dynamically renders Wait times for transportation items.
   * Relies on the number of critical operations incidents.
   */
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

    // Re-render transit tips
    const tipContainer = $('.transit-alert-box div');
    if (tipContainer) {
      const rawTip = getTransitTip(incidents > 1 ? 'metro-a' : 'clear');
      tipContainer.innerHTML = sanitizeHTML(rawTip);
    }
  }

  // --- PRIVATE UTILITIES ---

  /**
   * Initializes local configurations, sets checkbox states, and reads localStorage.
   */
  function initSettings() {
    // Setup high contrast toggle state
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
      highContrastToggle.checked = true;
    }

    // Setup Text sizing configuration
    if (textSize !== 'normal') {
      document.body.classList.remove('font-large', 'font-extra-large');
      if (textSize === 'large') {
        document.body.classList.add('font-large');
      } else if (textSize === 'extra-large') {
        document.body.classList.add('font-extra-large');
      }
      fontSizeSelect.value = textSize;
    }

    // Setup Read Aloud state
    textSpeechToggle.checked = readAloudEnabled;

    // Display Eco points
    userEcoPointsSpan.textContent = String(userEcoScore);

    // Update API client status badge indicator
    updateApiStatusIndicator();
  }

  /**
   * Syncs connection status label and indicator dot depending on API key settings.
   */
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

  /**
   * Triggers browser Text-to-Speech (speechSynthesis) to read directions/QA.
   * Restricts reading to active preference.
   *
   * @param {string} text - Raw instruction text.
   */
  function speakText(text) {
    if (!readAloudEnabled || !('speechSynthesis' in window)) {
      return;
    }

    // Stop ongoing speech executions
    window.speechSynthesis.cancel();

    // Remove markup tags and emojis to keep speech clean
    const cleanText = text
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/(?:🎒|🚇|♿|🌭|🏆|⚽|⭐|📢|⛈️|🚫|🌱)/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Assign voice language code matching page selection
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

  /**
   * Displays an interactive toast notification alert.
   *
   * @param {string} text - Notification text.
   * @param {string} [type='info'] - Color category ('success', 'warning', 'info').
   */
  function showToast(text, type = 'info') {
    const toastDiv = $('#toast');
    const toastTxt = $('#toast-text');
    const toastIco = $('#toast-icon');

    if (!toastDiv || !toastTxt) {
      return;
    }

    toastTxt.textContent = text;
    toastDiv.classList.remove('hidden');

    // Dynamically assign theme colors
    toastDiv.style.borderColor = 'var(--border-color)';
    if (type === 'success') {
      toastIco.setAttribute('data-lucide', 'check-circle');
      toastDiv.style.borderColor = 'var(--color-success)';
    } else if (type === 'warning') {
      toastIco.setAttribute('data-lucide', 'alert-triangle');
      toastDiv.style.borderColor = 'var(--color-warning)';
    } else {
      toastIco.setAttribute('data-lucide', 'bell');
    }

    if (typeof window.lucide !== 'undefined') {
      window.lucide.createIcons();
    }

    // Automatic trigger timeout
    setTimeout(() => {
      toastDiv.classList.add('hidden');
    }, 4000);
  }
});
