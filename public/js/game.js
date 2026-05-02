// public/js/game.js — COMPLETE REWRITE
// Large scrolling desert world with camera, animated sprites, monsters, env details
const Sound = {
  claw_attack: { src: "/sounds/claw_attack.mp3", last: 0 },
  desert_wind: { src: "/sounds/desert_wind.mp3", last: 0, loop: true },
  discover: { src: "/sounds/discover.mp3", last: 0 },
  hammer_attack: { src: "/sounds/hammer_attack.mp3", last: 0 },
  sand_step: { src: "/sounds/sand_step.mp3", last: 0 },

  play(name) {
    const data = this[name];
    if (!data) return;

    const now = Date.now();
    //  prevent spam (tweak per sound if needed)
    if (now - data.last < 80) return;
    data.last = now;
    //  create fresh instance (no harsh restart)
    const sound = new Audio(data.src);
    //  slight randomness (makes it feel real)
    sound.playbackRate = 0.9 + Math.random() * 0.2;
    sound.loop = data.loop || false;
    sound.play().catch((e) => {
      console.error(e);
    });
  },
};

const Game = (() => {
  const TILE = 48;
  const MAP_COLS = 60;
  const MAP_ROWS = 44;
  const VIEW_COLS = 18;
  const VIEW_ROWS = 13;
  const VW = VIEW_COLS * TILE;
  const VH = VIEW_ROWS * TILE;
  const S = 48; // sprite size

  const T = {
    SAND: 0,
    RUIN: 1,
    WATER: 2,
    ROCK: 3,
    TOMB: 4,
    CAVE: 5,
    OASIS: 6,
    DUNE: 7,
    PATH: 8,
  };
  const WALKABLE = new Set([T.SAND, T.RUIN, T.PATH, T.TOMB, T.DUNE]);

  let canvas, ctx, sprites;
  let player = {
    x: 4,
    y: 4,
    dir: 0,
    frame: 0,
    moving: false,
    hp: 100,
    maxHp: 100,
    invincible: 0,
  };
  let camera = { x: 0, y: 0 };
  let keys = {};
  let map = [],
    envObjects = [],
    monsters = [],
    discoverySpots = [],
    particles = [];
  let onDiscovery = null;
  let lastMoveTime = 0,
    gameTime = 0,
    lastFrameTime = 0,
    running = false;
  let fogMap = [];

  // Seeded RNG for deterministic map
  let seed = 42;
  function srng() {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  }
  function si(min, max) {
    return Math.floor(srng() * (max - min + 1)) + min;
  }

  // ── Map generation ────────────────────────
  function generateMap(locations) {
    seed = 42;
    map = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      map[r] = new Array(MAP_COLS).fill(T.SAND);
    }

    // Rock clusters
    for (let i = 0; i < 20; i++) {
      const rx = si(2, MAP_COLS - 8),
        ry = si(2, MAP_ROWS - 8),
        rs = si(3, 9);
      for (let r = ry; r < ry + rs; r++)
        for (let c = rx; c < rx + rs + si(-2, 2); c++)
          if (ib(c, r)) map[r][c] = T.ROCK;
    }
    // Ruin zones
    for (let i = 0; i < 10; i++) {
      const rx = si(3, MAP_COLS - 10),
        ry = si(3, MAP_ROWS - 10),
        rs = si(5, 12);
      for (let r = ry; r < ry + rs; r++)
        for (let c = rx; c < rx + rs + si(-3, 3); c++)
          if (ib(c, r)) map[r][c] = T.RUIN;
    }
    // Tomb patches
    for (let i = 0; i < 7; i++) {
      const tx = si(4, MAP_COLS - 7),
        ty = si(4, MAP_ROWS - 7);
      for (let r = ty; r < ty + 5; r++)
        for (let c = tx; c < tx + 5; c++) if (ib(c, r)) map[r][c] = T.TOMB;
    }
    // Dune strips
    for (let i = 0; i < 14; i++) {
      const dx = si(0, MAP_COLS - 8),
        dy = si(0, MAP_ROWS - 3);
      for (let c = dx; c < dx + si(5, 12); c++)
        if (ib(c, dy)) map[dy][c] = T.DUNE;
    }
    // Oasis + water
    for (let i = 0; i < 6; i++) {
      const ox = si(5, MAP_COLS - 7),
        oy = si(5, MAP_ROWS - 7);
      map[oy][ox] = T.OASIS;
      [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
        [1, 1],
        [-1, 1],
      ].forEach(([dc, dr]) => {
        if (ib(ox + dc, oy + dr)) map[oy + dr][ox + dc] = T.WATER;
      });
    }
    // Cave entrances
    for (let i = 0; i < 5; i++) {
      const cx = si(4, MAP_COLS - 7),
        cy = si(4, MAP_ROWS - 7);
      map[cy][cx] = T.CAVE;
      if (ib(cx + 1, cy)) map[cy][cx + 1] = T.ROCK;
      if (ib(cx, cy + 1)) map[cy + 1][cx] = T.ROCK;
    }
    // Paths
    for (let i = 0; i < 8; i++) {
      let px = si(2, MAP_COLS - 3),
        py = si(2, MAP_ROWS - 3);
      for (let j = 0; j < si(10, 24); j++) {
        if (ib(px, py) && map[py][px] !== T.WATER && map[py][px] !== T.ROCK)
          map[py][px] = T.PATH;
        if (srng() > 0.5) px += srng() > 0.5 ? 1 : -1;
        else py += srng() > 0.5 ? 1 : -1;
        px = Math.max(1, Math.min(MAP_COLS - 2, px));
        py = Math.max(1, Math.min(MAP_ROWS - 2, py));
      }
    }
    // Border rocks
    for (let c = 0; c < MAP_COLS; c++) {
      map[0][c] = T.ROCK;
      map[MAP_ROWS - 1][c] = T.ROCK;
    }
    for (let r = 0; r < MAP_ROWS; r++) {
      map[r][0] = T.ROCK;
      map[r][MAP_COLS - 1] = T.ROCK;
    }
    map[4][4] = T.SAND;

    // ── Environment objects ──
    envObjects = [];
    seed = 77;
    const placeEnv = (type, count, validTiles, offsetY = 0) => {
      for (let i = 0; i < count; i++) {
        const ex = si(1, MAP_COLS - 3),
          ey = si(1, MAP_ROWS - 3);
        if (validTiles.includes(map[ey]?.[ex]))
          envObjects.push({ type, x: ex, y: ey + offsetY, wanderTimer: 0 });
      }
    };
    placeEnv("cactus", 50, [T.SAND, T.DUNE]);
    placeEnv("bones", 30, [T.SAND, T.RUIN, T.TOMB]);
    placeEnv("palmTree", 15, [T.SAND, T.OASIS], -0.5);
    placeEnv("ruinPillar", 25, [T.RUIN]);
    placeEnv("ancientPot", 20, [T.RUIN, T.TOMB, T.CAVE]);
    placeEnv("altar", 8, [T.TOMB, T.RUIN]);
    placeEnv("scorpionNest", 12, [T.SAND, T.DUNE]);
    placeEnv("desertFox", 6, [T.SAND]);
    placeEnv("torch", 20, [T.RUIN, T.TOMB, T.CAVE, T.PATH]);
    placeEnv("sandDune", 18, [T.DUNE, T.SAND]);

    // ── Discovery spots from DB ──
    discoverySpots = [];
    if (locations) {
      locations.forEach((loc) => {
        let sx = ((4 + loc.id * 7) % (MAP_COLS - 4)) + 2,
          sy = ((4 + loc.id * 11) % (MAP_ROWS - 4)) + 2;
        for (let t = 0; t < 20; t++) {
          if (WALKABLE.has(map[sy]?.[sx])) break;
          sx = ((sx + 3) % (MAP_COLS - 2)) + 1;
          sy = ((sy + 2) % (MAP_ROWS - 2)) + 1;
        }
        map[sy][sx] = T.RUIN;
        discoverySpots.push({
          x: sx,
          y: sy,
          locationId: loc.id,
          richness: loc.richness_score,
          name: loc.name,
          discovered: false,
        });
      });
    }

    // ── Monsters ──
    monsters = [];
    seed = 123;
    for (let i = 0; i < 22; i++) {
      const mx = si(3, MAP_COLS - 5),
        my = si(3, MAP_ROWS - 5);
      if (WALKABLE.has(map[my]?.[mx]))
        monsters.push({
          type: "scorpion",
          x: mx,
          y: my,
          frame: 0,
          dir: 0,
          hp: 3,
          maxHp: 3,
          aiTimer: 0,
          aiInterval: si(60, 120),
          spawnX: mx,
          spawnY: my,
          aggro: false,
          damage: 15,
        });
    }
    for (let i = 0; i < 10; i++) {
      const mx = si(3, MAP_COLS - 5),
        my = si(3, MAP_ROWS - 5);
      if (map[my]?.[mx] === T.TOMB || map[my]?.[mx] === T.RUIN)
        monsters.push({
          type: "wraith",
          x: mx,
          y: my,
          frame: 0,
          dir: 0,
          hp: 5,
          maxHp: 5,
          aiTimer: 0,
          aiInterval: si(30, 60),
          spawnX: mx,
          spawnY: my,
          aggro: false,
          damage: 25,
        });
    }
    Sound.play("desert_wind");
  }

  function ib(c, r) {
    return c >= 0 && c < MAP_COLS && r >= 0 && r < MAP_ROWS;
  }

  // ── Camera ──
  function updateCamera() {
    camera.x = Math.max(
      0,
      Math.min(MAP_COLS - VIEW_COLS, player.x - Math.floor(VIEW_COLS / 2)),
    );
    camera.y = Math.max(
      0,
      Math.min(MAP_ROWS - VIEW_ROWS, player.y - Math.floor(VIEW_ROWS / 2)),
    );
  }

  // ── Tile colors ──
  const TILE_COLORS = {
    [T.SAND]: [
      ["#d4a84a", "#c89830", "#dab850"],
      ["#c89030", "#d4a040", "#e0b855"],
    ],
    [T.RUIN]: [
      ["#7a6045", "#6a5035", "#8a704a"],
      ["#6a5535", "#7a6040"],
    ],
    [T.WATER]: [["#2a7aaa", "#1e6a98", "#3a8ab8"]],
    [T.ROCK]: [
      ["#4a3820", "#3a2810", "#5a4830"],
      ["#3a2814", "#2e2010"],
    ],
    [T.TOMB]: [
      ["#5a4030", "#4a3025", "#6a5035"],
      ["#4a3020", "#3a2018"],
    ],
    [T.CAVE]: [["#1a0e08", "#0e0806"]],
    [T.OASIS]: [["#3ab080", "#2a9060"]],
    [T.DUNE]: [
      ["#e8c060", "#d0a840", "#f0d070"],
      ["#d4ac48", "#e8c058"],
    ],
    [T.PATH]: [
      ["#b08040", "#a07030", "#c09050"],
      ["#a87838", "#907030"],
    ],
  };

  function drawTile(c, r, sx, sy) {
    const type = map[r]?.[c] ?? T.SAND;
    const pals = TILE_COLORS[type] || TILE_COLORS[T.SAND];
    const pal = pals[(c + r) % pals.length];
    ctx.fillStyle = pal[((c * 7 + r * 13) % 3) % pal.length];
    ctx.fillRect(sx, sy, TILE, TILE);

    const sl = c * 31 + r * 17;
    if (type === T.SAND) {
      ctx.fillStyle = "rgba(255,220,100,0.1)";
      ctx.fillRect(sx + 4, sy + (sl % 10) + 8, 14 + (sl % 8), 2);
      ctx.fillRect(sx + 22, sy + (sl % 8) + 22, 10 + (sl % 6), 1);
      ctx.fillStyle = "rgba(200,160,50,0.08)";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(
          sx + ((sl * (i + 1)) % (TILE - 4)),
          sy + ((sl * (i + 3)) % (TILE - 4)),
          3,
          3,
        );
    } else if (type === T.RUIN) {
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 2, sy + 2, TILE - 4, TILE / 2 - 2);
      ctx.strokeRect(sx + 2, sy + TILE / 2, TILE - 4, TILE / 2 - 2);
      if (sl % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(sx + 8, sy + 8);
        ctx.lineTo(sx + 16, sy + 24);
        ctx.lineTo(sx + 14, sy + 36);
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.stroke();
      }
    } else if (type === T.WATER) {
      const wave = Math.sin(gameTime * 0.035 + c * 0.9 + r * 0.5) * 0.1;
      ctx.fillStyle = `rgba(100,200,255,${0.1 + wave})`;
      ctx.fillRect(sx, sy, TILE, TILE / 2);
      ctx.strokeStyle = "rgba(200,240,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + 8 + Math.sin(gameTime * 0.04 + c) * 4);
      ctx.lineTo(
        sx + TILE - 4,
        sy + 12 + Math.sin(gameTime * 0.04 + c + 1) * 3,
      );
      ctx.stroke();
    } else if (type === T.TOMB) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = "rgba(200,150,50,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx + TILE / 2, sy + TILE / 2, 9, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx + TILE / 2, sy + TILE / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,150,50,0.3)";
      ctx.fill();
    } else if (type === T.DUNE) {
      ctx.fillStyle = "rgba(255,230,90,0.22)";
      ctx.fillRect(sx, sy, TILE, 5);
      ctx.fillStyle = "rgba(160,100,20,0.15)";
      ctx.fillRect(sx, sy + TILE - 6, TILE, 6);
    } else if (type === T.PATH) {
      ctx.fillStyle = "rgba(160,110,40,0.18)";
      ctx.fillRect(sx + 5, sy, TILE - 10, TILE);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let s = 0; s < 3; s++)
        ctx.fillRect(sx + 9 + s * 12, sy + 8 + (s % 2) * 16, 9, 7);
    } else if (type === T.CAVE) {
      // ctx.fillStyle = "rgba(255,120,0,0.06)";
      // ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(sx, sy, TILE, TILE);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx, sy, TILE, TILE);
    /////////////////////////////////////////////////////////
    if (!WALKABLE.has(type)) {
      // dark overlay for blocked tiles
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(sx, sy, TILE, TILE);

      // subtle border
      ctx.strokeStyle = "rgba(255,80,80,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    }
    /////////////////////////////////////////////////////////
  }

  // ── Env objects ──
  function drawEnvObjects() {
    const vis = envObjects
      .filter((o) => {
        const sx = o.x - camera.x,
          sy = o.y - camera.y;
        return (
          sx >= -2 && sx <= VIEW_COLS + 2 && sy >= -2 && sy <= VIEW_ROWS + 2
        );
      })
      .sort((a, b) => a.y - b.y);

    vis.forEach((o) => {
      const sx = (o.x - camera.x) * TILE,
        sy = (o.y - camera.y) * TILE;
      // Torch glow
      if (o.type === "torch") {
        const fl = 0.28 + Math.sin(gameTime * 0.14 + o.x * 1.3) * 0.1;
        const g = ctx.createRadialGradient(
          sx + TILE / 2,
          sy + 20,
          2,
          sx + TILE / 2,
          sy + 20,
          60,
        );
        g.addColorStop(0, `rgba(255,150,0,${fl})`);
        g.addColorStop(1, "rgba(255,80,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 32, sy - 32, 96, 96);
      }
      if (o.type === "altar") {
        const p2 = 0.18 + Math.sin(gameTime * 0.05) * 0.08;
        const g = ctx.createRadialGradient(
          sx + TILE,
          sy + TILE / 2,
          2,
          sx + TILE,
          sy + TILE / 2,
          36,
        );
        g.addColorStop(0, `rgba(255,70,0,${p2})`);
        g.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 10, sy - 10, 84, 64);
      }
      const spr = sprites[o.type];
      if (!spr) return;
      // Fox wanders
      if (o.type === "desertFox") {
        o.wanderTimer = (o.wanderTimer || 0) + 1;
        if (o.wanderTimer > 180) {
          o.wanderTimer = 0;
          const nx = o.x + (Math.random() > 0.5 ? 1 : -1),
            ny = o.y + (Math.random() > 0.5 ? 1 : -1);
          if (ib(nx, ny) && WALKABLE.has(map[ny]?.[nx])) {
            o.x = nx;
            o.y = ny;
          }
        }
      }
      ctx.drawImage(spr, sx, sy - (spr.height - TILE));
    });
  }

  // ── Player draw ──
  function drawPlayer() {
    const sx = (player.x - camera.x) * TILE,
      sy = (player.y - camera.y) * TILE;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 4, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (player.invincible > 0 && Math.floor(gameTime / 4) % 2 === 0) return;
    const sheet = sprites.player;
    if (sheet)
      ctx.drawImage(
        sheet,
        player.frame * S,
        player.dir * S,
        S,
        S,
        sx,
        sy - 8,
        S,
        S,
      );
    if (player.hp < player.maxHp) {
      const pct = player.hp / player.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(sx + 4, sy - 14, TILE - 8, 6);
      ctx.fillStyle =
        pct > 0.5 ? "#4aaa4a" : pct > 0.25 ? "#aaaa4a" : "#aa4a4a";
      ctx.fillRect(sx + 4, sy - 14, (TILE - 8) * pct, 6);
    }
  }

  // ── Monsters draw ──
  function drawMonsters() {
    monsters.forEach((m) => {
      if (m.hp <= 0) return;
      const sx = (m.x - camera.x) * TILE,
        sy = (m.y - camera.y) * TILE;
      if (sx < -TILE || sx > VW + TILE || sy < -TILE || sy > VH + TILE) return;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(sx + TILE / 2, sy + TILE - 2, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (m.type === "wraith") {
        const g = ctx.createRadialGradient(
          sx + 24,
          sy + 24,
          2,
          sx + 24,
          sy + 24,
          30,
        );
        g.addColorStop(0, "rgba(150,80,255,0.22)");
        g.addColorStop(1, "rgba(100,50,200,0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 12, sy - 12, S + 24, S + 24);
      }
      const sheet = sprites[m.type];
      if (sheet) ctx.drawImage(sheet, m.frame * S, 0, S, S, sx, sy - 8, S, S);
      if (m.hp < m.maxHp) {
        const pct = m.hp / m.maxHp;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(sx + 4, sy - 16, TILE - 8, 5);
        ctx.fillStyle = "#cc3333";
        ctx.fillRect(sx + 4, sy - 16, (TILE - 8) * pct, 5);
      }
      if (m.aggro) {
        ctx.fillStyle = "rgba(255,50,0,0.85)";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", sx + TILE / 2, sy - 22);
      }
    });
  }

  // ── Discovery spots draw ──
  function drawDiscoverySpots() {
    discoverySpots.forEach((spot) => {
      if (spot.discovered) return;
      const sx = (spot.x - camera.x) * TILE,
        sy = (spot.y - camera.y) * TILE;
      if (sx < -TILE || sx > VW + TILE || sy < -TILE || sy > VH + TILE) return;
      const pulse = 0.55 + Math.sin(gameTime * 0.07 + spot.locationId) * 0.3;
      const g = ctx.createRadialGradient(
        sx + TILE / 2,
        sy + TILE / 2,
        2,
        sx + TILE / 2,
        sy + TILE / 2,
        30,
      );
      g.addColorStop(0, `rgba(255,210,50,${pulse})`);
      g.addColorStop(1, "rgba(255,150,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(sx - 10, sy - 10, TILE + 20, TILE + 20);
      ctx.save();
      ctx.translate(sx + TILE / 2, sy + TILE / 2);
      ctx.rotate(Math.PI / 4 + gameTime * 0.02);
      ctx.fillStyle = `rgba(255,210,50,${0.8 + pulse * 0.2})`;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = "#fffbe0";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
      ctx.fillStyle = "rgba(255,225,90,0.95)";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        spot.name.split(" ").slice(0, 2).join(" "),
        sx + TILE / 2,
        sy - 8,
      );
    });
  }

  // ── Particles ──
  function updateParticles() {
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life--;
      p.alpha = p.life / p.maxLife;
    });
  }
  function drawParticles() {
    particles.forEach((p) => {
      const sx = (p.x - camera.x) * TILE,
        sy = (p.y - camera.y) * TILE;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(sx, sy, p.size, p.size);
      ctx.restore();
    });
  }
  function spawnParticles(wx, wy, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      particles.push({
        x: wx,
        y: wy,
        vx: Math.cos(a) * 0.07,
        vy: Math.sin(a) * 0.07 - 0.12,
        color,
        size: 3 + Math.random() * 5,
        life: 25 + Math.random() * 20,
        maxLife: 45,
        alpha: 1,
      });
    }
  }

  // ── Fog of war ──
  /*
  function initFog() {
    fogMap = [];
    for (let r = 0; r < MAP_ROWS; r++) fogMap[r] = new Array(MAP_COLS).fill(0);
  }
  function updateFog() {
    const rad = 6;
    for (let r = -rad; r <= rad; r++)
      for (let c = -rad; c <= rad; c++) {
        const d = Math.sqrt(r * r + c * c);
        if (d <= rad && ib(player.x + c, player.y + r))
          fogMap[player.y + r][player.x + c] = d <= rad - 1 ? 2 : 1;
      }
  }
  function drawFog() {
    for (let r = 0; r <= VIEW_ROWS; r++)
      for (let c = 0; c <= VIEW_COLS; c++) {
        const mr = r + camera.y,
          mc = c + camera.x;
        if (!ib(mc, mr)) continue;
        const f = fogMap[mr]?.[mc] ?? 0;
        if (f === 0) {
          ctx.fillStyle = "rgba(0,0,0,0.96)";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        } else if (f === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.42)";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
      }
  }
*/
  function initFog() {}
  function drawFog() {}
  function updateFog() {}

  // ── Minimap ──
  function drawMinimap() {
    const mw = 120,
      mh = 88,
      mx = VW - mw - 10,
      my = 10;
    const tw = mw / MAP_COLS,
      th = mh / MAP_ROWS;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
    ctx.strokeStyle = "rgba(196,160,82,0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 2, my - 2, mw + 4, mh + 4);
    const MC = {
      [T.SAND]: "#c8903a",
      [T.RUIN]: "#6a5035",
      [T.WATER]: "#2a6a9a",
      [T.ROCK]: "#3a2810",
      [T.TOMB]: "#4a3025",
      [T.CAVE]: "#1a0e08",
      [T.OASIS]: "#3aa870",
      [T.DUNE]: "#d4a840",
      [T.PATH]: "#a87838",
    };
    for (let r = 0; r < MAP_ROWS; r++)
      for (let c = 0; c < MAP_COLS; c++) {
        ctx.fillStyle = MC[map[r]?.[c]] || "#c8903a";
        ctx.fillRect(mx + c * tw, my + r * th, tw + 0.5, th + 0.5);
      }
    discoverySpots.forEach((s) => {
      if (s.discovered) return;
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(mx + s.x * tw - 1, my + s.y * th - 1, 3, 3);
    });
    monsters
      .filter((m) => m.hp > 0 && m.aggro)
      .forEach((m) => {
        ctx.fillStyle = "#ff3300";
        ctx.fillRect(mx + m.x * tw - 1, my + m.y * th - 1, 3, 3);
      });
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(
      mx + camera.x * tw,
      my + camera.y * th,
      VIEW_COLS * tw,
      VIEW_ROWS * th,
    );
    ctx.fillStyle = "#00ff88";
    ctx.fillRect(mx + player.x * tw - 2, my + player.y * th - 2, 4, 4);
    ctx.fillStyle = "rgba(200,180,100,0.8)";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("MAP", mx, my - 4);
  }

  // ── Compass ──
  function drawCompass() {
    const cx2 = 36,
      cy2 = 36;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(cx2, cy2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(196,160,82,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ff5555";
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 - 18);
    ctx.lineTo(cx2 - 5, cy2);
    ctx.lineTo(cx2 + 5, cy2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 + 18);
    ctx.lineTo(cx2 - 5, cy2);
    ctx.lineTo(cx2 + 5, cy2);
    ctx.fill();
    ctx.fillStyle = "#e8c97e";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", cx2, cy2 - 21);
  }

  // ── Monster AI ──
  function updateMonsters() {
    monsters.forEach((m) => {
      if (m.hp <= 0) return;
      m.aiTimer++;
      if (gameTime % 14 === 0)
        m.frame = (m.frame + 1) % (m.type === "scorpion" ? 3 : 4);
      const dx = player.x - m.x,
        dy = player.y - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.aggro = dist < 7;
      if (m.aiTimer < m.aiInterval) return;
      m.aiTimer = 0;
      m.aiInterval = m.aggro ? 18 : 90;
      if (m.aggro) {
        if (dist < 1.5) {
          Sound.play("claw_attack");
          if (player.invincible <= 0) {
            player.hp = Math.max(0, player.hp - m.damage);
            player.invincible = 60;
            spawnParticles(player.x + 0.5, player.y + 0.5, "#ff3333", 10);
            updateHPDisplay();
            if (window.UI)
              UI.toast(
                "💀 Hit!",
                `${m.type === "scorpion" ? "Scorpion stung" : "Wraith struck"} you for ${m.damage} damage!`,
              );
            if (player.hp <= 0) handlePlayerDeath();
          }
          return;
        }
        const nx = m.x + Math.sign(dx),
          ny = m.y + Math.sign(dy);
        const canMove =
          ib(nx, ny) &&
          WALKABLE.has(map[ny]?.[nx]) &&
          !monsters.some(
            (o) => o !== m && o.hp > 0 && o.x === nx && o.y === ny,
          );
        if (canMove) {
          m.x = nx;
          m.y = ny;
        } else {
          const ax = m.x + Math.sign(dx);
          if (ib(ax, m.y) && WALKABLE.has(map[m.y]?.[ax])) {
            m.x = ax;
          } else {
            const ay = m.y + Math.sign(dy);
            if (ib(m.x, ay) && WALKABLE.has(map[ay]?.[m.x])) m.y = ay;
          }
        }
      } else {
        const wdx = Math.floor(Math.random() * 3) - 1,
          wdy = Math.floor(Math.random() * 3) - 1;
        const nx = m.x + wdx,
          ny = m.y + wdy;
        const sd = Math.sqrt((nx - m.spawnX) ** 2 + (ny - m.spawnY) ** 2);
        if (sd < 6 && ib(nx, ny) && WALKABLE.has(map[ny]?.[nx])) {
          m.x = nx;
          m.y = ny;
        }
      }
    });
  }

  // ── Player input ──
  function handleInput(now) {
    if (now - lastMoveTime < 145) return;
    let nx = player.x,
      ny = player.y,
      moved = false;
    if (keys["ArrowUp"] || keys["KeyW"]) {
      ny--;
      player.dir = 3;
      moved = true;
    }
    if (keys["ArrowDown"] || keys["KeyS"]) {
      ny++;
      player.dir = 0;
      moved = true;
    }
    if (keys["ArrowLeft"] || keys["KeyA"]) {
      nx--;
      player.dir = 1;
      moved = true;
    }
    if (keys["ArrowRight"] || keys["KeyD"]) {
      nx++;
      player.dir = 2;
      moved = true;
    }
    if (moved) {
      Sound.play("sand_step");
    } else {
      if (gameTime % 20 === 0) player.frame = 0;
      return;
    }
    nx = Math.max(0, Math.min(MAP_COLS - 1, nx));
    ny = Math.max(0, Math.min(MAP_ROWS - 1, ny));
    if (!WALKABLE.has(map[ny]?.[nx])) return;
    if (monsters.some((m) => m.hp > 0 && m.x === nx && m.y === ny)) {
      //playerAttack();
      return;
    }
    player.x = nx;
    player.y = ny;
    lastMoveTime = now;
    player.frame = (player.frame + 1) % 4;
    if (Math.random() < 0.35)
      spawnParticles(player.x + 0.5, player.y + 0.9, "#d4a84a", 3);
    checkDiscovery();
    updateHUDLocation();
  }

  function playerAttack() {
    Sound.play("hammer_attack");
    let ax = player.x,
      ay = player.y;
    if (player.dir === 3) ay--;
    else if (player.dir === 0) ay++;
    else if (player.dir === 1) ax--;
    else ax++;
    const hit = monsters.find((m) => m.hp > 0 && m.x === ax && m.y === ay);
    if (hit) {
      hit.hp--;
      spawnParticles(hit.x + 0.5, hit.y + 0.5, "#ff8800", 14);
      if (hit.hp <= 0) {
        spawnParticles(hit.x + 0.5, hit.y + 0.5, "#ffcc00", 22);
        if (window.UI)
          UI.toast(
            "⚔️ Victory!",
            `${hit.type === "scorpion" ? "Scorpion" : "Sand Wraith"} defeated! +50 XP`,
          );
        if (window.AppState?.player)
          API.addExperience(window.AppState.player.id, 50).then(() =>
            UI.updateHUD(null, 50),
          );
        player.hp = Math.min(player.maxHp, player.hp + 15);
        updateHPDisplay();
      }
    } else {
      spawnParticles(ax + 0.5, ay + 0.5, "#ffffff", 5);
    }
  }

  function handlePlayerDeath() {
    if (window.UI) UI.toast("☠ Fallen", "You collapse... respawning at camp.");
    setTimeout(() => {
      player.hp = player.maxHp;
      player.x = 4;
      player.y = 4;
      player.invincible = 120;
      updateHPDisplay();
    }, 1800);
  }

  function updateHPDisplay() {
    const el = document.getElementById("hud-hp");
    if (el) el.textContent = `❤ ${player.hp}/${player.maxHp}`;
    const bar = document.getElementById("hp-bar");
    if (bar) bar.style.width = (player.hp / player.maxHp) * 100 + "%";
    const barColor =
      player.hp / player.maxHp > 0.5
        ? "#4aaa4a"
        : player.hp / player.maxHp > 0.25
          ? "#aaaa30"
          : "#cc3333";
    if (bar) bar.style.background = barColor;
  }

  function checkDiscovery() {
    const spot = discoverySpots.find(
      (s) => s.x === player.x && s.y === player.y && !s.discovered,
    );
    if (spot && onDiscovery) {
      spot.discovered = true;
      spawnParticles(player.x + 0.5, player.y + 0.5, "#ffcc00", 18);
      onDiscovery(spot);
    }
  }

  function updateHUDLocation() {
    const spot = discoverySpots.find(
      (s) => s.x === player.x && s.y === player.y,
    );
    const el = document.getElementById("hud-location");
    const names = [
      "Desert Sand",
      "Ancient Ruins",
      "Water",
      "Rock Face",
      "Tomb",
      "Cave",
      "Oasis",
      "Sand Dune",
      "Old Path",
    ];
    if (el)
      el.textContent = spot
        ? `📍 ${spot.name}`
        : `${names[map[player.y]?.[player.x]] || "Desert"} (${player.x},${player.y})`;
  }

  // ── Render ──
  function render() {
    ctx.clearRect(0, 0, VW, VH);
    for (let r = -1; r <= VIEW_ROWS + 1; r++)
      for (let c = -1; c <= VIEW_COLS + 1; c++) {
        const mr = r + camera.y,
          mc = c + camera.x;
        if (ib(mc, mr)) drawTile(mc, mr, c * TILE, r * TILE);
      }
    drawEnvObjects();
    drawDiscoverySpots();
    drawMonsters();
    drawParticles();
    drawFog();
    drawPlayer();
    drawMinimap();
    drawCompass();
    // Controls hint bottom
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, VH - 20, VW, 20);
    ctx.fillStyle = "rgba(196,160,82,0.7)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "WASD / Arrows: Move  |  SPACE: Attack  |  Walk onto ◈ to discover",
      VW / 2,
      VH - 6,
    );
  }

  // ── Main loop ──
  function tick(now) {
    if (!running) return;
    lastFrameTime = now;
    gameTime++;
    handleInput(now);
    updateCamera();
    updateFog();
    updateMonsters();
    updateParticles();
    if (player.invincible > 0) player.invincible--;
    render();
    requestAnimationFrame(tick);
    if (gameTime % 120 === 0 && player.hp < player.maxHp) {
      player.hp += 1;
      updateHPDisplay();
    }
  }

  // ── Public ──
  function init(locations) {
    canvas = document.getElementById("game-canvas");
    canvas.width = VW;
    canvas.height = VH;
    ctx = canvas.getContext("2d");
    sprites = Sprites.buildAll();
    generateMap(locations);
    initFog();
    updateCamera();
    window.addEventListener("keydown", (e) => {
      keys[e.code] = true;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (e.code === "Space") playerAttack();
    });
    window.addEventListener("keyup", (e) => {
      keys[e.code] = false;
    });
    running = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(tick);
    updateHPDisplay();
  }

  function setOnDiscovery(cb) {
    onDiscovery = cb;
  }
  function resetSpot(locationId) {
    const spot = discoverySpots.find((s) => s.locationId === locationId);
    if (spot)
      setTimeout(() => {
        spot.discovered = false;
      }, 15000);
  }

  return { init, setOnDiscovery, resetSpot };
})();
