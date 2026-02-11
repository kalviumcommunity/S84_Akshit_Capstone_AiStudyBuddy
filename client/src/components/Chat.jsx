import React, { useState, useRef, useEffect } from 'react';
import api from '../api/api';
import LoadingDots from './LoadingDots';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to AI Study Buddy! 🎓\n\nI can help you with:\n• Analyzing documents and images you upload\n• Summarizing YouTube videos\n• Answering questions about your study materials\n• General academic assistance\n\nJust type a message, click the + button to upload files, or paste a YouTube URL to get started!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || uploading) return;

    const userMessage = input.trim();
    
    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const isYouTubeUrl = youtubeRegex.test(userMessage);

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      if (isYouTubeUrl) {
        // Handle YouTube URL
        const response = await api.post('/api/videos', { 
          user: user._id,
          youtubeUrl: userMessage,
          title: 'YouTube Video',
          thumbnailUrl: `https://img.youtube.com/vi/${userMessage.match(youtubeRegex)[1]}/default.jpg`,
          channelTitle: 'Unknown Channel',
          duration: '0:00',
          summary: '',
          tags: []
        });

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.video.summary || 'YouTube video processed successfully! You can now ask questions about it.',
          isAnalysis: true,
          fileType: 'video/youtube',
          fileName: 'YouTube Video'
        }]);
      } else {
        // Handle regular chat message
        const response = await api.post('/api/chat', { message: userMessage });
        
        if (response.data && response.data.message) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (err.message === 'Authentication required') {
        errorMessage = 'Please log in to use the chat feature';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && err.message !== 'Invalid response from server') {
        errorMessage = err.message;
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errorMessage}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !user) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setShowUploadMenu(false);
    setError('');

    // Add a message showing the file is being uploaded
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `📎 Uploading: ${file.name}`,
      isFile: true,
      fileName: file.name,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user._id);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const fileInfo = response.data.file;
      
      // Add AI analysis message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fileInfo.summary || 'File uploaded successfully!',
        isAnalysis: true,
        fileType: fileInfo.mimetype,
        fileName: fileInfo.originalname
      }]);

    } catch (err) {
      console.error('Upload error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I couldn't process your file: ${err.message || 'Upload failed'}` 
      }]);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset the input
    e.target.value = '';
  };

  const formatMessage = (content) => {
    if (!content) return content;
    
    // Replace **text** with proper formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="message-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="message-italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="message-code">$1</code>')
      .replace(/\n\n/g, '<br><br>') // Double line breaks for paragraphs
      .replace(/\n/g, '<br>'); // Single line breaks
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'txt': return '📝';
      case 'doc':
      case 'docx': return '📋';
      default: return '📎';
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-content">
        <div className="chat-header">
          <h2 className="chat-title">
            <span className="chat-icon">💬</span>
            <span className="chat-title-text">AI Assistant</span>
          </h2>
          <p className="chat-subtitle">Ask questions, upload files, or share YouTube videos for analysis</p>
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                {message.isFile ? (
                  <div className="file-message">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(message.fileName)}</span>
                      <div className="file-details">
                        <span className="file-name">{message.fileName}</span>
                        <span className="file-size">{message.fileSize}</span>
                      </div>
                    </div>
                  </div>
                ) : message.isAnalysis ? (
                  <div className="analysis-message">
                    <div className="analysis-header">
                      <span className="analysis-icon">
                        {message.fileType === 'video/youtube' ? '📺' : '🤖'}
                      </span>
                      <span className="analysis-title">
                        {message.fileType === 'video/youtube' ? 'YouTube Analysis Complete' : 'AI Analysis Complete'}
                      </span>
                    </div>
                    <div 
                      className="analysis-content"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  </div>
                ) : (
                  <div 
                    className="regular-message"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                )}
              </div>
            </div>
          ))}
          
          {(loading || uploading) && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <LoadingDots 
                  text={uploading ? "Processing your file" : "AI is thinking"} 
                  size="small" 
                />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {error && (
          <div className="chat-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="chat-input-container">
          <div className="input-wrapper">
            <div className="upload-section" ref={menuRef}>
              <button
                type="button"
                className={`upload-toggle ${showUploadMenu ? 'active' : ''}`}
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                disabled={loading || uploading}
                title="Upload file or add content"
              >
                <span className="plus-icon">+</span>
              </button>
              
              {showUploadMenu && (
                <div className="upload-menu">
                  <button
                    type="button"
                    className="upload-option"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowUploadMenu(false);
                    }}
                  >
                    <span className="option-icon">📎</span>
                    <span className="option-text">Add photos & files</span>
                  </button>
                  <button
                    type="button"
                    className="upload-option"
                    onClick={() => {
                      setShowUploadMenu(false);
                      setInput('https://youtube.com/watch?v=');
                      // Focus on input after a brief delay
                      setTimeout(() => {
                        document.querySelector('.chat-input')?.focus();
                      }, 100);
                    }}
                  >
                    <span className="option-icon">📺</span>
                    <span className="option-text">Add YouTube video</span>
                  </button>
                  <button
                    type="button"
                    className="upload-option"
                    onClick={() => {
                      // TODO: Implement Google Drive integration
                      setShowUploadMenu(false);
                      setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: 'Google Drive integration coming soon! For now, please use the file upload option.' 
                      }]);
                    }}
                  >
                    <span className="option-icon">🔗</span>
                    <span className="option-text">Add from Google Drive</span>
                  </button>
                </div>
              )}
            </div>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything"
              className="chat-input"
              rows={1}
              disabled={loading || uploading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            <button
              type="submit"
              disabled={loading || uploading || !input.trim()}
              className="send-button"
              title="Send message"
            >
              {loading ? (
                <span className="button-spinner"></span>
              ) : (
                <span className="send-icon">📤</span>
              )}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </form>
      </div>
    </div>
  );
}

export default Chat; 