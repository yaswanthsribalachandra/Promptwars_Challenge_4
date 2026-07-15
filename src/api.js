/**
 * @fileoverview Gemini 2.5 API Client interface with caching.
 * Implements client-side in-memory caching to optimize query efficiency.
 * Includes security documentation proposing a serverless proxy pattern.
 */

// In-memory cache for API requests
const apiCache = new Map();

/**
 * PRODUCTION SECURITY MITIGATION NOTE:
 * Sending API keys directly from the client is a security risk. In production,
 * this fetch call should point to a secure serverless backend proxy:
 *
 * Example (Node.js/Express Endpoint):
 *   app.post('/api/triage', async (req, res) => {
 *     const apiKey = process.env.GEMINI_API_KEY;
 *     const reply = await fetch(`https://generativelanguage.googleapis.com/...key=${apiKey}`, { ... });
 *     res.json(await reply.json());
 *   });
 */

/**
 * Fetches narrative content from Gemini API using the provided API key and prompt.
 * Caches results to avoid redundant operations and network traffic.
 *
 * @param {string} userPrompt - Prompt to submit.
 * @param {string} systemContext - System rules instructions.
 * @param {string} apiKey - Client-supplied Gemini API key.
 * @returns {Promise<string>} Generative reply text.
 */
export async function queryGeminiApi(userPrompt, systemContext, apiKey) {
  if (!apiKey) {
    throw new Error('API Key is missing');
  }

  // Construct Cache Key
  const cacheKey = `${apiKey}:${systemContext}:${userPrompt}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemContext}\n\nUser Prompt: ${userPrompt}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  // Store in cache
  apiCache.set(cacheKey, resultText);
  return resultText;
}

/**
 * Clears the in-memory query cache.
 * @returns {void}
 */
export function clearApiCache() {
  apiCache.clear();
}

/**
 * Checks if a specific query is currently cached.
 * @param {string} userPrompt - Prompt to submit.
 * @param {string} systemContext - System rules instructions.
 * @param {string} apiKey - Client-supplied Gemini API key.
 * @returns {boolean} True if cached.
 */
export function isQueryCached(userPrompt, systemContext, apiKey) {
  const cacheKey = `${apiKey}:${systemContext}:${userPrompt}`;
  return apiCache.has(cacheKey);
}
