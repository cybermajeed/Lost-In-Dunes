// src/routes/players.js
const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/players/:name – get or create player
router.get('/:name', async (req, res) => {
  const { name } = req.params;
  try {
    let { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('name', name)
      .single();

    if (error && error.code === 'PGRST116') {
      // Player not found – create
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert({ name })
        .select()
        .single();
      if (createError) throw createError;
      return res.json({ player: newPlayer, created: true });
    }
    if (error) throw error;
    res.json({ player: data, created: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/players/:id/experience – add XP, level up
router.post('/:id/experience', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    const newXP = player.experience + amount;
    const newLevel = Math.floor(newXP / 500) + 1; // level up every 500 XP

    const { data: updated, error: upErr } = await supabase
      .from('players')
      .update({ experience: newXP, level: newLevel })
      .eq('id', id)
      .select()
      .single();
    if (upErr) throw upErr;

    res.json({ player: updated, leveledUp: newLevel > player.level });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
