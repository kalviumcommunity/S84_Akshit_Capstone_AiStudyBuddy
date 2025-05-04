const Session = require('../models/Session');

const getAllSessions = async (req, res) => {
  try {
    const { userId, limit = 10, page = 1, sort = '-createdAt' } = req.query;
    
    // Build query
    const query = {};
    if (userId) query.userId = userId;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sessions = await Session.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
      
    const totalSessions = await Session.countDocuments(query);
    
    res.status(200).json({
      sessions,
      pagination: {
        total: totalSessions,
        page: parseInt(page),
        pages: Math.ceil(totalSessions / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      message: err.message 
    });
  }
};

const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }
    
    const session = await Session.findById(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(200).json(session);
  } catch (err) {
    console.error('Error retrieving session:', err);
    res.status(500).json({ 
      error: 'Error retrieving session',
      message: err.message 
    });
  }
};

const getSessionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const sessions = await Session.find({ userId });
    
    res.status(200).json(sessions);
  } catch (err) {
    console.error('Error fetching user sessions:', err);
    res.status(500).json({ 
      error: 'Failed to fetch user sessions',
      message: err.message 
    });
  }
};

module.exports = { 
  getAllSessions, 
  getSessionById,
  getSessionsByUser
};
