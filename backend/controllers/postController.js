const Note = require('../models/Note');
const Session = require('../models/Session');
const Video = require('../models/Video');

const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = await Note.create({ title, content });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error });
  }
};

const createSession = async (req, res) => {
  try {
    const { userId, noteId, conversation } = req.body;
    const newSession = await Session.create({ userId, noteId, conversation });
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error });
  }
};

const createVideo = async (req, res) => {
  try {
    const { userId, youtubeUrl, summary } = req.body;
    const newVideo = await Video.create({ userId, youtubeUrl, summary });
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save video info', error });
  }
};

module.exports = { createNote, createSession, createVideo };
