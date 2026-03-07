const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const buildDir = path.join(__dirname, 'build');

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

log('Starting server.js');
log('Environment:', { PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV });

try {
  const stat = fs.statSync(buildDir);
  if (!stat.isDirectory()) {
    log('Warning: build exists but is not a directory:', buildDir);
  } else {
    const files = fs.readdirSync(buildDir);
    log('Found build files count:', files.length);
    if (files.length > 0) log('Sample build files:', files.slice(0, 10));
  }
} catch (err) {
  log('Build directory check failed:', err.message);
}

// Simple request logger
app.use((req, res, next) => {
  log('REQ', req.method, req.url);
  next();
});

// Serve static assets
app.use(express.static(buildDir));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found. Build may be missing.');
  }
});

const server = app.listen(PORT, () => {
  log(`Listening on port ${PORT}`);
});

process.on('unhandledRejection', (reason, p) => {
  log('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  log('Uncaught Exception thrown:', err && err.stack ? err.stack : err);
  process.exit(1);
});

module.exports = server;
