import { Routes, Route, NavLink, Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { getUsername, getUserId, clearAuth } from './api';
import { useFetch } from './hooks/useFetch';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollDetail from './components/PollDetail';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthPage from './components/AuthPage';
import { FiBarChart2, FiGrid, FiLogIn, FiLogOut, FiUser } from 'react-icons/fi';

function PollDetailRoute({ onBack, userId, onPollUpdated }) {
  const { id } = useParams();
  // key makes React start fresh when you open a different poll
  return <PollDetail key={id} pollId={Number(id)} onBack={onBack} userId={userId} onPollUpdated={onPollUpdated} />;
}

function App() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(getUsername());
  const [userId, setUserId] = useState(getUserId());

  // Loads GET /api/polls once when the app opens (useEffect inside the hook)
  const { data, setData: setPolls, loading, error, refetch } = useFetch('/polls');
  const polls = data ?? [];

  // New poll is added to the list without reloading (new array, not push)
  const handleCreated = (poll) => {
    setPolls((prev) => [poll, ...(prev ?? [])]);
    navigate(`/polls/${poll.id}`, { state: { justCreated: true } });
  };

  // Deleted poll is removed from the list with filter (new array, not splice)
  const handleDeleted = (pollId) => {
    setPolls((prev) => (prev ?? []).filter((poll) => poll.id !== pollId));
  };

  // Closing a poll replaces that one poll in the list
  const handlePollUpdated = (updatedPoll) => {
    setPolls((prev) => (prev ?? []).map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll)));
  };

  const goToCreate = () => {
    if (!username) {
      navigate('/auth');
    } else {
      navigate('/create');
    }
  };

  const handleLoggedIn = (name, id) => {
    setUsername(name);
    setUserId(id);
    navigate('/create');
  };

  const handleLogout = () => {
    clearAuth();
    setUsername(null);
    setUserId(null);
    navigate('/');
  };

  const myPolls = polls.filter((p) => p.ownerId === userId);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-drop" aria-hidden="true" />
            Votelligence
          </Link>

          <nav className="nav" aria-label="Main">
            <NavLink to="/" end className="nav-link">
              <FiGrid /> <span className="nav-label">Polls</span>
            </NavLink>
            <NavLink to="/analytics" className="nav-link">
              <FiBarChart2 /> <span className="nav-label">Analytics</span>
            </NavLink>
            {username && (
              <NavLink to="/my-polls" className="nav-link">
                <FiUser /> <span className="nav-label">My polls</span>
              </NavLink>
            )}
          </nav>

          {username ? (
            <span className="user-chip">
              <span className="username">{username}</span>
              <span className="avatar" aria-hidden="true">{username.charAt(0)}</span>
              <button className="icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
                <FiLogOut />
              </button>
            </span>
          ) : (
            <button className="btn btn-ghost btn-small" onClick={() => navigate('/auth')}>
              <FiLogIn /> Log in
            </button>
          )}
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route
            path="/"
            element={
              <PollList
                polls={polls}
                onSelect={(id) => navigate(`/polls/${id}`)}
                onCreateClick={goToCreate}
                onDeleted={handleDeleted}
                loading={loading}
                error={error}
                onRetry={refetch}
                userId={userId}
              />
            }
          />
          <Route
            path="/my-polls"
            element={
              <PollList
                polls={myPolls}
                onSelect={(id) => navigate(`/polls/${id}`)}
                onCreateClick={goToCreate}
                onDeleted={handleDeleted}
                loading={loading}
                error={error}
                onRetry={refetch}
                userId={userId}
                title="My polls"
              />
            }
          />
          <Route
            path="/create"
            element={<CreatePoll onCreated={handleCreated} onCancel={() => navigate('/')} />}
          />
          <Route
            path="/polls/:id"
            element={<PollDetailRoute onBack={() => navigate('/')} userId={userId} onPollUpdated={handlePollUpdated} />}
          />
          <Route path="/analytics" element={<AnalyticsDashboard onBack={() => navigate('/')} />} />
          <Route path="/auth" element={<AuthPage onLoggedIn={handleLoggedIn} onCancel={() => navigate('/')} />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
