const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const sessionRoutes = require('./routes/session');
const postRoutes = require('./routes/postRoutes');
const putRoutes = require('./routes/putRoutes');

app.use('/api/sessions', sessionRoutes); // for GETs
app.use('/api', postRoutes); // for POSTs
app.use('/api', putRoutes); // for PUTs

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
