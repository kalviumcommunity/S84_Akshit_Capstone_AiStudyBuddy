const express = require('express');
const mongoose = require('mongoose');
const app = express();

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/aistudybuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const sessionRoutes = require('./routes/session');
const postRoutes = require('./routes/postRoutes');
const putRoutes = require('./routes/putRoutes');
const userRoutes = require('./routes/userRoutes');

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AI Study Buddy API',
    backendUrl: 'https://aistudybuddy.onrender.com'
  });
});

app.use('/api/sessions', sessionRoutes); // for GETs
app.use('/api', postRoutes); // for POSTs
app.use('/api', putRoutes); // for PUTs
app.use('/api/users', userRoutes); // for user operations

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
