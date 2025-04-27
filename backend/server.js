const sessionRoutes = require('./routes/session');
const postRoutes = require('./routes/postRoutes');

app.use('/api/sessions', sessionRoutes); // for GETs
app.use('/api', postRoutes); // for POSTs
