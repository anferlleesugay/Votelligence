import api from './axios';

// Every call to the Express API. Same function names as the original api.js,
// but they now use the shared Axios instance with async/await.

// ---------- Local storage helpers ----------

export function getVoterId() {
  let id = localStorage.getItem('votelligence_voter_id');
  if (!id) {
    id = 'voter_' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('votelligence_voter_id', id);
  }
  return id;
}

export function getUsername() {
  return localStorage.getItem('votelligence_username');
}

export function getUserId() {
  const id = localStorage.getItem('votelligence_user_id');
  return id ? Number(id) : null;
}

export function saveAuth(token, username, userId) {
  localStorage.setItem('votelligence_token', token);
  localStorage.setItem('votelligence_username', username);
  localStorage.setItem('votelligence_user_id', String(userId));
}

export function clearAuth() {
  localStorage.removeItem('votelligence_token');
  localStorage.removeItem('votelligence_username');
  localStorage.removeItem('votelligence_user_id');
}

// ---------- Auth ----------

export async function register(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function login(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

// ---------- Polls ----------
// (GET /polls and GET /polls/:id are loaded with the useFetch hook)

export async function createPoll(payload) {
  const response = await api.post('/polls', payload);
  return response.data;
}

export async function deletePoll(pollId) {
  const response = await api.delete(`/polls/${pollId}`);
  return response.data;
}

export async function closePoll(pollId) {
  const response = await api.patch(`/polls/${pollId}/close`);
  return response.data;
}

export async function checkHasVoted(pollId, voterId) {
  const response = await api.get(`/polls/${pollId}/has-voted`, { params: { voterFingerprint: voterId } });
  return response.data;
}

export async function castVote(pollId, payload) {
  const response = await api.post(`/polls/${pollId}/votes`, payload);
  return response.data;
}

export async function fetchResults(pollId) {
  const response = await api.get(`/polls/${pollId}/results`);
  return response.data;
}

export async function fetchAnalytics() {
  const response = await api.get('/analytics');
  return response.data;
}

// ---------- AI ----------

export async function generatePollWithAi(topic) {
  const response = await api.post('/ai/generate-poll', { topic });
  return response.data;
}

export async function generateSummary(pollId) {
  const response = await api.post(`/ai/polls/${pollId}/summary`);
  return response.data;
}

export async function checkDuplicate(pollId, text) {
  const response = await api.post(`/ai/polls/${pollId}/check-duplicate`, { text });
  return response.data;
}
