import { useState } from 'react';
import { FiPlus, FiTrash2, FiAlertTriangle, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { deletePoll } from '../api';
import ConfirmModal from './ConfirmModal';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Shows all polls (home page) or only the user's polls (title="My polls")
function PollList({ polls, onSelect, onCreateClick, onDeleted, userId, title, loading, error: loadError, onRetry }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [error, setError] = useState('');
  const isHome = !title;

  const handleDeleteClick = (e, pollId) => {
    e.stopPropagation(); // don't also open the poll
    setPendingDeleteId(pollId);
  };

  const confirmDelete = async () => {
    setError('');
    try {
      await deletePoll(pendingDeleteId);
      onDeleted(pendingDeleteId);
      setPendingDeleteId(null);
    } catch (err) {
      setPendingDeleteId(null);
      setError(err.message);
    }
  };

  const cancelDelete = () => setPendingDeleteId(null);

  return (
    <>
      {isHome ? (
        <section className="hero">
          <div>
            <h1>Ask the room.</h1>
            <p>Make a poll in seconds, or let AI draft one from a topic. Votes, comments and results update as people answer.</p>
          </div>
          <button className="btn btn-primary" onClick={onCreateClick}>
            <FiPlus /> Create poll
          </button>
        </section>
      ) : (
        <section className="hero">
          <h1>{title}</h1>
          <button className="btn btn-primary" onClick={onCreateClick}>
            <FiPlus /> Create poll
          </button>
        </section>
      )}

      <div className="stack">
        {error && <p className="note note-error"><FiAlertTriangle /> {error}</p>}

        {loading && <p className="loading"><FiLoader className="spin" /> Loading polls…</p>}

        {!loading && loadError && (
          <p className="note note-error">
            <FiAlertTriangle /> {loadError}
            <button className="btn btn-ghost btn-small" onClick={onRetry}>
              <FiRefreshCw /> Try again
            </button>
          </p>
        )}

        {!loading && !loadError && polls.length === 0 && (
          <div className="empty">
            <h3>{isHome ? 'No polls yet' : "You haven't made a poll yet"}</h3>
            <p>Start one and share it with your class.</p>
            <button className="btn btn-primary" onClick={onCreateClick}><FiPlus /> Create poll</button>
          </div>
        )}

        {!loading && polls.length > 0 && (
          <>
            {isHome && (
              <div className="section-head">
                <h2>All polls</h2>
                <span className="count">{polls.length}</span>
              </div>
            )}
            <div className="poll-grid">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="poll-tile"
                  role="link"
                  tabIndex={0}
                  onClick={() => onSelect(poll.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelect(poll.id)}
                >
                  <div className="chips">
                    <span className="chip chip-category">{capitalize(poll.category)}</span>
                  </div>
                  <p className="poll-tile-question">{poll.question}</p>
                  <div className="poll-tile-foot">
                    <span className={`status ${poll.closed ? 'status-closed' : ''}`}>
                      {poll.closed ? 'Closed' : 'Open'}
                    </span>
                    <span>{poll.options.length} options</span>
                  </div>
                  {userId !== null && poll.ownerId === userId && (
                    <button
                      className="icon-btn"
                      onClick={(e) => handleDeleteClick(e, poll.id)}
                      aria-label={`Delete poll: ${poll.question}`}
                      title="Delete poll"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete this poll?"
        message="The poll and all of its votes will be removed for good."
        confirmLabel="Delete poll"
        danger
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

export default PollList;
