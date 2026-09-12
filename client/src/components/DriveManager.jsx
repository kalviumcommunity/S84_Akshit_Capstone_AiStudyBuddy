import { useState, useEffect } from 'react';
import api from '../api/api';
import './DriveManager.css';

const DriveManager = () => {
  const [driveSources, setDriveSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    driveLink: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDriveSources();
  }, []);

  const fetchDriveSources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/drive');
      setDriveSources(response.data.data || []);
    } catch (err) {
      console.error('Error fetching drive sources:', err);
      setError('Failed to load Drive sources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.driveLink) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await api.post('/api/drive', formData);
      setSuccess(response.data.message);
      setFormData({ name: '', driveLink: '' });
      setShowAddForm(false);
      fetchDriveSources();
    } catch (err) {
      setError(err.message || 'Failed to add Drive source');
    }
  };

  const handleSync = async (id) => {
    try {
      setError('');
      setSuccess('');
      await api.post(`/api/drive/${id}/sync`);
      setSuccess('Sync started successfully');
      fetchDriveSources();
    } catch (err) {
      setError(err.message || 'Failed to start sync');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      setError('');
      await api.put(`/api/drive/${id}`, { isActive: !currentStatus });
      fetchDriveSources();
    } catch (err) {
      setError(err.message || 'Failed to update Drive source');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will delete all associated notes and chunks.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await api.delete(`/api/drive/${id}`);
      setSuccess('Drive source deleted successfully');
      fetchDriveSources();
    } catch (err) {
      setError(err.message || 'Failed to delete Drive source');
    }
  };

  const getSyncStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', text: 'Pending' },
      syncing: { class: 'badge-syncing', text: 'Syncing...' },
      completed: { class: 'badge-completed', text: 'Completed' },
      failed: { class: 'badge-failed', text: 'Failed' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return <div className="drive-manager"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="drive-manager">
      <div className="drive-header">
        <h2>Google Drive Sources</h2>
        <button 
          className="btn-add"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Drive Source'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showAddForm && (
        <div className="add-form">
          <h3>Add New Drive Source</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="e.g., Physics Notes"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Google Drive Folder Link</label>
              <input
                type="text"
                placeholder="https://drive.google.com/drive/folders/..."
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              />
              <small>Make sure the folder is set to "Anyone with the link can view"</small>
            </div>
            <button type="submit" className="btn-submit">Add Source</button>
          </form>
        </div>
      )}

      <div className="drive-sources-list">
        {driveSources.length === 0 ? (
          <div className="empty-state">
            <p>No Drive sources added yet.</p>
            <p>Add a Google Drive folder to automatically sync notes for your chatbot.</p>
          </div>
        ) : (
          driveSources.map((source) => (
            <div key={source._id} className="drive-source-card">
              <div className="card-header">
                <h3>{source.name}</h3>
                {getSyncStatusBadge(source.syncStatus)}
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Files Processed:</span>
                  <span className="value">{source.filesProcessed || 0}</span>
                </div>
                <div className="info-row">
                  <span className="label">Last Synced:</span>
                  <span className="value">{formatDate(source.lastSyncedAt)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className="value">
                    {source.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                {source.syncError && (
                  <div className="error-message">
                    Error: {source.syncError}
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button 
                  className="btn-sync"
                  onClick={() => handleSync(source._id)}
                  disabled={source.syncStatus === 'syncing'}
                >
                  🔄 Sync Now
                </button>
                <button 
                  className="btn-toggle"
                  onClick={() => handleToggleActive(source._id, source.isActive)}
                >
                  {source.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(source._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DriveManager;
