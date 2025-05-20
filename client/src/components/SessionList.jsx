import React, { useEffect, useState } from 'react';
import { FaTimes, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import api from '../api/api';
import './SessionList.css';

const SessionList = ({ onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/api/sessions');
        setSessions(res.data.sessions || []);
      } catch (err) {
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      <div className="sessions-overlay" onClick={onClose} />
      <div className="sessions-panel">
        <div className="sessions-header">
          <h2 className="sessions-title">Saved Sessions</h2>
          <button 
            onClick={onClose} 
            className="close-button" 
            aria-label="Close panel"
          >
            <FaTimes />
          </button>
        </div>

        <div className="sessions-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <h3 className="session-title">{session.name}</h3>
                  <div className="session-meta">
                    <span className="session-date">
                      <FaCalendarAlt />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="session-type">
                      <FaFileAlt />
                      {session.type || 'Session'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <p className="empty-text">No saved sessions yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SessionList; 