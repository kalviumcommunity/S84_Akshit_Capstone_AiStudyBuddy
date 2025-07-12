import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

function LoadingScreen({ message = 'Loading your study companion...' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const text = "AI Study Buddy";
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length);
    }, 200); // Change glowing letter every 200ms
    
    return () => clearInterval(interval);
  }, [text.length]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="glowing-text">
          {text.split('').map((char, index) => (
            <span
              key={index}
              className={`glow-char ${index === currentIndex ? 'active' : ''}`}
            >
              {char}
            </span>
          ))}
        </div>
        <div className="loading-subtitle">
          {message}
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen; 