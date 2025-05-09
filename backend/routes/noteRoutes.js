const express = require('express');
const router = express.Router();
const { getAllNotes, getNoteById, getNotesByUser, createNote, validateNote, deleteNote } = require('../controllers/noteController');

// GET /api/notes - Get all notes
router.get('/', getAllNotes);

// GET /api/notes/user/:userId - Get notes by user ID
router.get('/user/:userId', getNotesByUser);

// POST /api/notes - Create a new note
router.post('/', validateNote, createNote);

// GET /api/notes/:id - Get a specific note by ID
router.get('/:id', getNoteById);

// DELETE /api/notes/:id - Delete a specific note by ID
router.delete('/:id', deleteNote);

module.exports = router; 