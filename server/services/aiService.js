// Talks to the Google Gemini API. Same prompts as the original Spring Boot AiService.
// The API key stays on the server (.env) and is never sent to React.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// An error the error handler can turn into the right HTTP status
function aiError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.isAiError = true;
  return err;
}

async function postToGemini(url, body) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw aiError(503, 'AI features are not set up. Add GEMINI_API_KEY to server/.env.');
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
  } catch {
    throw aiError(502, 'Could not reach the AI service.');
  }

  if (response.status === 429) {
    throw aiError(429, 'The AI service has hit its usage limit for now. Please wait a bit and try again.');
  }
  if (!response.ok) {
    throw aiError(502, `The AI service returned an error: ${response.status}`);
  }

  return response.json();
}

async function callGemini(prompt) {
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const data = await postToGemini(`${GEMINI_BASE}/${model}:generateContent`, {
    contents: [{ parts: [{ text: prompt }] }],
  });
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// The AI sometimes wraps JSON in ```json ... ``` so strip that before parsing
function parseJson(raw) {
  const cleaned = raw.trim().replace(/^```(json)?/, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw aiError(502, 'The AI returned something that was not valid JSON. Try again.');
  }
}

export async function generatePoll(topic) {
  const prompt =
    'You create polls. Given a topic, produce a single clear poll question ' +
    'and 3 to 5 short, distinct answer options. ' +
    'Respond with ONLY valid JSON, no markdown, in this exact shape: ' +
    '{"question": "...", "options": ["...", "...", "..."]}. ' +
    `Topic: ${topic}`;

  const json = parseJson(await callGemini(prompt));
  return {
    question: typeof json.question === 'string' ? json.question : 'Untitled poll',
    options: Array.isArray(json.options) ? json.options.map(String) : [],
  };
}

// Returns POSITIVE, NEUTRAL, or NEGATIVE
export async function analyzeSentiment(text) {
  if (!text || !text.trim()) return 'NEUTRAL';

  const prompt =
    'Classify the sentiment of this comment as exactly one word: ' +
    'POSITIVE, NEUTRAL, or NEGATIVE. Respond with only that one word. ' +
    `Comment: ${text}`;

  const raw = (await callGemini(prompt)).trim().toUpperCase();
  if (raw.includes('POSITIVE')) return 'POSITIVE';
  if (raw.includes('NEGATIVE')) return 'NEGATIVE';
  return 'NEUTRAL';
}

export async function summarizeResults(question, resultLines) {
  const prompt =
    'Write a single short paragraph (2-3 sentences) summarizing these poll results ' +
    'in plain, natural language for a general audience. Describe the overall pattern ' +
    "and the winner, don't just repeat numbers.\n\n" +
    `Poll question: ${question}\n` +
    `Results:\n${resultLines.join('\n')}`;

  return (await callGemini(prompt)).trim();
}

// Turns text into a list of numbers (an "embedding") that captures its meaning
export async function embedText(text) {
  const data = await postToGemini(`${GEMINI_BASE}/gemini-embedding-001:embedContent`, {
    content: { parts: [{ text }] },
  });
  return data.embedding?.values ?? [];
}

// 1.0 = same meaning, 0 = unrelated
export function cosineSimilarity(a, b) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
