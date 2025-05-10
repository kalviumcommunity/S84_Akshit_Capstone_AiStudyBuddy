import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import FileUpload from './components/FileUpload';
import YouTubeInput from './components/YouTubeInput';
import Summary from './components/Summary';

const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/chat" />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/upload" element={<FileUpload />} />
              <Route path="/youtube" element={<YouTubeInput />} />
              <Route path="/summaries" element={<Summary />} />
              <Route path="*" element={<Navigate to="/chat" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
