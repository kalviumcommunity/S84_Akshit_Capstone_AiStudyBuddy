const DriveSource = require('../models/DriveSource');
const googleDrive = require('../utils/googleDrive');
const driveSyncService = require('../services/driveSyncService');

/**
 * Add a new Drive source
 */
exports.addDriveSource = async (req, res) => {
  try {
    const { name, driveLink } = req.body;
    const userId = req.user.id;

    if (!name || !driveLink) {
      return res.status(400).json({
        success: false,
        message: 'Name and Drive link are required'
      });
    }

    // Extract folder ID from link
    let folderId;
    try {
      folderId = googleDrive.extractFolderId(driveLink);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Check if this folder is already added
    const existing = await DriveSource.findOne({ user: userId, folderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This Drive folder is already added'
      });
    }

    // Create Drive source
    const driveSource = new DriveSource({
      user: userId,
      name,
      driveLink,
      folderId,
      isActive: true,
      syncStatus: 'pending'
    });

    await driveSource.save();

    // Trigger initial sync (async, don't wait)
    driveSyncService.syncDriveSource(driveSource._id).catch(err => {
      console.error('Initial sync failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Drive source added successfully. Initial sync started.',
      data: driveSource
    });

  } catch (error) {
    console.error('Error adding Drive source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add Drive source',
      error: error.message
    });
  }
};

/**
 * Get all Drive sources for user
 */
exports.getDriveSources = async (req, res) => {
  try {
    const userId = req.user.id;

    const driveSources = await DriveSource.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: driveSources
    });

  } catch (error) {
    console.error('Error fetching Drive sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Drive sources',
      error: error.message
    });
  }
};

/**
 * Get a single Drive source
 */
exports.getDriveSource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const driveSource = await DriveSource.findOne({ _id: id, user: userId });

    if (!driveSource) {
      return res.status(404).json({
        success: false,
        message: 'Drive source not found'
      });
    }

    res.json({
      success: true,
      data: driveSource
    });

  } catch (error) {
    console.error('Error fetching Drive source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Drive source',
      error: error.message
    });
  }
};

/**
 * Manually trigger sync for a Drive source
 */
exports.syncDriveSource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const driveSource = await DriveSource.findOne({ _id: id, user: userId });

    if (!driveSource) {
      return res.status(404).json({
        success: false,
        message: 'Drive source not found'
      });
    }

    if (driveSource.syncStatus === 'syncing') {
      return res.status(400).json({
        success: false,
        message: 'Sync already in progress'
      });
    }

    // Trigger sync (async)
    driveSyncService.syncDriveSource(driveSource._id).catch(err => {
      console.error('Manual sync failed:', err);
    });

    res.json({
      success: true,
      message: 'Sync started successfully'
    });

  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger sync',
      error: error.message
    });
  }
};

/**
 * Update Drive source (name, active status)
 */
exports.updateDriveSource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, isActive } = req.body;

    const driveSource = await DriveSource.findOne({ _id: id, user: userId });

    if (!driveSource) {
      return res.status(404).json({
        success: false,
        message: 'Drive source not found'
      });
    }

    if (name) driveSource.name = name;
    if (typeof isActive === 'boolean') driveSource.isActive = isActive;

    await driveSource.save();

    res.json({
      success: true,
      message: 'Drive source updated successfully',
      data: driveSource
    });

  } catch (error) {
    console.error('Error updating Drive source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Drive source',
      error: error.message
    });
  }
};

/**
 * Delete Drive source
 */
exports.deleteDriveSource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const driveSource = await DriveSource.findOne({ _id: id, user: userId });

    if (!driveSource) {
      return res.status(404).json({
        success: false,
        message: 'Drive source not found'
      });
    }

    // Delete associated notes and chunks
    const Note = require('../models/Note');
    const Chunk = require('../models/Chunk');

    for (const file of driveSource.syncedFiles) {
      if (file.noteId) {
        await Chunk.deleteMany({ noteId: file.noteId });
        await Note.findByIdAndDelete(file.noteId);
      }
    }

    await DriveSource.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Drive source deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Drive source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Drive source',
      error: error.message
    });
  }
};
