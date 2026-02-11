import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <header className="app-header">
          <div className="app-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>AI Study Buddy</div>
          <div className="auth-buttons">
            <ThemeToggle />
            <button className="glowing-btn" onClick={() => navigate('/login')}>
              Login
              <span className="glow-container">
                <span className="glow-line first"></span>
                <span className="glow-line second"></span>
              </span>
            </button>
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
          <h1>Smarter Studying Starts Here</h1>
          <p>Your personal AI-powered assistant for summarizing notes, asking questions, and extracting key info from files and videos.</p>

          <button className="cta-button" onClick={() => navigate('/chat')}>
            Try AI Study Buddy
            <span className="glow-container">
              <span className="glow-line first"></span>
              <span className="glow-line second"></span>
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}

export default Welcome; 