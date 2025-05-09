const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, {
      password: 0,  // Exclude password from the response
      googleId: 0   // Exclude googleId from the response
    }).sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      message: 'Users retrieved successfully',
      count: users.length,
      users: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    // Save user
    await user.save();

    // Return user data (excluding password)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

module.exports = router; 