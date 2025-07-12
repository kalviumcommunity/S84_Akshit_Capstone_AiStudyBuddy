import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './components/Welcome';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import YouTubeInput from './components/YouTubeInput';
import Chat from './components/Chat';
import Summary from './components/Summary';
import LoadingScreen from './components/LoadingScreen';
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

function AppContent() {
  const [isFrontendLoading, setIsFrontendLoading] = useState(true);

  useEffect(() => {
    // Simulate frontend loading time
    const timer = setTimeout(() => {
      setIsFrontendLoading(false);
    }, 3000); // Show loading screen for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isFrontendLoading) {
    return <LoadingScreen message="Starting AI Study Buddy..." />;
  }

  return (
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
  );
}

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
