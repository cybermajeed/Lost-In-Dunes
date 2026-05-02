# 🏜️ Archaeology Simulator — Unknown Civilizations

> This project was developed as part of a DBMS (Database Management Systems) application, demonstrating the design and integration of relational databases within an interactive system.

> It is a full-stack 2D archaeology exploration game where players discover artifacts from unknown civilizations. The application uses Supabase to manage relational data including players, locations, artifacts, classifications, and hypotheses, showcasing concepts like joins, constraints, and pattern analysis through SQL views.

> Built with a custom canvas-based game engine and a Node.js backend, the system combines procedural world generation with database-driven discovery and analysis. Players explore desert environments, uncover relics, classify findings, and identify hidden civilization patterns, all while progressing through an experience-based system.

---

## 📁 File Structure

```
archaeology-simulator/
│
├── public/                          # Frontend — served statically by Express
│   ├── index.html                   # Single-page app shell (login + game screens, all modals)
│   │
│   ├── css/
│   │   └── style.css                # Desert-themed UI: amber, parchment, ruin tones
│   │
│   ├── js/
│   │   ├── api.js                   # Fetch wrapper — all calls to the backend REST API
│   │   ├── sprites.js               # Pixel-art sprite engine (all drawn on canvas, no image files)
│   │   ├── game.js                  # Core game engine: map, camera, player, monsters, sound
│   │   ├── ui.js                    # Modal system: artifact viewer, logbook, patterns panel, toasts
│   │   └── main.js                  # App bootstrap: login flow → game init → discovery callback
│   │
│   └── sounds/                      # Audio assets (provide your own .mp3 files)
│       ├── desert_wind.mp3          # Ambient loop — plays on map load
│       ├── sand_step.mp3            # Footstep — plays each time player moves
│       ├── discover.mp3             # Chime — plays when an artifact is found
│       ├── claw_attack.mp3          # Monster hit — plays when enemy damages player
│       └── hammer_attack.mp3        # Player swing — plays on SPACE press
│
├── src/                             # Backend — Node.js / Express
│   ├── server.js                    # Entry point: Express app, static serving, route mounting
│   │
│   ├── db/
│   │   └── supabase.js              # Supabase JS client (reads from .env)
│   │
│   ├── routes/
│   │   ├── players.js               # GET /api/players/:name, POST experience
│   │   ├── artifacts.js             # POST discover, GET list, GET single, POST analyze
│   │   └── locations.js             # GET all locations, GET civilization patterns view
│   │
│   └── game/
│       └── artifactGenerator.js     # Procedural artifact generation + analysis simulation
│
├── sql/
│   └── schema.sql                   # Tables, foreign keys, seed data, SQL views
│
├── .env.example                     # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Setup — Step by Step

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is sufficient)
2. Create a new project and wait for it to provision (~1 min)
3. Go to **SQL Editor** in the left sidebar
4. Paste the entire contents of `sql/schema.sql` and click **Run**
5. This creates all 6 tables, seeds 7 dig-site locations, and builds 2 SQL views

### Step 2 — Get Your API Credentials

From your Supabase project dashboard → **Settings → API**:

- Copy your **Project URL** (e.g. `https://xxxx.supabase.co`)
- Copy your **anon / public** key

### Step 3 — Configure Environment

