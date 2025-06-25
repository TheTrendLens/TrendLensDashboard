// server.ts
import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env['PORT'] || 8080;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist/trendlens-frontend')));

// Send all requests to index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/trendlens-frontend/index.html'));
});

// Start the app by listening on the default Heroku port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
