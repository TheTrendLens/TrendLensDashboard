const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

// Get the correct dist path
const distPath = path.join(__dirname, 'dist/trendlens-frontend/browser');

// Log the directory contents for debugging
console.log('Directory exists:', fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  console.log('Files in directory:', fs.readdirSync(distPath));
}

// Configure proper MIME types
app.use((req, res, next) => {
  // For ES modules
  if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  } else if (req.url.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  } else if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
  }
  next();
});

// Serve static files with proper caching
app.use(express.static(distPath, {
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.match(/\.(js|css|mjs)$/)) {
      // Cache JS/CSS files for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Redirect all routes to index.html for Angular's client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Cannot find index.html');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
