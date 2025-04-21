const express = require('express');
const router = express.Router();
const { getAllSessions, getSessionById } = require('../controllers/sessionController');

router.get('/', getAllSessions);
router.get('/:id', getSessionById);

module.exports = router;
