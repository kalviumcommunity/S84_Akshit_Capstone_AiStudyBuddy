import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './components/Welcome';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

// Component for the dashboard layout
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewChat = () => {
    // Reset chat or navigate to new chat
    window.location.reload(); // Simple approach for now
  };

  // Close sidebar with Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="app-root">
      <Navbar onSidebarToggle={toggleSidebar} showBackButton={false} />
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
      />
      <div className={`dashboard-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <main className="dashboard-main">
          <Chat />
        </main>
      </div>
    </div>
  );
}

// Component for other pages that need back button
function StandardLayout({ children }) {
  return (
    <div className="app-root">
      <Navbar showBackButton={true} />
      <div className="dashboard-layout">
        <main className="dashboard-main">
          {children}
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
      {/* Protected dashboard routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      {/* Catch all other protected routes */}
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
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
