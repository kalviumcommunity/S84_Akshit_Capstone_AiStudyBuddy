const express = require('express');
const router = express.Router();
const { getAllSessions, getSessionById, getSessionsByUser, createSession, validateSession, deleteSession } = require('../controllers/sessionController');
const authMiddleware = require('../middleware/auth');

// GET /api/sessions - Get all sessions
router.get('/', getAllSessions);

// GET /api/sessions/user/:userId - Get sessions by user ID
router.get('/user/:userId', getSessionsByUser);

// POST /api/sessions - Create a new session
router.post('/', validateSession, createSession);

// GET /api/sessions/:id - Get a specific session by ID
router.get('/:id', getSessionById);

// DELETE /api/sessions/:id - Delete a specific session by ID
router.delete('/:id', authMiddleware, deleteSession);

module.exports = router;
