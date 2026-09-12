const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Add a new Drive source
router.post('/', driveController.addDriveSource);

// Get all Drive sources for user
router.get('/', driveController.getDriveSources);

// Get a single Drive source
router.get('/:id', driveController.getDriveSource);

// Manually trigger sync
router.post('/:id/sync', driveController.syncDriveSource);

// Update Drive source
router.put('/:id', driveController.updateDriveSource);

// Delete Drive source
router.delete('/:id', driveController.deleteDriveSource);

module.exports = router;
