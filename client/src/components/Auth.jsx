import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import StarBackground from './StarBackground';
import './Auth.css';

function Auth() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Register state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, error } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const toggleForm = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsFlipping(false);
      // Clear errors when switching
      setLoginError('');
      setRegisterError('');
    }, 300);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      await login(loginEmail, loginPassword);
      navigate('/chat');
    } catch (err) {
      setLoginError('Failed to log in. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setRegisterError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password);
    if (result.success) {
      navigate('/chat');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <StarBackground showMeteors={false} />
      <div className="auth-content">
        <header className="app-header">
          <button 
            className="back-button-auth" 
            onClick={handleBackClick}
            title="Go Back"
          >
            <FaArrowLeft />
          </button>
          <div className="app-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            AI Study Buddy
          </div>
          <div className="auth-buttons">
            <ThemeToggle />
          </div>
        </header>

        <div className={`flip-container ${isFlipping ? 'flipping' : ''}`}>
          <div className={`flipper ${isLogin ? '' : 'flipped'}`}>
            {/* Login Form - Front */}
            <div className="flip-card front">
              <section className="main-section">
                <h1>Welcome Back</h1>
                <p>Log in to continue your learning journey</p>

                <form onSubmit={handleLoginSubmit} className="auth-form">
                  {loginError && <div className="error-message">{loginError}</div>}
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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

                <button onClick={toggleForm} className="toggle-link">
                  Don't have an account? <span className="toggle-action">Sign up</span>
                </button>
              </section>
            </div>

            {/* Register Form - Back */}
            <div className="flip-card back">
              <section className="main-section">
                <h1>Create Account</h1>
                <p>Join AI Study Buddy to start your learning journey</p>

                <form onSubmit={handleRegisterSubmit} className="auth-form">
                  {(error || registerError) && (
                    <div className="error-message">{error || registerError}</div>
                  )}
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email address"
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
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="glowing-btn"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                    <span className="glow-container">
                      <span className="glow-line first"></span>
                      <span className="glow-line second"></span>
                    </span>
                  </button>
                </form>

                <button onClick={toggleForm} className="toggle-link">
                  Already have an account? <span className="toggle-action">Sign in</span>
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
