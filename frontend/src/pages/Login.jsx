import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../prototype.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') || '';
    const password = formData.get('password') || '';
    setErrorMessage('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(result.message || 'Unable to sign in');
    }
  };

  return (
    <div className="login-page">
      <div className="auth-card">
        <div className="brand-wrap">
          <div className="brand-mark">S</div>
          <div className="brand-name">Sentra</div>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">User & access management console</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMessage ? <div className="demo-note" style={{ color: '#ff8f8f', marginTop: 0 }}>{errorMessage}</div> : null}
          <div className="auth-input">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="Enter your email" required />
          </div>
          <div className="auth-input">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="........" required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-helper">
          <span>Need an account?</span>
          <Link className="auth-link" to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
