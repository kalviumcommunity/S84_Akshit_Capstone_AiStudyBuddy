// routes/upload.js or directly in your app.js/server.js

const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Init upload middleware
const upload = multer({ storage, fileFilter });

// Upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ message: 'File uploaded successfully', file: req.file });
});

module.exports = router;
