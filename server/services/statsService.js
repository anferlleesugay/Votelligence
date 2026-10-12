// The statistics engine from the original PollController:
// margin of error, vote-burst (anomaly) detection, and sentiment counts.

// 95% margin of error for one option's share of the votes, in percentage points.
// Not shown for fewer than 5 votes because it would be meaningless.
export function marginOfError(count, total) {
  if (total < 5) return 0;
  const p = count / total;
  const standardError = Math.sqrt((p * (1 - p)) / total);
  return 1.96 * standardError * 100;
}

// Flags a poll if any single minute got far more votes than usual
// (more than the average + 3 standard deviations). Needs at least 20 votes.
export function detectAnomaly(votes) {
  const result = { anomalyDetected: false, anomalyNote: null };
  if (votes.length < 20) return result;

  const times = votes.map((vote) => new Date(String(vote.votedAt).replace(' ', 'T')).getTime()).sort((a, b) => a - b);
  const start = times[0];

  // Count votes in each minute since the first vote
  const perMinute = new Map();
  for (const time of times) {
    const minute = Math.floor((time - start) / 60000);
    perMinute.set(minute, (perMinute.get(minute) ?? 0) + 1);
  }

  const counts = [...perMinute.values()];
  const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;
  const stdDev = Math.sqrt(variance);

  for (const count of counts) {
    if (stdDev > 0 && count > mean + 3 * stdDev) {
      result.anomalyDetected = true;
      result.anomalyNote = `Unusual vote burst: ${count} votes in one minute vs. an average of ${mean.toFixed(1)}/min.`;
      break;
    }
  }

  return result;
}

export function sentimentBreakdown(votes) {
  const positive = votes.filter((vote) => vote.sentiment === 'POSITIVE').length;
  const neutral = votes.filter((vote) => vote.sentiment === 'NEUTRAL').length;
  const negative = votes.filter((vote) => vote.sentiment === 'NEGATIVE').length;
  return { positive, neutral, negative, totalWithComment: positive + neutral + negative };
}

// Same as Java's String.hashCode(), so labels match the original app
function javaHashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  return hash;
}

// Shows "Participant #1234" instead of the voter's real id
export function anonymousLabel(voterFingerprint) {
  if (!voterFingerprint) return 'Anonymous';
  return `Participant #${Math.abs(javaHashCode(voterFingerprint) % 10000)}`;
}

export function roundTo1(value) {
  return Math.round(value * 10) / 10;
}
