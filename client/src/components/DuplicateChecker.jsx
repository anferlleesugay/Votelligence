import { useState } from 'react';
import { FiSearch, FiAlertTriangle, FiLoader, FiCheck } from 'react-icons/fi';
import { checkDuplicate } from '../api';

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

      {result && (
        <p className={`note note-spaced ${result.likelyDuplicate ? 'note-error' : 'note-success'}`}>
          {result.likelyDuplicate ? <FiAlertTriangle /> : <FiCheck />}
          <span>
            {result.likelyDuplicate ? 'Likely a duplicate of ' : 'Looks new. Closest option is '}
            <strong>{result.mostSimilarOption}</strong> ({(result.similarityScore * 100).toFixed(0)}% similar)
          </span>
        </p>
      )}
    </div>
  );
}

export default DuplicateChecker;
