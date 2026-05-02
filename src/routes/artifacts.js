// src/routes/artifacts.js
const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { generateArtifact, analyzeArtifact } = require('../game/artifactGenerator');

// POST /api/artifacts/discover – player steps on a discovery spot
router.post('/discover', async (req, res) => {
  const { playerId, locationId } = req.body;
  if (!playerId || !locationId) return res.status(400).json({ error: 'playerId and locationId required' });

  try {
    // Fetch location richness
    const { data: loc, error: locErr } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();
    if (locErr) throw locErr;

    // Roll for discovery (richness affects probability)
    const roll = Math.random() * 10;
    if (roll > loc.richness_score) {
      return res.json({ discovered: false, message: 'Nothing found here... yet.' });
    }

    // Generate artifact
    const artifactData = generateArtifact(locationId, playerId, loc.richness_score);

    // Insert artifact
    const { data: artifact, error: artErr } = await supabase
      .from('artifacts')
      .insert(artifactData)
      .select()
      .single();
    if (artErr) throw artErr;

    // Log discovery
    await supabase.from('discoveries').insert({
      player_id: playerId,
      artifact_id: artifact.id,
    });

    res.json({ discovered: true, artifact, location: loc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artifacts – fetch all artifacts with full info (logbook)
router.get('/', async (req, res) => {
  const { player, type, material, sort } = req.query;
  try {
    let query = supabase.from('artifact_full').select('*');

    if (player)   query = query.eq('discovered_by', player);
    if (type)     query = query.eq('classified_type', type);
    if (material) query = query.eq('material', material);

    const sortField = sort === 'age' ? 'estimated_age' : sort === 'confidence' ? 'confidence_level' : 'discovered_at';
    query = query.order(sortField, { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json({ artifacts: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artifacts/:id – single artifact
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('artifact_full')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json({ artifact: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artifacts/:id/analyze – analyze an artifact
router.post('/:id/analyze', async (req, res) => {
  const { id } = req.params;
  try {
    // Get artifact raw data
    const { data: artifact, error: artErr } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single();
    if (artErr) throw artErr;

    const { guessedType, confidence, civilization, theory } = analyzeArtifact(artifact);

    // Upsert classification
    const { data: classification, error: classErr } = await supabase
      .from('classifications')
      .upsert({
        artifact_id: parseInt(id),
        type: guessedType,
        civilization,
        confidence_level: confidence,
        analyzed_at: new Date().toISOString(),
      }, { onConflict: 'artifact_id' })
      .select()
      .single();
    if (classErr) throw classErr;

    // Insert hypothesis
    const { data: hypothesis, error: hypErr } = await supabase
      .from('hypotheses')
      .insert({
        artifact_id: parseInt(id),
        theory_text: theory,
        status: confidence > 80 ? 'confirmed' : confidence > 50 ? 'pending' : 'rejected',
      })
      .select()
      .single();
    if (hypErr) throw hypErr;

    // Check pattern: 3+ artifacts same material + civilization → trigger pattern
    const { data: patterns } = await supabase
      .from('civilization_patterns')
      .select('*')
      .eq('civilization', civilization)
      .eq('material', artifact.material);

    const patternFound = patterns && patterns.length > 0 && patterns[0].artifact_count >= 3;

    res.json({ classification, hypothesis, patternFound, patternData: patterns?.[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
