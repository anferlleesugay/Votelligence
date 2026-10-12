import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiBarChart2, FiZap, FiAlertTriangle, FiLoader, FiLock, FiChevronRight } from 'react-icons/fi';
import { castVote, fetchResults, generateSummary, getVoterId, checkHasVoted, closePoll } from '../api';
import { useFetch } from '../hooks/useFetch';
import ResultsChart from './ResultsChart';
import DuplicateChecker from './DuplicateChecker';
import SentimentChart from './SentimentChart';
import ConfirmModal from './ConfirmModal';

function PollDetail({ pollId, onBack, userId, onPollUpdated }) {
  // Loads GET /api/polls/:id (useEffect + cleanup live inside the hook)
  const { data: poll, setData: setPoll, loading, error: loadError } = useFetch(`/polls/${pollId}`);
  const justCreated = useLocation().state?.justCreated === true;
  const [comment, setComment] = useState('');
  const [voted, setVoted] = useState(false);
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(true);
  const [votingOptionId, setVotingOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [closingPoll, setClosingPoll] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [confirmingClose, setConfirmingClose] = useState(false);

  useEffect(() => {
    const voterId = getVoterId();
    checkHasVoted(pollId, voterId)
      .then((data) => setVoted(data.hasVoted))
      .catch((err) => console.error('Failed to check vote status:', err))
      .finally(() => setCheckingVoteStatus(false));
  }, [pollId]);

  const handleVote = async (optionId) => {
    setVoteError('');
    setVotingOptionId(optionId);
    try {
      await castVote(pollId, {
        optionId,
        comment: comment || null,
        voterFingerprint: getVoterId(),
      });
      setVoted(true);
    } catch (err) {
      setVoteError(err.message);
    } finally {
      setVotingOptionId(null);
    }
  };

  const handleLoadResults = async () => {
    setLoadingResults(true);
    try {
      const data = await fetchResults(pollId);
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const data = await generateSummary(pollId);
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCloseClick = () => setConfirmingClose(true);

  const confirmClose = async () => {
    setClosingPoll(true);
    setCloseError('');
    try {
      const updated = await closePoll(pollId);
      setPoll(updated);
      onPollUpdated(updated);
      setConfirmingClose(false);
    } catch (err) {
      setCloseError(err.message);
      setConfirmingClose(false);
    } finally {
      setClosingPoll(false);
    }
  };

  const cancelClose = () => setConfirmingClose(false);

  if (loading) return <p className="loading"><FiLoader className="spin" /> Loading poll…</p>;

  if (loadError || !poll) {
    return (
      <div>
        <button className="back-link" onClick={onBack}><FiArrowLeft /> Back to polls</button>
        <p className="note note-error"><FiAlertTriangle /> {loadError || 'Poll not found.'}</p>
      </div>
    );
  }

  const isOwner = userId !== null && poll.ownerId === userId;
  const category = poll.category.charAt(0).toUpperCase() + poll.category.slice(1);

  return (
    <div className="stack">
      <div>
        <button className="back-link" onClick={onBack}><FiArrowLeft /> Back to polls</button>

        <div className="detail-head">
          <div>
            <div className="chips">
              <span className="chip chip-category">{category}</span>
              <span className={`chip status ${poll.closed ? 'status-closed' : ''}`}>{poll.closed ? 'Closed' : 'Open'}</span>
            </div>
            <h1>{poll.question}</h1>
            {poll.description && <p className="description">{poll.description}</p>}
          </div>
          {isOwner && !poll.closed && (
            <button className="btn btn-ghost" onClick={handleCloseClick} disabled={closingPoll}>
              {closingPoll ? <FiLoader className="spin" /> : <FiLock />}
              {closingPoll ? 'Closing…' : 'Close poll'}
            </button>
          )}
        </div>
      </div>

      {justCreated && <p className="note note-success"><FiCheck /> Poll created. Share the link and start collecting votes.</p>}
      {closeError && <p className="note note-error"><FiAlertTriangle /> {closeError}</p>}
      {voteError && <p className="note note-error"><FiAlertTriangle /> {voteError}</p>}

      {!results && (
        <section className="panel">
          {poll.closed && <p className="note note-info"><FiLock /> This poll is closed. You can still see the results.</p>}

          {checkingVoteStatus && <p className="loading"><FiLoader className="spin" /> Checking if you've voted…</p>}

          {!checkingVoteStatus && voted && (
            <div className="voted">
              <span className="stamp"><FiCheck /> Voted</span>
              <p className="muted">Your vote is in. Open the results to see how everyone answered.</p>
            </div>
          )}

          {!checkingVoteStatus && !voted && !poll.closed && (
            <>
              <h3>Cast your vote</h3>
              <div className="field field-top">
                <label htmlFor="comment">
                  Comment <span className="hint">(optional, AI reads its mood)</span>
                </label>
                <textarea
                  id="comment"
                  placeholder="Why did you pick it?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />
              </div>
              <p className="label">Choose an option to vote</p>
              <div className="vote-list">
                {poll.options.map((opt) => (
                  <button
                    key={opt.id}
                    className="vote-option"
                    onClick={() => handleVote(opt.id)}
                    disabled={votingOptionId !== null}
                  >
                    <span>{opt.text}</span>
                    <span className="vote-cue">
                      {votingOptionId === opt.id ? <FiLoader className="spin" /> : <>Vote <FiChevronRight /></>}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="results-cta">
            <button className="btn btn-ghost" onClick={handleLoadResults} disabled={loadingResults}>
              {loadingResults ? <FiLoader className="spin" /> : <FiBarChart2 />}
              {loadingResults ? 'Loading…' : 'View results'}
            </button>
          </div>
        </section>
      )}

      {results && (
        <>
          {voted && (
            <div className="voted">
              <span className="stamp"><FiCheck /> Voted</span>
            </div>
          )}

          {results.anomalyDetected && (
            <p className="note note-error"><FiAlertTriangle /> {results.anomalyNote}</p>
          )}

          <div className="results-layout">
            <section className="panel">
              <div className="panel-head">
                <h2>Results</h2>
                <span className="count">{results.totalVotes} {results.totalVotes === 1 ? 'vote' : 'votes'}</span>
              </div>
              <ResultsChart results={results.results} />
              <ul className="breakdown">
                {results.results.map((r) => (
                  <li key={r.optionId}>
                    <span>{r.text}</span>
                    <span className="figure">
                      <strong>{r.percentage}%</strong>
                      {r.marginOfError > 0 ? ` ± ${r.marginOfError}` : ''}
                      <span className="figure-votes">{r.votes} {r.votes === 1 ? 'vote' : 'votes'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <SentimentChart breakdown={{ ...results.sentimentBreakdown, comments: results.comments }} />
            </section>
          </div>

          <section className="ai-summary">
            <div className="ai-summary-head"><FiZap /> AI summary</div>
            {summary ? (
              <p>{summary}</p>
            ) : (
              <p className="muted">Get a short, plain-language read of these results.</p>
            )}
            {summaryError && <p className="note note-error note-spaced"><FiAlertTriangle /> {summaryError}</p>}
            <button className="btn btn-primary btn-small" onClick={handleGenerateSummary} disabled={loadingSummary}>
              {loadingSummary ? <FiLoader className="spin" /> : <FiZap />}
              {loadingSummary ? 'Writing…' : summary ? 'Write again' : 'Summarize results'}
            </button>
          </section>
        </>
      )}

      <section className="panel">
        <DuplicateChecker pollId={pollId} />
      </section>

      <ConfirmModal
        open={confirmingClose}
        title="Close this poll?"
        message="No one will be able to vote anymore. Results and AI summaries stay available."
        confirmLabel="Close poll"
        onConfirm={confirmClose}
        onCancel={cancelClose}
      />
    </div>
  );
}

export default PollDetail;