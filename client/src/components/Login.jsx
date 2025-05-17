import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <header className="app-header">
          <div className="app-logo">AI Study Buddy</div>
          <div className="auth-buttons">
            <button className="glowing-btn" onClick={() => navigate('/register')}>
              Signup
              <span className="glow-container">
                <span className="glow-line first"></span>
                <span className="glow-line second"></span>
              </span>
            </button>
          </div>
        </header>

        <section className="main-section">
          <h1>Welcome Back</h1>
          <p>Log in to continue your learning journey</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="glowing-btn">
              Login
              <span className="glow-container">
                <span className="glow-line first"></span>
                <span className="glow-line second"></span>
              </span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login; 