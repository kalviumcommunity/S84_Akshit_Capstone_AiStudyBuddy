import React, { useState } from 'react';
import { FaBars, FaEdit, FaGem, FaChevronRight, FaComments, FaPlus } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar({ isOpen, onToggle, onNewChat }) {
  const [expandedSections, setExpandedSections] = useState({
    myStuff: false,
    chats: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNewChat = () => {
    onNewChat();
    // Close sidebar on mobile after action
    if (window.innerWidth <= 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={onToggle}>
            <FaBars />
          </button>
        </div>

        {/* New Chat */}
        <div className="sidebar-section">
          <button className="sidebar-item new-chat" onClick={handleNewChat}>
            <FaEdit className="sidebar-icon" />
            <span>New chat</span>
          </button>
        </div>

        {/* My Stuff */}
        <div className="sidebar-section">
          <button 
            className="sidebar-item expandable"
            onClick={() => toggleSection('myStuff')}
          >
            <span className="sidebar-item-content">
              <span>My stuff</span>
              <FaChevronRight 
                className={`expand-icon ${expandedSections.myStuff ? 'expanded' : ''}`} 
              />
            </span>
          </button>
          
          {expandedSections.myStuff && (
            <div className="sidebar-subsection">
              <button className="sidebar-subitem">
                <span>Uploaded Files</span>
              </button>
              <button className="sidebar-subitem">
                <span>YouTube Videos</span>
              </button>
              <button className="sidebar-subitem">
                <span>Study Sessions</span>
              </button>
            </div>
          )}
        </div>

        {/* Chats */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3>Chats</h3>
          </div>
          
          <div className="chat-list">
            <button className="sidebar-item chat-item">
              <FaComments className="sidebar-icon" />
              <span>Current Session</span>
            </button>
            {/* Add more chat history items here */}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          <div className="feature-notice">
            <p>Personal Intelligence Feature Required</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;