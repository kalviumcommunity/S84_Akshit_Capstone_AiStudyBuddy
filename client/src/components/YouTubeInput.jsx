import React, { useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import './YouTubeInput.css';

function YouTubeInput() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [studySummaries, setStudySummaries] = useState([]);
  const [generatingStudySummary, setGeneratingStudySummary] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [existingVideo, setExistingVideo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummary('');
    setExistingVideo(null);

    if (!user) {
      setError('Please log in to use this feature');
      setLoading(false);
      return;
    }

    try {
      // Create a new video entry with all required fields
      const response = await api.post('/api/videos', { 
        user: user._id,
        youtubeUrl: url,
        title: 'YouTube Video', // Required field
        thumbnailUrl: `https://img.youtube.com/vi/${url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)[1]}/default.jpg`, // Generate thumbnail URL
        channelTitle: 'Unknown Channel', // Default channel title
        duration: '0:00', // Default duration
        summary: '', // Empty summary initially
        tags: [] // Empty tags array
      });

      // Store the video ID for later use
      setCurrentVideoId(response.data.video._id);
      // Get the video summary from the response
      setSummary(response.data.video.summary || 'No summary available');
    } catch (err) {
      // Handle the case where the video already exists
      if (err.status === 'conflict' || err.message === 'This YouTube video has already been added') {
        const existingVideoData = err.existingVideo;
        
        if (existingVideoData) {
          setExistingVideo(existingVideoData);
          setCurrentVideoId(existingVideoData._id);
          setError('This video was already added. Click "Get Summary" to view it.');
        } else {
          setError('Video exists but details could not be retrieved.');
        }
      } else {
        setError(err.message || 'Failed to process YouTube video');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    if (!existingVideo) return;
    
    setLoading(true);
    try {
      // Get the video details
      const response = await api.get(`/api/videos/${existingVideo._id}`);
      const video = response.data;
      
      setSummary(video.summary || 'No summary available');
      
      // If there are any notes, add them to study summaries
      if (video.notes && video.notes.length > 0) {
        setStudySummaries(video.notes.map(note => note.content));
      }
      
      setError('');
    } catch (err) {
      setError('Failed to get video summary');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudySummary = async () => {
    if (!summary || !currentVideoId) return;
    
    setGeneratingStudySummary(true);
    try {
      // Update the video with the study summary using the video ID
      const response = await api.put(`/api/videos/${currentVideoId}`, { 
        summary: summary,
        notes: [{
          timestamp: '0:00',
          content: summary
        }]
      });
      
      setStudySummaries(prev => [...prev, response.data.summary]);
    } catch (err) {
      setError(err.message || 'Failed to generate study summary');
    } finally {
      setGeneratingStudySummary(false);
    }
  };

  return (
    <div className="youtube-container">
      <h2 className="youtube-title">YouTube Video</h2>
      <form onSubmit={handleSubmit} className="youtube-form">
        <div className="youtube-form-container">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="youtube-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="youtube-button"
          >
            {loading ? 'Processing...' : 'Summarize'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          {error}
          {existingVideo && (
            <button
              onClick={handleGetSummary}
              disabled={loading}
              className="get-summary-button"
            >
              Get Summary
            </button>
          )}
        </div>
      )}

      {summary && (
        <>
          <div className="summary-container">
            <div className="summary-box">
              <h3 className="summary-title">Video Summary</h3>
              <div className="summary-content">
                <p>{summary}</p>
              </div>
            </div>
          </div>

          <div className="study-summaries">
            <div className="study-summaries-header">
              <h3 className="study-summaries-title">Study Summaries</h3>
              <button
                onClick={handleGenerateStudySummary}
                disabled={generatingStudySummary || !summary || !currentVideoId}
                className="generate-button"
              >
                {generatingStudySummary ? 'Generating...' : 'Generate New Summary'}
              </button>
            </div>

            {studySummaries.length === 0 ? (
              <div className="no-summaries">
                <p>No summaries yet. Generate your first summary!</p>
              </div>
            ) : (
              <div className="summary-list">
                {studySummaries.map((studySummary, index) => (
                  <div key={index} className="summary-item">
                    <p>{studySummary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default YouTubeInput; 