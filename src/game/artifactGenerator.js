// src/game/artifactGenerator.js
// Generates randomized artifact data for discovered spots

const MATERIALS = ['obsidian', 'bronze', 'clay', 'bone', 'sandstone', 'gold', 'ivory', 'copper'];
const CONDITIONS = ['pristine', 'good', 'damaged', 'fragment'];
const HIDDEN_TYPES = ['tool', 'ritual', 'weapon', 'ornament', 'unknown'];
const CIVILIZATIONS = ['Solari', 'Dune Wraiths', 'The Unnamed', 'Ashkelan', 'unknown'];

// Weighted random pick
function pick(arr, weights) {
  if (!weights) return arr[Math.floor(Math.random() * arr.length)];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function generateCodeName() {
  const prefix = ['OBJ', 'REL', 'ART', 'FRG', 'SHD'];
  const p = prefix[Math.floor(Math.random() * prefix.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  const alpha = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${p}-${alpha}${num}`;
}

function generateArtifact(locationId, playerId, richness) {
  // Higher richness → better condition, older items
  const conditionWeights = richness > 7
    ? [30, 40, 20, 10]   // pristine more likely at rich sites
    : [10, 25, 35, 30];  // fragments more likely at barren sites

  const ageBase = richness * 500;
  const ageVariance = Math.floor(Math.random() * 2000);

  return {
    code_name: generateCodeName(),
    material: pick(MATERIALS),
    estimated_age: ageBase + ageVariance,
    condition: pick(CONDITIONS, conditionWeights),
    location_id: locationId,
    discovered_by: playerId,
    hidden_type: pick(HIDDEN_TYPES),
  };
}

// When analyzing, simulate "accuracy" – player might mis-classify
function analyzeArtifact(artifact) {
  const correct = Math.random() < 0.65; // 65% chance of correct classification
  const actualType = artifact.hidden_type;
  const guessedType = correct
    ? actualType
    : pick(HIDDEN_TYPES.filter(t => t !== actualType));

  const confidence = correct
    ? Math.floor(Math.random() * 30) + 65  // 65–95
    : Math.floor(Math.random() * 40) + 20; // 20–60

  // Civilization inference based on material patterns (simple heuristic)
  const civMap = {
    obsidian: 'Solari',
    gold: 'Solari',
    bone: 'Dune Wraiths',
    ivory: 'Dune Wraiths',
    bronze: 'Ashkelan',
    copper: 'Ashkelan',
    clay: 'The Unnamed',
    sandstone: 'unknown',
  };

  const civilization = confidence > 70
    ? (civMap[artifact.material] || 'unknown')
    : 'unknown';

  const theory = generateTheory(guessedType, artifact.material, civilization);

  return { guessedType, confidence, civilization, theory };
}

function generateTheory(type, material, civ) {
  const theories = {
    tool: `This ${material} implement shows signs of functional use. Likely part of daily life${civ !== 'unknown' ? ` in the ${civ} culture` : ''}.`,
    ritual: `The ${material} composition and markings suggest ceremonial significance${civ !== 'unknown' ? ` tied to ${civ} spiritual practices` : ''}.`,
    weapon: `Edge geometry and ${material} density indicate this was a combat instrument${civ !== 'unknown' ? ` used by ${civ} warriors` : ''}.`,
    ornament: `Decorative finishing on this ${material} piece implies status or adornment${civ !== 'unknown' ? ` within the ${civ} hierarchy` : ''}.`,
    unknown: `Classification inconclusive. The ${material} artifact defies known typology. Further study required.`,
  };
  return theories[type] || theories.unknown;
}

module.exports = { generateArtifact, analyzeArtifact };