##### Edit `.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
PORT=3000
```

### Step 4 — Install & Run

```bash
npm install
npm start
```

For development with auto-reload:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🎮 Controls

| Key       | Action                                |
| --------- | ------------------------------------- |
| `W` / `↑` | Move up                               |
| `S` / `↓` | Move down                             |
| `A` / `←` | Move left                             |
| `D` / `→` | Move right                            |
| `SPACE`   | Attack in the direction you're facing |

---

## 🔄 Gameplay Loop

```
Explore map → walk onto ◈ marker → artifact discovered (inserted to DB)
→ open artifact modal → click Analyze → classification written to DB
→ open Logbook → filter/sort all artifacts from DB
→ open Patterns → view civilization clusters via SQL GROUP BY view
```

Fight monsters along the way for XP and HP recovery.

---

## 🏜️ World & Terrain

The map is **60 × 44 tiles** (2,640 tiles total), generated deterministically with a fixed seed (`42`) so the layout is the same every session. Change `seed = 42` in `game.js` to get a different world.

| Terrain        | Walkable | Description                                      |
| -------------- | -------- | ------------------------------------------------ |
| Desert Sand    | ✅       | Base terrain; sand ripple and grain texture      |
| Ancient Ruins  | ✅       | Stone blocks with cracks and carved lines        |
| Sand Dune      | ✅       | Elevated ridges with highlight shading           |
| Old Path       | ✅       | Worn tracks between areas                        |
| Tomb           | ✅       | Dark tiles with Eye of Ra carvings               |
| Rock Face      | ❌       | Impassable cliff/boulder clusters                |
| Water          | ❌       | Animated shimmer; blocks movement                |
| Oasis (centre) | ✅       | Central oasis tile; surrounding water is blocked |
| Cave           | ✅       | Dark entrance with warm interior torch glow      |

### Environment Objects

| Object           | Terrain                 | Count | Notes                                           |
| ---------------- | ----------------------- | ----- | ----------------------------------------------- |
| Cactus           | Sand, Dune              | 50    | Static decoration                               |
| Bones / Skull    | Sand, Ruins, Tomb       | 30    | Pixel-art skull with ribcage                    |
| Palm Tree        | Sand, Oasis             | 15    | Tall sprite drawn above tile layer              |
| Ruin Pillar      | Ruins                   | 25    | Broken column with rubble pieces                |
| Ancient Pot      | Ruins, Tomb, Cave       | 20    | Hieroglyph markings, crack detail               |
| Altar            | Tomb, Ruins             | 8     | Glowing red gem; radial pulse light each frame  |
| Scorpion Nest    | Sand, Dune              | 12    | Visual marker near enemy spawn zones            |
| Desert Fox       | Sand                    | 6     | Wanders slowly; changes tile every ~180 frames  |
| Torch            | Ruins, Tomb, Cave, Path | 20    | Warm flickering light radius rendered per frame |
| Sand Dune Sprite | Dune, Sand              | 18    | Layered dune shape overlay                      |

---

## 👾 Sprites

All sprites are generated at startup by `sprites.js` using the Canvas 2D API. No external image files are required.

### Player — Archaeologist

- **4 walk directions**: down (0), left (1), right (2), up (3)
- **4 animation frames** per direction — leg swing, body bob, arm counter-swing
- Design: wide explorer hat, teal shirt, khaki shorts, brown boots, ponytail, trowel in hand
- Backpack visible when facing away (direction 3)
- HP bar renders above sprite when below max HP
- Flashes during invincibility frames (every 4 game ticks)

### Scorpion Monster

- 3-frame walk animation
- Animated claw open/close on frame 0, segmented tail curving upward, glowing red eyes
- Spawns across walkable terrain
- **HP: 3 | Damage: 15**

### Sand Wraith Monster

- 4-frame float cycle — body bobs, robe bottom waves, arm tendrils curve
- Glowing yellow eyes with occasional flicker
- Purple radial glow aura rendered each frame
- Spawns in Tomb and Ruin zones only
- **HP: 5 | Damage: 25**

---

## ❤️ Combat & Health

| Mechanic              | Detail                                                                          |
| --------------------- | ------------------------------------------------------------------------------- |
| Player HP             | 100/100; shown as colour-coded bar in HUD and above sprite when damaged         |
| Attack                | `SPACE` — hits the tile directly ahead based on facing direction                |
| Scorpion hits to kill | 3                                                                               |
| Wraith hits to kill   | 5                                                                               |
| Invincibility frames  | 60 frames after taking damage (sprite flashes)                                  |
| Kill reward           | +50 XP written to Supabase +**+15 HP healed**                                   |
| Passive regen         | +1 HP every 120 game frames (~2 seconds at 60fps)                               |
| Walking into monster  | Does**not** auto-attack — press SPACE while adjacent and facing it              |
| Monster aggro range   | 7 tiles; chases player until out of range                                       |
| Death                 | Respawn at tile (4,4) after 1.8 seconds with full HP + 120 invincibility frames |
| Aggro indicator       | Red `!` drawn above monster when actively chasing                               |

---

## 🔊 Sound System

The `Sound` object is defined at the top of `game.js` and is globally available. `main.js` also calls it directly via `Sound.play("discover")`.

```js
const Sound = {
  claw_attack:  { src: "../sounds/claw_attack.mp3",  last: 0 },
  desert_wind:  { src: "../sounds/desert_wind.mp3",  last: 0, loop: true },
  discover:     { src: "../sounds/discover.mp3",     last: 0 },
  hammer_attack:{ src: "../sounds/hammer_attack.mp3",last: 0 },
  sand_step:    { src: "../sounds/sand_step.mp3",    last: 0 },
  play(name) { ... }
};
```

Key behaviours:

- **80ms spam guard** — each sound tracks its last play time; calls within 80ms are ignored
- **Pitch randomisation** — `playbackRate` is set to `0.9 + Math.random() * 0.2` each call, so repeated sounds feel natural
- **Fresh Audio instance** — creates a new `Audio` object each time to avoid stuttering from restarting a playing track
- **Silent on error** — `.play()` rejections are caught and only logged; missing files never crash the game

| Triggered in                     | Sound           | Call site                         |
| -------------------------------- | --------------- | --------------------------------- |
| `generateMap()` in `game.js`     | `desert_wind`   | End of map generation             |
| `handleInput()` in `game.js`     | `sand_step`     | Every movement key press          |
| `playerAttack()` in `game.js`    | `hammer_attack` | Every SPACE press                 |
| Monster AI in `game.js`          | `claw_attack`   | When monster attacks player       |
| `handleDiscovery()` in `main.js` | `discover`      | After artifact is confirmed found |

---

## 🗄️ Database Design

### Tables

#### `players`

| Column     | Type        | Notes                                      |
| ---------- | ----------- | ------------------------------------------ |
| id         | SERIAL PK   |                                            |
| name       | TEXT UNIQUE | Used as login identifier                   |
| level      | INTEGER     | Default 1; recalculated on every XP update |
| experience | INTEGER     | Total accumulated XP                       |
| created_at | TIMESTAMPTZ |                                            |

Level formula: `floor(experience / 500) + 1`

#### `locations`

| Column           | Type      | Notes                                                     |
| ---------------- | --------- | --------------------------------------------------------- |
| id               | SERIAL PK |                                                           |
| name             | TEXT      | e.g. "The Silent Tombs"                                   |
| terrain_type     | TEXT      | desert / ruins / oasis / canyon / burial_site             |
| richness_score   | INTEGER   | 1–10; controls discovery probability and artifact quality |
| x_coord, y_coord | INTEGER   | Used to position ◈ markers on the game map                |

#### `artifacts`

| Column        | Type           | Notes                                                               |
| ------------- | -------------- | ------------------------------------------------------------------- |
| id            | SERIAL PK      |                                                                     |
| code_name     | TEXT UNIQUE    | Auto-generated, e.g.`OBJ-A247`                                      |
| material      | TEXT           | obsidian / bronze / clay / bone / sandstone / gold / ivory / copper |
| estimated_age | INTEGER        | Years BP; scales with richness                                      |
| condition     | TEXT           | pristine / good / damaged / fragment                                |
| location_id   | FK → locations |                                                                     |
| discovered_by | FK → players   |                                                                     |
| hidden_type   | TEXT           | True classification; only exposed after analysis                    |
| created_at    | TIMESTAMPTZ    |                                                                     |

#### `discoveries`

| Column      | Type                           | Notes                          |
| ----------- | ------------------------------ | ------------------------------ |
| id          | SERIAL PK                      |                                |
| player_id   | FK → players                   |                                |
| artifact_id | FK → artifacts                 |                                |
| timestamp   | TIMESTAMPTZ                    |                                |
| —           | UNIQUE(player_id, artifact_id) | Prevents duplicate log entries |

#### `classifications`

| Column           | Type                  | Notes                                       |
| ---------------- | --------------------- | ------------------------------------------- |
| id               | SERIAL PK             |                                             |
| artifact_id      | FK UNIQUE → artifacts | One classification per artifact (upsert)    |
| type             | TEXT                  | tool / ritual / weapon / ornament / unknown |
| civilization     | TEXT                  | Inferred; see table below                   |
| confidence_level | INTEGER               | 0–100                                       |
| analyzed_at      | TIMESTAMPTZ           |                                             |

#### `hypotheses`

| Column      | Type           | Notes                                                 |
| ----------- | -------------- | ----------------------------------------------------- |
| id          | SERIAL PK      |                                                       |
| artifact_id | FK → artifacts |                                                       |
| theory_text | TEXT           | Narrative string generated by backend logic           |
| status      | TEXT           | confirmed (>80%) / pending (50–80%) / rejected (<50%) |
| created_at  | TIMESTAMPTZ    |                                                       |

### SQL Views

**`artifact_full`** — JOIN across `artifacts`, `locations`, `players`, `classifications`. Used by the Logbook to fetch complete records in a single query with filtering and sorting.

**`civilization_patterns`** — `GROUP BY civilization, material` over `classifications` joined to `artifacts`. Only returns rows where `COUNT(*) >= 2`, indicating a cultural pattern. Used by the Patterns panel.

---

## 📡 API Reference

### Players

| Method | Path                          | Body         | Response                      |
| ------ | ----------------------------- | ------------ | ----------------------------- |
| GET    | `/api/players/:name`          | —            | `{ player, created: bool }`   |
| POST   | `/api/players/:id/experience` | `{ amount }` | `{ player, leveledUp: bool }` |

### Artifacts

| Method | Path                         | Query / Body               | Response                                                     |
| ------ | ---------------------------- | -------------------------- | ------------------------------------------------------------ |
| POST   | `/api/artifacts/discover`    | `{ playerId, locationId }` | `{ discovered: bool, artifact?, location?, message? }`       |
| GET    | `/api/artifacts`             | `?material=&type=&sort=`   | `{ artifacts[] }` via `artifact_full` view                   |
| GET    | `/api/artifacts/:id`         | —                          | `{ artifact }`                                               |
| POST   | `/api/artifacts/:id/analyze` | —                          | `{ classification, hypothesis, patternFound, patternData? }` |

### Locations

| Method | Path                      | Response                                           |
| ------ | ------------------------- | -------------------------------------------------- |
| GET    | `/api/locations`          | `{ locations[] }` sorted by richness desc          |
| GET    | `/api/locations/patterns` | `{ patterns[] }` from `civilization_patterns` view |

---

## 🧠 Simulation Logic

### Artifact Generation (`artifactGenerator.js`)

- Material picked from 8 options (uniform random)
- **Condition** is weighted by richness: high-richness sites favour `pristine` / `good`; low-richness sites favour `damaged` / `fragment`
- **Age** = `richness × 500 + random(0–2000)` years
- **`hidden_type`** is stored in the DB but never returned to the client until after analysis

### Analysis

- **65% accuracy** — correct type classification
- Correct guess: confidence 65–95%; wrong guess: 20–60%
- Civilization is inferred from material if confidence > 70%
- Hypothesis status derived from confidence threshold

### Civilization → Material Map

| Civilization | Materials                               |
| ------------ | --------------------------------------- |
| Solari       | Obsidian, Gold                          |
| Dune Wraiths | Bone, Ivory                             |
| Ashkelan     | Bronze, Copper                          |
| The Unnamed  | Clay                                    |
| unknown      | Sandstone, or any low-confidence result |

---

## 📖 UI Panels

### Logbook (📖)

- Queries `artifact_full` view with optional `material`, `type`, `sort` parameters
- Colour-coded type badges (tool = green, ritual = purple, weapon = red, ornament = gold)
- Click **View** on any row → opens artifact modal
- Unanalyzed artifacts show an "unanalyzed" badge

### Artifact Modal

- Shows raw DB fields: code, location, material, age, condition, status
- If analyzed: displays type, civilization, confidence %, theory text
- **Analyze** button disabled once already classified
- Shows **⚡ Civilization Pattern Detected!** alert if the Patterns view returns a cluster for this artifact's material + civilization

### Patterns Panel (🔍)

- Queries `civilization_patterns` SQL view
- Cards show: civilization, material, artifact count, average confidence, oldest and youngest artifact age

---

## 🏆 XP & Levelling

| Action                  | XP                                 |
| ----------------------- | ---------------------------------- |
| Discovering an artifact | `30 + (richness × 5)`              |
| Analyzing an artifact   | `20 + floor(confidence / 10) × 10` |
| Defeating a monster     | `50`                               |

- Level up every **500 XP** (`floor(XP / 500) + 1`)
- XP bar in HUD fills within current level bracket
- Persisted to Supabase `players` table on every award

---

## ⚠️ Behaviour Notes

- **Moving into a monster tile** does not attack — press SPACE while facing and adjacent to the monster instead
- **Sound files are optional** — errors are caught silently; provide your own `.mp3` files in `public/sounds/`
- **Map is deterministic** — fixed seed `42` gives the same layout every time; change it in `game.js` for variety
- **Discovery spots respawn** — 15 seconds after triggering, the marker reappears so a location can yield multiple artifacts
- **Fog of war radius** — 6 tiles; explored tiles persist at reduced opacity; unvisited tiles are fully black
- **Passive HP regen** — 1 HP per 120 game frames; this runs in the main `tick()` loop independently of combat

---
