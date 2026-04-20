const Video = require('../models/Video');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { fetchTranscript } = require('youtube-transcript-plus');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKeyManager = require('../utils/apiKeyManager');

// Initialize Gemini AI with key rotation
function getGenAI() {
  const apiKey = apiKeyManager.getNextKey();
  return new GoogleGenerativeAI(apiKey);
}

// Validation middleware for creating a video
const validateVideo = [
  body('user')
    .isMongoId().withMessage('Invalid user ID format')
    .notEmpty().withMessage('User ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('youtubeUrl')
    .isURL().withMessage('Valid URL is required')
    .matches(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    .withMessage('Invalid YouTube URL format'),
  body('thumbnailUrl').notEmpty().withMessage('Thumbnail URL is required'),
];

// Create a new video
const createVideo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { user, title, youtubeUrl, thumbnailUrl, channelTitle, duration, summary, tags } = req.body;
    
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid YouTube URL format'
      });
    }
    const videoId = videoIdMatch[1];

    const newVideo = await Video.create({
      user,
      title,
      youtubeUrl,
      videoId,
      thumbnailUrl,
      channelTitle: channelTitle || 'Unknown',
      duration: duration || '0:00',
      summary: summary || '',
      tags: Array.isArray(tags) ? tags : []
    });

    res.status(201).json({
      status: 'success',
      message: 'Video created successfully',
      video: newVideo
    });

  } catch (error) {
    console.error('Video creation error:', error);

    if (error.code === 11000 && error.keyValue?.videoId) {
      try {
        const existingVideo = await Video.findOne({ videoId: error.keyValue.videoId });
        return res.status(409).json({
          status: 'conflict',
          message: 'This YouTube video has already been added',
          existingVideo
        });
      } catch (findError) {
        console.error('Error finding existing video:', findError);
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to save video info',
      error: error.message
    });
  }
};

// Get all videos
const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      error: 'Failed to fetch videos',
      message: error.message
    });
  }
};

// Get video by ID
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(200).json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      error: 'Failed to fetch video',
      message: error.message
    });
  }
};

// Get videos by user ID
const getVideosByUser = async (req, res) => {
  try {
    const videos = await Video.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching user videos:', error);
    res.status(500).json({
      error: 'Failed to fetch user videos',
      message: error.message
    });
  }
};

// Delete a video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    const deletedVideo = await Video.findByIdAndDelete(id);
    
    if (!deletedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.status(200).json({ message: 'Video deleted successfully', deletedVideo });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      error: 'Failed to delete video',
      message: error.message
    });
  }
};

// Get the latest video
const getLatestVideo = async (req, res) => {
  try {
    const latestVideo = await Video.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latestVideo) {
      return res.status(404).json({
        status: 'error',
        message: 'No videos found'
      });
    }

    res.status(200).json({
      status: 'success',
      video: latestVideo
    });
  } catch (error) {
    console.error('Error getting latest video:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get latest video',
      error: error.message
    });
  }
};

// Extract YouTube transcript using youtube-transcript-plus (WORKING!)
const getYoutubeTranscript = async (req, res) => {
  try {
    const { youtubeUrl, action, userId } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'YouTube URL is required'
      });
    }

    // Extract video ID
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid YouTube URL format'
      });
    }
    const videoId = videoIdMatch[1];

    console.log(`\n=== YouTube Transcript Request ===`);
    console.log(`Video ID: ${videoId}`);
    console.log(`Action: ${action || 'summary'}`);

    // Fetch transcript using youtube-transcript-plus
    let transcriptData;
    try {
      console.log('Fetching transcript...');
      transcriptData = await fetchTranscript(videoId);
      console.log(`✅ Transcript fetched: ${transcriptData.length} segments`);
    } catch (error) {
      console.error('Transcript fetch error:', error.message);
      
      // Handle specific errors
      if (error.message?.includes('no longer available') || error.message?.includes('removed')) {
        return res.status(404).json({
          status: 'error',
          message: 'Video not found',
          details: 'The video may be private, deleted, or restricted in your region.',
          videoId: videoId
        });
      }
      
      if (error.message?.includes('disabled') || error.message?.includes('not available')) {
        return res.status(404).json({
          status: 'error',
          message: 'No transcript available for this video',
          details: 'This video does not have captions/subtitles enabled. Please try another video with captions.',
          videoId: videoId
        });
      }
      
      throw error;
    }

    if (!transcriptData || transcriptData.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No transcript available for this video',
        details: 'The video may not have captions enabled.',
        videoId: videoId
      });
    }

    // Combine transcript text
    const fullTranscript = transcriptData.map(item => item.text).join(' ');
    console.log(`Transcript length: ${fullTranscript.length} characters`);

    // Handle different actions
    let response = {};
    
    if (action === 'transcript' || action === 'lyrics') {
      response = {
        status: 'success',
        action: action,
        transcript: fullTranscript,
        videoId: videoId
      };
    } else if (action === 'summary' || !action) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          status: 'error',
          message: 'AI service not configured'
        });
      }

      console.log('Generating AI summary...');
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      
      const prompt = `Please provide a concise summary of this YouTube video transcript. Focus on the main points and key takeaways.

Transcript:
${fullTranscript.substring(0, 30000)}

Provide a clear, organized summary:`;

      const result = await model.generateContent(prompt);
      const summary = result.response.text();
      console.log('✅ Summary generated');

      response = {
        status: 'success',
        action: 'summary',
        summary: summary,
        transcript: fullTranscript,
        videoId: videoId
      };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Use "transcript", "lyrics", or "summary"'
      });
    }

    // Save transcript as note for RAG
    let noteId = null;
    if (userId && (action === 'summary' || !action)) {
      try {
        console.log('Saving to RAG system...');
        const Note = require('../models/Note');
        const { chunkText } = require('../utils/chunkText');
        const { getEmbedding } = require('../utils/embedding');
        const Chunk = require('../models/Chunk');

        const note = await Note.create({
          user: userId,
          title: `YouTube: ${videoId}`,
          content: fullTranscript,
          fileType: 'text',
          fileUrl: youtubeUrl,
          originalFileName: `youtube_${videoId}.txt`,
          fileSize: Buffer.byteLength(fullTranscript, 'utf8'),
          summary: response.summary || 'YouTube video transcript'
        });

        noteId = note._id;

        const chunks = chunkText(fullTranscript);
        console.log(`Created ${chunks.length} chunks from YouTube transcript`);

        for (let i = 0; i < chunks.length; i++) {
          const chunkTextContent = chunks[i];
          const embedding = await getEmbedding(chunkTextContent);
          
          const words = chunkTextContent.toLowerCase().match(/\b\w{5,}\b/g) || [];
          const wordFreq = {};
          words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
          const keywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
          
          await Chunk.create({
            text: chunkTextContent,
            embedding: embedding,
            noteId: note._id,
            userId: userId,
            metadata: {
              chunkIndex: i,
              totalChunks: chunks.length,
              wordCount: chunkTextContent.split(/\s+/).length,
              fileType: 'youtube',
              sourceFileName: `youtube_${videoId}.txt`,
              keywords: keywords
            }
          });
        }

        console.log(`✅ YouTube transcript saved as note ${noteId} with RAG support`);
        response.noteId = noteId;
        response.ragEnabled = true;
      } catch (noteError) {
        console.error('Failed to save YouTube transcript as note:', noteError);
      }
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('YouTube transcript error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch YouTube transcript',
      details: 'An unexpected error occurred. Please try again.',
      error: error.message
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  getVideosByUser,
  createVideo,
  validateVideo,
  deleteVideo,
  getLatestVideo,
  getYoutubeTranscript
};
