import { useState } from 'react';
import axios from 'axios';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadMsg(res.data.message);
    } catch (err) {
      console.error(err);
      setUploadMsg('Upload failed');
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="application/pdf,image/*" />
      <button onClick={handleUpload}>Upload</button>
      <p>{uploadMsg}</p>
    </div>
  );
}

export default FileUpload;
