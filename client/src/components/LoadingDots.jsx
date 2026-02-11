import React from 'react';
import './LoadingDots.css';

function LoadingDots({ text = "AI is thinking", size = "medium" }) {
  return (
    <div className={`loading-dots-container ${size}`}>
      <div className="loading-text">{text}</div>
      <div className="dots-wrapper">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
}

export default LoadingDots;