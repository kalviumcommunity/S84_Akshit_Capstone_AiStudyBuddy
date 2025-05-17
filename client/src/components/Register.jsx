import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
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
    <div className="register-container">
      <div className="register-content">
        <header className="app-header">
          <div className="app-logo">AI Study Buddy</div>
          <div className="auth-buttons">
            <button className="glowing-btn" onClick={() => navigate('/login')}>
              Login
              <span className="glow-container">
                <span className="glow-line first"></span>
                <span className="glow-line second"></span>
              </span>
            </button>
          </div>
        </header>

        <section className="main-section">
          <h1>Create Account</h1>
          <p>Join AI Study Buddy to start your learning journey</p>

          <form onSubmit={handleSubmit} className="register-form">
            {(error || formError) && (
              <div className="error-message">{error || formError}</div>
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
            <Link to="/login" className="auth-link">
              Already have an account? Sign in
            </Link>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Register; 