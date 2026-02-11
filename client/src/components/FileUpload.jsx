import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import Summary from './Summary';
import './FileUpload.css';

function FileUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState('');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [fileSelectedTime, setFileSelectedTime] = useState(null);
  const [uploadedFileType, setUploadedFileType] = useState(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setSummary('');
      setCurrentFileId(null);
      setFileSelectedTime(Date.now());
      setError('');
      setUploadProgress(0);
    }
  }, []);

  // Check if file has been selected but not uploaded after 5 minutes
  useEffect(() => {
    if (file && fileSelectedTime) {
      const timeoutId = setTimeout(() => {
        setError('⏰ Please upload your selected file or remove it to select a new one.');
      }, 5 * 60 * 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [file, fileSelectedTime]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    disabled: uploading || analyzing,
    onFileDialogOpen: () => {
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.setAttribute('accept', '*/*');
      }
    }
  });

  const handleUpload = async () => {
    if (!file || !user) {
      setError('📁 Please select a file to upload');
      return;
    }

    setUploading(true);
    setAnalyzing(false);
    setError('');
    setSummary('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user._id);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Check if it's an image and show analyzing state
      if (response.data.file.isImage) {
        setAnalyzing(true);
        // Simulate AI analysis time
        setTimeout(() => {
          setAnalyzing(false);
        }, 2000);
      }

      setCurrentFileId(response.data.file._id);
      setSummary(response.data.file.summary || 'No summary available');
      setUploadedFileType(response.data.file.mimetype);
      setIsAiGenerated(response.data.file.aiAnalyzed || false);
      setFile(null);
      setFileSelectedTime(null);
      
    } catch (err) {
      if (err.status === 'conflict' || err.message?.includes('already exists')) {
        const existingFile = err.existingFile;
        if (existingFile) {
          setCurrentFileId(existingFile._id);
          setSummary(existingFile.summary || 'No summary available');
          setUploadedFileType(existingFile.mimetype);
          setIsAiGenerated(existingFile.aiAnalyzed || false);
          setError('✨ This file was already uploaded. Showing existing analysis.');
        } else {
          setError('❌ File exists but details could not be retrieved.');
        }
      } else {
        setError(`❌ ${err.message || 'Failed to upload file'}`);
      }
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setSummary('');
    setCurrentFileId(null);
    setFileSelectedTime(null);
    setUploadedFileType(null);
    setIsAiGenerated(false);
    setError('');
    setUploadProgress(0);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'txt': return '📝';
      case 'doc':
      case 'docx': return '📋';
      default: return '📁';
    }
  };

  return (
    <div className="file-upload-container">
      <div className="upload-header">
        <h2 className="file-upload-title">
          <span className="title-icon">📚</span>
          Upload Your Study Material
        </h2>
        <p className="upload-subtitle">
          Drop your files here and let AI help you study smarter
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'dragging' : ''} ${uploading || analyzing ? 'processing' : ''}`}
      >
        <input {...getInputProps()} className="file-input" />
        
        {uploading || analyzing ? (
          <div className="upload-processing">
            {uploading && (
              <>
                <div className="upload-icon processing">📤</div>
                <div className="upload-text">
                  <p className="upload-text-primary">Uploading your file...</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="upload-text-secondary">{Math.round(uploadProgress)}% complete</p>
                </div>
              </>
            )}
            
            {analyzing && (
              <>
                <div className="upload-icon analyzing">🤖</div>
                <div className="upload-text">
                  <p className="upload-text-primary">AI is analyzing your content</p>
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="upload-text-secondary">This may take a moment...</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              {isDragActive ? '📥' : '📁'}
            </div>
            <div className="upload-text">
              <p className="upload-text-primary">
                {isDragActive ? 'Drop your file here!' : 'Drag & drop your study material'}
              </p>
              <p className="upload-text-secondary">
                or click to browse • PDF, Images, Documents supported
              </p>
            </div>
          </div>
        )}
      </div>

      {file && !uploading && !analyzing && (
        <div className="file-preview">
          <div className="file-item">
            <span className="file-icon">{getFileIcon(file.name)}</span>
            <div className="file-details">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button
              onClick={removeFile}
              className="file-remove"
              title="Remove file"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading || analyzing}
        className={`upload-button ${uploading || analyzing ? 'processing' : ''}`}
      >
        {uploading ? (
          <>
            <span className="button-spinner"></span>
            Uploading...
          </>
        ) : analyzing ? (
          <>
            <span className="button-ai">🤖</span>
            Analyzing...
          </>
        ) : (
          <>
            <span className="button-icon">🚀</span>
            Upload & Analyze
          </>
        )}
      </button>

      {summary && (
        <Summary 
          summary={summary} 
          isAiGenerated={isAiGenerated}
          fileType={uploadedFileType}
        />
      )}
    </div>
  );
}

export default FileUpload;
