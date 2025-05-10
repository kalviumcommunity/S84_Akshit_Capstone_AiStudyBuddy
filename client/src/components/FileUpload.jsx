import React from 'react';

const FileUpload = () => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Upload Study Material</h2>
      
      <div className="text-center">
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Upload File
        </button>
      </div>
    </div>
  );
};

export default FileUpload; 