import { useState } from 'react';
import { FiLogIn, FiUserPlus, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { login, register, saveAuth } from '../api';

function AuthPage({ onLoggedIn, onCancel }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login({ usernameOrEmail, password });
      saveAuth(data.token, data.username, data.userId);
      onLoggedIn(data.username, data.userId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await register({ email, username, password, confirmPassword });
      saveAuth(data.token, data.username, data.userId);
      onLoggedIn(data.username, data.userId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <div className="auth-wrap">
      <h1>{mode === 'login' ? 'Welcome back' : 'Make an account'}</h1>
      <p>You need an account to create polls. Voting works without one.</p>

      <div className="panel">
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
            Log in
          </button>
          <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
            Register
          </button>
        </div>

        {error && <p className="note note-error form-note"><FiAlertTriangle /> {error}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="usernameOrEmail">Username or email</label>
              <input id="usernameOrEmail" type="text" autoComplete="username" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <FiLoader className="spin" /> : <FiLogIn />}
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="newPassword">
                Password <span className="hint">(at least 6 characters)</span>
              </label>
              <input id="newPassword" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <FiLoader className="spin" /> : <FiUserPlus />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>

      <button className="auth-guest" onClick={onCancel}>Continue as a guest</button>
    </div>
  );
}

export default AuthPage;
