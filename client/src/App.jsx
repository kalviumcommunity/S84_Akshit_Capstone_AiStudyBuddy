import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './components/Welcome';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import YouTubeInput from './components/YouTubeInput';
import Chat from './components/Chat';
import Summary from './components/Summary';
import './App.css';

// Component for the dashboard layout
function DashboardLayout() {
  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-layout">
        <main className="dashboard-main">
          <section className="dashboard-left">
            <FileUpload />
            <YouTubeInput />
            <Summary />
          </section>
          <section className="dashboard-right">
            <Chat />
          </section>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Welcome page */}
        <Route path="/" element={<Welcome />} />
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Protected dashboard layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
