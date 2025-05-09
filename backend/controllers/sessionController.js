const Session = require('../models/Session');

// Get all sessions
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sessions by user (placeholder for future implementation)
const getSessionsByUser = async (req, res) => {
  try {
    const sessions = await Session.find(); // This will be modified when user authentication is added
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  getSessionsByUser
};
