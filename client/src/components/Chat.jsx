import React, { useState, useRef, useEffect } from 'react';
import api from '../api/api';
import LoadingDots from './LoadingDots';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to AI Study Buddy! 🎓\n\nI can help you with:\n• Analyzing documents and images you upload\n• Summarizing YouTube videos\n• Getting YouTube video transcripts or lyrics (just add "transcript only" or "lyrics only" after the URL)\n• Answering questions about your study materials\n• General academic assistance\n\nJust type a message, click the + button to upload files, or paste a YouTube URL to get started!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // NEW: RAG-related state
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [uploadedNotes, setUploadedNotes] = useState([]);
  
  // NEW: Feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState({});
  
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
        // Determine action based on user message
        let action = 'summary'; // default
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('transcript only') || lowerMessage.includes('get transcript')) {
          action = 'transcript';
        } else if (lowerMessage.includes('lyrics only') || lowerMessage.includes('get lyrics')) {
          action = 'lyrics';
        }

        // Get transcript/summary from YouTube
        const transcriptResponse = await api.post('/api/videos/transcript', { 
          youtubeUrl: userMessage,
          action: action,
          userId: user._id  // NEW: Enable RAG for YouTube transcripts
        });

        let responseContent = '';
        let isAnalysis = false;

        if (action === 'transcript') {
          responseContent = `📝 Video Transcript:\n\n${transcriptResponse.data.transcript}`;
        } else if (action === 'lyrics') {
          responseContent = `🎵 Video Lyrics:\n\n${transcriptResponse.data.transcript}`;
        } else {
          // Summary
          responseContent = transcriptResponse.data.summary;
          isAnalysis = true;
          
          // NEW: Set noteId for RAG if available
          if (transcriptResponse.data.noteId) {
            setCurrentNoteId(transcriptResponse.data.noteId);
            console.log('YouTube transcript saved for RAG:', transcriptResponse.data.noteId);
          }
        }

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: responseContent,
          isAnalysis: isAnalysis,
          fileType: 'video/youtube',
          fileName: 'YouTube Video',
          ragEnabled: transcriptResponse.data.ragEnabled || false  // NEW: Track RAG status
        }]);

        // Save video info if it's a summary
        if (action === 'summary') {
          await api.post('/api/videos', { 
            user: user._id,
            youtubeUrl: userMessage,
            title: 'YouTube Video',
            thumbnailUrl: `https://img.youtube.com/vi/${userMessage.match(youtubeRegex)[1]}/default.jpg`,
            channelTitle: 'Unknown Channel',
            duration: '0:00',
            summary: transcriptResponse.data.summary,
            tags: []
          });
        }
      } else {
        // Handle regular chat message - use RAG if noteId available
        const conversationHistory = messages
          .filter(msg => !msg.isFile && !msg.isAnalysis) // Exclude file upload messages
          .slice(1) // Skip the initial welcome message
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }));

        // NEW: Use RAG-enabled endpoint if we have a note
        const endpoint = currentNoteId ? '/api/chat/context' : '/api/chat';
        const payload = currentNoteId ? {
          message: userMessage,
          noteId: currentNoteId,  // Enable RAG!
          userId: user._id,
          history: conversationHistory
        } : {
          message: userMessage,
          history: conversationHistory
        };

        console.log('=== RAG Debug Info ===');
        console.log('Endpoint:', endpoint);
        console.log('Current noteId:', currentNoteId);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('=====================');
        
        const response = await api.post(endpoint, payload);
        
        if (response.data && response.data.message) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: response.data.message,
            usedRAG: response.data.usedRAG || false  // NEW: Track RAG usage
          }]);
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (err.message === 'Authentication required') {
        errorMessage = 'Please log in to use the chat feature';
      } else if (err.response?.status === 503) {
        // YouTube feature unavailable
        errorMessage = err.response.data.message || 'Service temporarily unavailable';
        if (err.response.data.details) {
          errorMessage += '\n\n' + err.response.data.details;
        }
      } else if (err.response?.status === 404) {
        // Handle YouTube transcript errors
        if (err.response?.data?.message?.includes('transcript')) {
          errorMessage = err.response.data.message;
          if (err.response.data.details) {
            errorMessage += '\n\n' + err.response.data.details;
          }
        } else {
          errorMessage = err.response.data?.message || 'Resource not found';
        }
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
        if (err.response?.data?.details) {
          errorMessage += '\n\n' + err.response.data.details;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        if (err.response.data.details) {
          errorMessage += '\n\n' + err.response.data.details;
        }
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
      
      // DEBUG: Log the entire response
      console.log('📦 Upload response received:');
      console.log('   Full response:', JSON.stringify(response.data, null, 2));
      console.log('   fileInfo.noteId:', fileInfo.noteId);
      console.log('   fileInfo.ragEnabled:', fileInfo.ragEnabled);
      console.log('   fileInfo.hasText:', fileInfo.hasText);
      
      // NEW: Store noteId if RAG is enabled
      if (fileInfo.noteId) {
        const noteIdString = fileInfo.noteId.toString();
        setCurrentNoteId(noteIdString);
        setUploadedNotes(prev => [...prev, {
          id: noteIdString,
          name: fileInfo.originalname,
          hasText: fileInfo.hasText
        }]);
        console.log('✅ Note saved for RAG:', noteIdString);
        console.log('✅ RAG enabled:', fileInfo.ragEnabled);
      } else {
        console.log('⚠️ No noteId returned from upload');
        console.log('   Possible reasons:');
        console.log('   - No text extracted from file');
        console.log('   - Content too short (<50 chars)');
        console.log('   - Note creation failed on server');
      }
      
      // Add AI analysis message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fileInfo.summary || 'File uploaded successfully!',
        isAnalysis: true,
        fileType: fileInfo.mimetype,
        fileName: fileInfo.originalname,
        ragEnabled: fileInfo.ragEnabled // NEW: Track if RAG is available
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

  const handleFeedback = async (messageIndex, rating) => {
    const message = messages[messageIndex];
    const previousUserMessage = messages[messageIndex - 1];
    
    if (!message || !previousUserMessage || message.role !== 'assistant') {
      return;
    }

    try {
      await api.post('/api/feedback', {
        userId: user._id,
        noteId: currentNoteId,
        query: previousUserMessage.content,
        response: message.content,
        rating: rating,
        usedRAG: message.usedRAG || false
      });

      // Mark feedback as submitted for this message
      setFeedbackSubmitted(prev => ({
        ...prev,
        [messageIndex]: rating
      }));

      console.log(`Feedback submitted: ${rating}`);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
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
                      {message.ragEnabled && (
                        <span className="rag-badge" title="RAG processing enabled for this file">
                          🎯 RAG Ready
                        </span>
                      )}
                    </div>
                    <div 
                      className="analysis-content"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  </div>
                ) : (
                  <div className="regular-message-wrapper">
                    {message.usedRAG && (
                      <div className="message-meta">
                        <span className="rag-badge" title="Answer generated from your uploaded notes">
                          🎯 RAG
                        </span>
                      </div>
                    )}
                    <div 
                      className="regular-message"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    {message.usedRAG && message.role === 'assistant' && (
                      <div className="feedback-buttons">
                        <button
                          className={`feedback-btn ${feedbackSubmitted[index] === 'positive' ? 'active' : ''}`}
                          onClick={() => handleFeedback(index, 'positive')}
                          disabled={feedbackSubmitted[index]}
                          title="Helpful answer"
                        >
                          👍
                        </button>
                        <button
                          className={`feedback-btn ${feedbackSubmitted[index] === 'negative' ? 'active' : ''}`}
                          onClick={() => handleFeedback(index, 'negative')}
                          disabled={feedbackSubmitted[index]}
                          title="Not helpful"
                        >
                          👎
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {(loading || uploading) && (
            <div className="message assistant">
              <div className="message-content">
                <LoadingDots 
                  text={uploading ? "Processing your file" : currentNoteId ? "Searching your notes with RAG" : "AI is thinking"} 
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