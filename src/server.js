// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const playersRouter    = require('./routes/players');
const artifactsRouter  = require('./routes/artifacts');
const locationsRouter  = require('./routes/locations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/players',   playersRouter);
app.use('/api/artifacts', artifactsRouter);
app.use('/api/locations', locationsRouter);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏜️  Archaeology Simulator running at http://localhost:${PORT}`);
  console.log(`📡  API base: http://localhost:${PORT}/api\n`);
});
