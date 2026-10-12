import { useState } from 'react';
import { FiArrowLeft, FiPlus, FiZap, FiCheck, FiAlertTriangle, FiLoader, FiX } from 'react-icons/fi';
import { createPoll, generatePollWithAi } from '../api';

const CATEGORIES = ['school', 'events', 'tech', 'food', 'sports', 'other'];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

// Each option input gets a unique key that is never reused
// (an array index would shift when an option is removed).
let nextOptionKey = 1;
const newOption = (text = '') => ({ key: nextOptionKey++, text });

const emptyForm = () => ({
  question: '',
  description: '',
  category: '',
  options: [newOption(), newOption()],
});

// Client-side validation. The server checks the same rules again.
function validate(form) {
  const errors = {};
  const question = form.question.trim();
  const texts = form.options.map((option) => option.text.trim());
  const lowerCased = texts.map((text) => text.toLowerCase());

  if (question.length < 5 || question.length > 255) {
    errors.question = 'Question must be 5 to 255 characters.';
  }
  if (form.description.trim().length > 500) {
    errors.description = 'Description must be 500 characters or less.';
  }
  if (!CATEGORIES.includes(form.category)) {
    errors.category = 'Choose a category.';
  }
  if (texts.some((text) => text === '' || text.length > 100)) {
    errors.options = 'Fill in every option (up to 100 characters), or remove the empty ones.';
  } else if (new Set(lowerCased).size !== lowerCased.length) {
    errors.options = 'Options must not repeat.';
  }
  return errors;
}

function CreatePoll({ onCreated, onCancel }) {
  const [topic, setTopic] = useState('');
  // ONE state object holds every field of the poll form
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [generatingAi, setGeneratingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ONE handler for question, description, and category.
  // The input's name attribute says which property to update.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // The options list is an array, so it has its own small handlers.
  // All of them create a NEW array (map / filter / spread), never change the old one.
  const updateOption = (key, text) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option) => (option.key === key ? { ...option, text } : option)),
    }));
    setErrors((prev) => ({ ...prev, options: '' }));
  };

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, newOption()] }));
  };

  const removeOption = (key) => {
    setForm((prev) => ({ ...prev, options: prev.options.filter((option) => option.key !== key) }));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGeneratingAi(true);
    setError('');
    try {
      const draft = await generatePollWithAi(topic);
      const options = draft.options?.length >= MIN_OPTIONS ? draft.options : ['', ''];
      setForm((prev) => ({
        ...prev,
        question: draft.question,
        options: options.slice(0, MAX_OPTIONS).map((text) => newOption(text)),
      }));
      setErrors({});
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError('');

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const poll = await createPoll({
        question: form.question.trim(),
        description: form.description.trim(),
        category: form.category,
        options: form.options.map((option) => ({ text: option.text.trim() })),
      });
      setForm(emptyForm()); // reset after a successful save
      setTopic('');
      onCreated(poll);
    } catch (err) {
      // Show the server's per-field errors beside the fields
      setErrors(err.fieldErrors ?? {});
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button className="back-link" onClick={onCancel}><FiArrowLeft /> Back to polls</button>

      <div className="create-layout">
        <aside className="ai-panel">
          <h3><FiZap /> Draft it with AI</h3>
          <p>Describe what you want to ask. AI writes the question and options, and you can edit everything before saving.</p>
          <label htmlFor="topic" className="label">Topic</label>
          <input
            id="topic"
            type="text"
            placeholder="e.g. best pizza topping"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button type="button" className="btn" onClick={handleGenerate} disabled={generatingAi || !topic.trim()}>
            {generatingAi ? <FiLoader className="spin" /> : <FiZap />}
            {generatingAi ? 'Drafting…' : 'Draft poll'}
          </button>
        </aside>

        <section className="panel">
          <div className="panel-head">
            <h2>Create a poll</h2>
          </div>

          {error && <p className="note note-error form-note"><FiAlertTriangle /> {error}</p>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="question">Question</label>
              <input
                id="question"
                type="text"
                name="question"
                placeholder="What do you want to ask?"
                value={form.question}
                onChange={handleChange}
                aria-invalid={Boolean(errors.question)}
              />
              {errors.question && <p className="field-error">{errors.question}</p>}
            </div>

            <div className="field">
              <label htmlFor="description">
                Description <span className="hint">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Add context for voters"
                value={form.description}
                onChange={handleChange}
                rows={2}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && <p className="field-error">{errors.description}</p>}
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                aria-invalid={Boolean(errors.category)}
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>

            <div className="field">
              <span className="label">
                Options <span className="hint">({MIN_OPTIONS} to {MAX_OPTIONS})</span>
              </span>
              <div>
                {form.options.map((option, i) => (
                  <div key={option.key} className="option-row">
                    <span className="option-index" aria-hidden="true">{i + 1}</span>
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(option.key, e.target.value)}
                      aria-label={`Option ${i + 1}`}
                      aria-invalid={Boolean(errors.options)}
                    />
                    {form.options.length > MIN_OPTIONS && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeOption(option.key)}
                        aria-label={`Remove option ${i + 1}`}
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.options && <p className="field-error">{errors.options}</p>}
              {form.options.length < MAX_OPTIONS && (
                <div>
                  <button type="button" className="btn btn-ghost btn-small" onClick={addOption}>
                    <FiPlus /> Add option
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <FiLoader className="spin" /> : <FiCheck />}
                {submitting ? 'Creating…' : 'Create poll'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default CreatePoll;
