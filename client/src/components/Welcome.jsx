import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import StarBackground from './StarBackground';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="welcome-container">
      <StarBackground />
      <div className="welcome-content">
        <header className="app-header">
          <div className="app-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>AI Study Buddy</div>
          <div className="auth-buttons">
            <ThemeToggle />
            {!user && (
              <>
                <button className="glowing-btn" onClick={() => navigate('/auth?mode=login')}>
                  Login
                </button>
                <button className="glowing-btn" onClick={() => navigate('/auth?mode=signup')}>
                  Signup
                </button>
              </>
            )}
          </div>
        </header>

        <h1 className="hero-title">Learn Smarter, Not Harder</h1>
        <p className="hero-description">Transform your study materials into clear summaries, get instant answers to your questions, and extract key insights from documents and videos—all powered by AI.</p>

        <button className="cta-button magnetic-button" onClick={() => navigate('/chat')}>
          <span>Get Started Free</span>
        </button>
      </div>
    </div>
  );
}

export default Welcome; 