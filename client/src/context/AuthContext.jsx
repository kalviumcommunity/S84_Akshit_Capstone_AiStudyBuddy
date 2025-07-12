import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      console.log('Attempting login with:', { email });
      
      const response = await api.post('/api/users/login', {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('Login error full object:', error);
const errorMessage = error?.response?.data?.message || error?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      localStorage.removeItem('token');
      setUser(null);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      console.log('Attempting registration with:', { username, email });
      
      const response = await api.post('/api/users/register', {
        username,
        email,
        password
      });

      console.log('Registration response:', response.data);

      if (!response.data || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      // After successful registration, automatically log in
      const loginResult = await login(email, password);
      return loginResult;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const deleteAccount = async () => {
    try {
      if (!user || !user._id) {
        throw new Error('No user found');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await api.delete(`/api/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logout();
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <LoadingScreen />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 