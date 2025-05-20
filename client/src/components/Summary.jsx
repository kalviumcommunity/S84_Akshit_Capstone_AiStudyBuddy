import React from 'react';
import './Summary.css';

function Summary({ summary }) {
  return (
    <div className="summary-container">
      <h2 className="summary-title">Summary</h2>
      <div className="summary-content">
        {summary ? (
          <p className="summary-text">{summary}</p>
        ) : (
          <div className="summary-placeholder">
            <div className="placeholder-icon">📝</div>
            <p className="placeholder-text">Your summary will appear here after uploading</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Summary; 