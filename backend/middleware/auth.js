const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: 'Invalid user credentials'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: 'Invalid authentication token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: 'Authentication token has expired'
      });
    }
    res.status(401).json({ 
      message: 'Authentication failed',
      error: 'An unexpected authentication error occurred'
    });
  }
};

module.exports = auth; 