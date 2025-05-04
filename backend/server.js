const sessionRoutes = require('./routes/session');
const postRoutes = require('./routes/postRoutes');
const putRoutes = require('./routes/putRoutes');

app.use('/api/sessions', sessionRoutes); // for GETs
app.use('/api', postRoutes); // for POSTs
app.use('/api', putRoutes); // for PUTs
