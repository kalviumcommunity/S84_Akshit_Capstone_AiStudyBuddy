const Session = require('../models/Session');

const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving session' });
  }
};

module.exports = { getAllSessions, getSessionById };
