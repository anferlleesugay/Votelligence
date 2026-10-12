import { useState } from 'react';
import { FiSearch, FiAlertTriangle, FiLoader, FiCheck } from 'react-icons/fi';
import { checkDuplicate } from '../api';

// Below this score the closest option is not really similar, so we don't name it
const SIMILAR_THRESHOLD = 0.7;

function renderResult(result) {
  const percent = `${(result.similarityScore * 100).toFixed(0)}% similar`;

  // 90% or more: the server marks it as a duplicate
  if (result.likelyDuplicate) {
    return (
      <p className="note note-spaced note-error">
        <FiAlertTriangle />
        <span>Likely a duplicate of <strong>{result.mostSimilarOption}</strong> ({percent})</span>
      </p>
    );
  }

  // 70% to 89%: new, but close to an existing option
  if (result.similarityScore >= SIMILAR_THRESHOLD) {
    return (
      <p className="note note-spaced note-info">
        <FiCheck />
        <span>Looks new, but it's close to <strong>{result.mostSimilarOption}</strong> ({percent})</span>
      </p>
    );
  }

  // Below 70%: not similar to anything
  return (
    <p className="note note-spaced note-success">
      <FiCheck />
      <span>Looks new. No similar option found.</span>
    </p>
  );
}

function DuplicateChecker({ pollId }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setChecking(true);
    setError('');
    try {
      const data = await checkDuplicate(pollId, text);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <h3>Is this option already here?</h3>
      <p className="muted small" style={{ margin: '6px 0 16px' }}>
        Type an idea for a new option. AI compares its meaning with the existing options, not just the spelling.
      </p>

      <form className="option-row" onSubmit={handleCheck}>
        <input
          type="text"
          placeholder="e.g. end of the week"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Option idea to check"
        />
        <button type="submit" className="btn btn-ghost" disabled={checking || !text.trim()}>
          {checking ? <FiLoader className="spin" /> : <FiSearch />}
          {checking ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && <p className="note note-error note-spaced"><FiAlertTriangle /> {error}</p>}

      {result && renderResult(result)}
    </div>
  );
}

export default DuplicateChecker;