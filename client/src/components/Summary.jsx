import React from 'react';
import './Summary.css';

function Summary({ summary, isAiGenerated = false, fileType = null }) {
  // Function to format AI-generated text with better structure
  const formatAiSummary = (text) => {
    if (!text) return null;
    
    // Split by numbered sections or bullet points
    const sections = text.split(/(?=\d+\.\s\*\*|\*\*[^*]+\*\*:?|\n\n)/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      // Check if it's a numbered header (1. **Header**)
      if (section.match(/^\d+\.\s\*\*.*?\*\*/)) {
        const [, number, header, content] = section.match(/^(\d+\.\s)\*\*(.*?)\*\*:?\s*(.*)/s) || [];
        return (
          <div key={index} className="summary-section">
            <h4 className="summary-section-header">
              <span className="section-number">{number}</span>
              {header}
            </h4>
            {content && <div className="summary-section-content" dangerouslySetInnerHTML={{ __html: formatContent(content.trim()) }} />}
          </div>
        );
      }
      
      // Check if it's just a header with **text**
      if (section.match(/^\*\*(.*?)\*\*/)) {
        const [, header, content] = section.match(/^\*\*(.*?)\*\*:?\s*(.*)/s) || [];
        return (
          <div key={index} className="summary-section">
            <h4 className="summary-section-header">{header}</h4>
            {content && <div className="summary-section-content" dangerouslySetInnerHTML={{ __html: formatContent(content.trim()) }} />}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <div key={index} className="summary-paragraph" dangerouslySetInnerHTML={{ __html: formatContent(section.trim()) }} />
      );
    }).filter(Boolean);
  };

  // Helper function to format content with better styling
  const formatContent = (content) => {
    return content
      // Format bullet points
      .replace(/^[-•]\s/gm, '<span class="bullet-point">•</span> ')
      // Format bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>')
      // Format italic text
      .replace(/\*(.*?)\*/g, '<em class="emphasis">$1</em>')
      // Format code or formulas
      .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
      // Format line breaks
      .replace(/\n/g, '<br>');
  };

  const getFileTypeIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type?.startsWith('text/')) return '📝';
    return '📁';
  };

  const getFileTypeLabel = (type) => {
    if (type?.startsWith('image/')) return 'Image Analysis';
    if (type === 'application/pdf') return 'PDF Summary';
    if (type?.startsWith('text/')) return 'Text Summary';
    return 'File Summary';
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2 className="summary-title">
          {fileType && <span className="file-type-icon">{getFileTypeIcon(fileType)}</span>}
          <span className="summary-title-text">
            {isAiGenerated ? getFileTypeLabel(fileType) : 'Summary'}
          </span>
        </h2>
        {isAiGenerated && (
          <div className="ai-badge">
            <span className="ai-icon">🤖</span>
            <span className="ai-text">AI Generated</span>
          </div>
        )}
      </div>
      
      <div className="summary-content">
        {summary ? (
          <div className="summary-text">
            {isAiGenerated ? formatAiSummary(summary) : (
              <div className="summary-paragraph" dangerouslySetInnerHTML={{ __html: formatContent(summary) }} />
            )}
          </div>
        ) : (
          <div className="summary-placeholder">
            <div className="placeholder-icon">
              {isAiGenerated ? '🤖' : '📝'}
            </div>
            <p className="placeholder-text">
              {isAiGenerated 
                ? 'AI analysis will appear here after uploading an image' 
                : 'Your summary will appear here after uploading'
              }
            </p>
          </div>
        )}
      </div>
      
      {isAiGenerated && summary && (
        <div className="ai-disclaimer">
          <div className="disclaimer-content">
            <span className="disclaimer-icon">⚠️</span>
            <small className="disclaimer-text">
              AI-generated content may not be 100% accurate. Please verify important information.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default Summary; 