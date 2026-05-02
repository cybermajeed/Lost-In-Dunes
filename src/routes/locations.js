// src/routes/locations.js
const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/locations – all locations with richness
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('richness_score', { ascending: false });
    if (error) throw error;
    res.json({ locations: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/patterns – civilization pattern detection (JOIN query)
router.get('/patterns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('civilization_patterns')
      .select('*')
      .order('artifact_count', { ascending: false });
    if (error) throw error;
    res.json({ patterns: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
