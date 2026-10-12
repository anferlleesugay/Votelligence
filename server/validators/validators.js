// Server-side validation. The React forms validate too, but anyone can send
// a request straight to the API (Thunder Client, Postman), so we never trust the client.
// Each function returns { errors, value }:
//   errors - { fieldName: 'message' }, empty when everything is valid
//   value  - the cleaned-up data that is safe to save

export const CATEGORIES = ['school', 'events', 'tech', 'food', 'sports', 'other'];
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Turns anything into a trimmed string ('' if it was not a string)
function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

// The first error message, used as the main "error" text in a 400 response
export function firstError(errors) {
  return Object.values(errors)[0];
}

// Body: { question, description, category, options: [{ text }] }
export function validatePoll(body = {}) {
  const errors = {};

  const question = cleanText(body.question);
  const description = cleanText(body.description);
  const category = cleanText(body.category);

  if (question.length < 5 || question.length > 255) {
    errors.question = 'Question must be 5 to 255 characters.';
  }

  if (description.length > 500) {
    errors.description = 'Description must be 500 characters or less.';
  }

  if (!CATEGORIES.includes(category)) {
    errors.category = 'Choose a category.';
  }

  // Options arrive as [{ text: 'Friday' }, ...]
  const options = Array.isArray(body.options) ? body.options.map((option) => cleanText(option?.text)) : [];
  const lowerCased = options.map((text) => text.toLowerCase());

  if (!Array.isArray(body.options)) {
    errors.options = 'Options must be a list.';
  } else if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    errors.options = `Add ${MIN_OPTIONS} to ${MAX_OPTIONS} options.`;
  } else if (options.some((text) => text === '' || text.length > 100)) {
    errors.options = 'Every option needs 1 to 100 characters.';
  } else if (new Set(lowerCased).size !== lowerCased.length) {
    errors.options = 'Options must not repeat.';
  }

  return { errors, value: { question, description: description || null, category, options } };
}

// Body: { optionId, comment, voterFingerprint }
export function validateVote(body = {}) {
  const errors = {};

  const optionId = Number(body.optionId);
  const comment = cleanText(body.comment);
  const voterFingerprint = cleanText(body.voterFingerprint);

  if (!Number.isInteger(optionId) || optionId < 1) {
    errors.optionId = 'Choose one of the options.';
  }

  if (comment.length > 500) {
    errors.comment = 'Comment must be 500 characters or less.';
  }

  if (voterFingerprint.length < 5 || voterFingerprint.length > 100) {
    errors.voterFingerprint = 'A valid voter id is required.';
  }

  return { errors, value: { optionId, comment: comment || null, voterFingerprint } };
}

// Body: { email, username, password, confirmPassword }
export function validateRegister(body = {}) {
  const errors = {};

  const email = cleanText(body.email).toLowerCase();
  const username = cleanText(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

  if (!EMAIL_PATTERN.test(email) || email.length > 150) {
    errors.email = 'Enter a valid email address.';
  }

  if (username.length < 3 || username.length > 50) {
    errors.username = 'Username must be 3 to 50 characters.';
  }

  if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return { errors, value: { email, username, password } };
}
