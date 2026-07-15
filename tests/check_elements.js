/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const expectedIds = [
  'api-config-btn',
  'api-modal',
  'api-modal-close',
  'save-api-key-btn',
  'clear-api-key-btn',
  'api-key-input',
  'accessibility-toggle-btn',
  'accessibility-modal',
  'accessibility-modal-close',
  'high-contrast-toggle',
  'text-speech-toggle',
  'font-size-select',
  'locate-seat-btn',
  'seat-code',
  'accessibility-route-toggle',
  'directions-text',
  'wayfinding-route',
  'map-target-pin',
  'chat-language',
  'chat-messages',
  'chat-input-form',
  'chat-message-input',
  'refresh-heatmap-btn',
  'stadium-heatmap',
  'stat-occupancy',
  'stat-active-incidents',
  'stat-gate-flow',
  'match-stage-select',
  'incident-report-form',
  'triage-result-card',
  'triage-priority-badge',
  'triage-assignment',
  'triage-time',
  'triage-protocol',
  'announcement-text-box',
  'speak-announcement-btn',
  'eco-actions-form',
  'user-eco-points',
  'green-tip-text',
  'toast',
  'toast-text',
  'toast-icon',
];

let missingCount = 0;
expectedIds.forEach((id) => {
  const hasId = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  if (!hasId) {
    console.error(`Missing expected element ID: "${id}"`);
    missingCount++;
  }
});

if (missingCount === 0) {
  console.log(
    'DOM Element ID validation: SUCCESS. All queried element IDs are defined in index.html.'
  );
} else {
  console.error(`DOM Element ID validation: FAILED. ${missingCount} IDs are missing!`);
  process.exit(1);
}
