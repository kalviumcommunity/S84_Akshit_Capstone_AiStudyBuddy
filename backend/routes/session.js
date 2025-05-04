const express = require('express');
const router = express.Router();
const { getAllSessions, getSessionById, getSessionsByUser } = require('../controllers/sessionController');

router.get('/', getAllSessions);
router.get('/user/:userId', getSessionsByUser);
router.get('/:id', getSessionById);

module.exports = router;
