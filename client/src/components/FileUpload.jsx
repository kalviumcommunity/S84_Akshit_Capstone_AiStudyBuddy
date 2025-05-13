import { useState } from 'react';
import api from '../api/api';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setUploadMsg('');
    setUploadedFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadMsg(response.data.message);
      setUploadedFile(response.data.file);
      setError('');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadMsg('');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept="application/pdf,image/*"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
          disabled={isUploading}
        />
      </div>
      <button 
        onClick={handleUpload}
        disabled={isUploading || !file}
        className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isUploading || !file
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadMsg && (
        <p className="mt-2 text-green-600">{uploadMsg}</p>
      )}
      {error && (
        <p className="mt-2 text-red-600">{error}</p>
      )}
      {uploadedFile && (
        <div className="mt-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Uploaded File:</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {uploadedFile.originalname}</p>
            <p><span className="font-medium">Size:</span> {(uploadedFile.size / 1024).toFixed(2)} KB</p>
            <p><span className="font-medium">Type:</span> {uploadedFile.mimetype}</p>
            {uploadedFile.mimetype.startsWith('image/') && (
              <div className="mt-2">
                <img 
                  src={`${api.defaults.baseURL}${uploadedFile.path}`} 
                  alt={uploadedFile.originalname}
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}
            {uploadedFile.mimetype === 'application/pdf' && (
              <div className="mt-2">
                <a 
                  href={`${api.defaults.baseURL}${uploadedFile.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  View PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
