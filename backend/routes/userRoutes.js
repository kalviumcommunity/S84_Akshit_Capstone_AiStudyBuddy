const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

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

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data and token
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt
    };

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -googleId');
    res.status(200).json({
      message: 'User profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid ID',
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }
    
    // Ensure user can only delete their own account
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You are not authorized to delete this account' 
      });
    }

    // Delete user's associated data (optional - implement if needed)
    // await Promise.all([
    //   Note.deleteMany({ user: id }),
    //   Video.deleteMany({ user: id }),
    //   Session.deleteMany({ user: id })
    // ]);
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({ 
      message: 'Account deleted successfully',
      user: {
        _id: userToDelete._id,
        username: userToDelete.username,
        email: userToDelete.email
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete account'
    });
  }
});

module.exports = router;