import React, { useState } from 'react';

const YouTubeInput = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateYouTubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement YouTube video processing
      console.log('Processing YouTube URL:', url);
    } catch (err) {
      setError('Failed to process video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">YouTube Video Analysis</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Video URL
          </label>
          <input
            type="text"
            id="youtube-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {loading ? 'Processing...' : 'Analyze Video'}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Features</h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-center">
            <span className="mr-2">✨</span>
            Generate video summaries
          </li>
          <li className="flex items-center">
            <span className="mr-2">💡</span>
            Ask questions about the content
          </li>
          <li className="flex items-center">
            <span className="mr-2">📝</span>
            Create study notes
          </li>
        </ul>
      </div>
    </div>
  );
};

export default YouTubeInput; 