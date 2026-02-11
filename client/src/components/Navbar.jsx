import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBook, FaHistory, FaUser, FaSignOutAlt, FaArrowLeft, FaBars } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

function Navbar({ onSidebarToggle, showBackButton = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/study', icon: <FaBook />, label: 'Study' },
    { path: '/history', icon: <FaHistory />, label: 'History' },
  ];

  const handleLogout = () => {
    logout();
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {onSidebarToggle ? (
          <button 
            className="nav-icon sidebar-toggle-btn" 
            onClick={onSidebarToggle}
            title="Toggle Sidebar"
          >
            <FaBars />
          </button>
        ) : showBackButton && (
          <button 
            className="nav-icon back-button" 
            onClick={handleBackClick}
            title="Go Back"
          >
            <FaArrowLeft />
          </button>
        )}
        <h1 className="navbar-title" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>AI Study Buddy</h1>
        <div className="nav-icons">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-icon ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </div>
      </div>

      <div className="navbar-right">
        <ThemeToggle />
        <div className="profile-container" ref={profileMenuRef}>
          <button 
            className="nav-icon profile-icon" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Profile"
          >
            <FaUser />
          </button>
          
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h3>{user?.username}</h3>
                  <p>{user?.email}</p>
                </div>
              </div>
              <div className="profile-menu-items">
                <Link to="/profile" className="profile-menu-item">
                  View Profile
                </Link>
                <button className="profile-menu-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 