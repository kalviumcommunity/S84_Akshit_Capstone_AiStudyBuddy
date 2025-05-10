import React, { useState } from 'react';

const Summary = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      // TODO: Implement summary generation with OpenAI
      const mockSummary = {
        id: Date.now(),
        title: 'Sample Summary',
        content: 'This is a placeholder summary that will be replaced with AI-generated content.',
        timestamp: new Date().toISOString(),
      };
      setSummaries([mockSummary, ...summaries]);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Study Summaries</h2>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {loading ? 'Generating...' : 'Generate New Summary'}
        </button>
      </div>

      <div className="space-y-4">
        {summaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No summaries yet. Generate your first summary!</p>
          </div>
        ) : (
          summaries.map((summary) => (
            <div
              key={summary.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium">{summary.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(summary.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600">{summary.content}</p>
              <div className="mt-4 flex space-x-2">
                <button className="text-sm text-blue-500 hover:text-blue-600">
                  Edit
                </button>
                <button className="text-sm text-red-500 hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Summary; 