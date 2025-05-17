import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './components/Welcome';
import './App.css';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import FileUpload from './components/FileUpload';
import YouTubeInput from './components/YouTubeInput';
import Summary from './components/Summary';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Welcome page */}
        <Route path="/" element={<Welcome />} />
        
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  <div className="container mx-auto p-6">
                    <Routes>
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/upload" element={<FileUpload />} />
                      <Route path="/youtube" element={<YouTubeInput />} />
                      <Route path="/summaries" element={<Summary />} />
                      <Route path="*" element={<Navigate to="/chat" replace />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
