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
  const [summary, setSummary] = useState('');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [fileSelectedTime, setFileSelectedTime] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);  // Only take the first file
      setSummary(''); // Clear any existing summary
      setCurrentFileId(null); // Clear any existing file ID
      setFileSelectedTime(Date.now()); // Record when file was selected
      setError(''); // Clear any existing errors
    }
  }, []);

  // Check if file has been selected but not uploaded after 5 minutes
  useEffect(() => {
    if (file && fileSelectedTime) {
      const timeoutId = setTimeout(() => {
        setError('Please upload your selected file or remove it to select a new one.');
      }, 5 * 60 * 1000); // 5 minutes

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
    multiple: false,  // Only allow single file selection
    noClick: false,
    noDrag: false,
    noKeyboard: false,
    noDragEventsBubbling: false,
    preventDropOnDocument: true,
    disabled: false,
    useFsAccessApi: true,
    autoFocus: false,
    onFileDialogOpen: () => {
      // This will show "All Files" as default in the file picker
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.setAttribute('accept', '*/*');
      }
    }
  });

  const handleUpload = async () => {
    if (!file || !user) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSummary('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user._id);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store the file ID and get the summary
      setCurrentFileId(response.data.file._id);
      setSummary(response.data.file.summary || 'No summary available');
      setFile(null);
      setFileSelectedTime(null); // Reset the selected time after successful upload
    } catch (err) {
      // Handle the case where the file already exists
      if (err.status === 'conflict' || err.message?.includes('already exists')) {
        const existingFile = err.existingFile;
        if (existingFile) {
          setCurrentFileId(existingFile._id);
          setSummary(existingFile.summary || 'No summary available');
          setError('This file was already uploaded. Showing existing summary.');
        } else {
          setError('File exists but details could not be retrieved.');
        }
      } else {
        setError(err.message || 'Failed to upload file');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setSummary('');
    setCurrentFileId(null);
    setFileSelectedTime(null); // Reset the selected time when file is removed
    setError(''); // Clear any errors when file is removed
  };

  return (
    <div className="file-upload-container">
      <h2 className="file-upload-title">Upload File</h2>
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'dragging' : ''}`}
      >
        <input {...getInputProps()} className="file-input" />
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          <p className="upload-text-primary">Drag & drop a file here</p>
          <p className="upload-text-secondary">or click to select a file</p>
        </div>
      </div>

      {file && (
        <div className="file-list">
          <div className="file-item">
            <span className="file-name">{file.name}</span>
            <button
              onClick={removeFile}
              className="file-remove"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="upload-button"
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>

      {summary && <Summary summary={summary} />}
    </div>
  );
}

export default FileUpload;
