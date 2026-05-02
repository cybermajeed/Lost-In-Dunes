// public/js/sprites.js
// All pixel-art sprites drawn programmatically via canvas
// No external images needed — pure canvas pixel art

const Sprites = (() => {
  const S = 48; // base sprite size

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w || 1, h || 1);
  }

  // ─────────────────────────────────────────────
  // PLAYER — Girl archaeologist, 4-direction walk
  // Each frame: 48x48, 4 frames per direction
  // Directions: down(0), left(1), right(2), up(3)
  // ─────────────────────────────────────────────
  function drawPlayerFrame(dir, frame) {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    const t = frame % 4;
    const walkY = [0, -1, 0, 1][t]; // bob
    const legSwing = t < 2 ? -1 : 1;

    const cx = 24,
      cy = 14 + walkY;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(cx, 44, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boots
    const bootColor = "#3d2b1a";
    if (dir !== 3) {
      // show legs for down/side
      ctx.fillStyle = bootColor;
      ctx.fillRect(cx - 7 + legSwing, cy + 24, 5, 8);
      ctx.fillRect(cx + 2 - legSwing, cy + 24, 5, 8);
    } else {
      ctx.fillStyle = bootColor;
      ctx.fillRect(cx - 6, cy + 24, 5, 8);
      ctx.fillRect(cx + 1, cy + 24, 5, 8);
    }

    // Pants/shorts — khaki
    ctx.fillStyle = "#b8935a";
    ctx.fillRect(cx - 8, cy + 16, 16, 11);

    // Shirt — teal explorer shirt
    ctx.fillStyle = "#3a8a7a";
    ctx.fillRect(cx - 9, cy + 6, 18, 13);

    // Belt
    ctx.fillStyle = "#5c3a1a";
    ctx.fillRect(cx - 9, cy + 15, 18, 3);

    // Arms
    const armSwing = t < 2 ? 2 : -2;
    ctx.fillStyle = "#c8946a";
    if (dir === 2) {
      // right
      ctx.fillRect(cx + 7, cy + 7, 5, 10);
      ctx.fillRect(cx - 10, cy + 7 + armSwing, 5, 10);
    } else if (dir === 1) {
      // left
      ctx.fillRect(cx - 12, cy + 7, 5, 10);
      ctx.fillRect(cx + 7, cy + 7 + armSwing, 5, 10);
    } else {
      ctx.fillRect(cx - 12, cy + 7 + armSwing, 5, 10);
      ctx.fillRect(cx + 7, cy + 7 - armSwing, 5, 10);
    }

    // Neck
    ctx.fillStyle = "#c8946a";
    ctx.fillRect(cx - 3, cy + 2, 6, 7);

    // Head
    ctx.fillStyle = "#c8946a";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair — brown, long-ish ponytail
    ctx.fillStyle = "#5c2d0a";
    ctx.fillRect(cx - 10, cy - 11, 20, 7); // top hair
    ctx.fillRect(cx - 10, cy - 5, 4, 12); // left side
    ctx.fillRect(cx + 6, cy - 5, 4, 12); // right side
    if (dir !== 2) {
      // ponytail (back / left)
      ctx.fillRect(cx + 6, cy - 2, 6, 16);
    }

    // Face (only for forward/side)
    if (dir === 0) {
      // eyes
      ctx.fillStyle = "#2a1a0a";
      ctx.fillRect(cx - 5, cy - 1, 3, 3);
      ctx.fillRect(cx + 2, cy - 1, 3, 3);
      // eye whites
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - 4, cy - 1, 2, 2);
      ctx.fillRect(cx + 3, cy - 1, 2, 2);
      // mouth
      ctx.fillStyle = "#9a4a3a";
      ctx.fillRect(cx - 3, cy + 4, 6, 2);
      // nose
      ctx.fillStyle = "#b87850";
      ctx.fillRect(cx - 1, cy + 1, 2, 3);
    } else if (dir === 1 || dir === 2) {
      const faceX = dir === 2 ? cx + 2 : cx - 5;
      ctx.fillStyle = "#2a1a0a";
      ctx.fillRect(faceX, cy - 1, 3, 3);
      ctx.fillStyle = "#fff";
      ctx.fillRect(faceX + (dir === 2 ? 0 : 1), cy - 1, 2, 2);
      ctx.fillStyle = "#9a4a3a";
      ctx.fillRect(faceX - (dir === 2 ? -1 : 1), cy + 4, 4, 2);
    }

    // Explorer hat — wide brim
    ctx.fillStyle = "#c4a052";
    ctx.fillRect(cx - 13, cy - 12, 26, 4); // brim
    ctx.fillStyle = "#a88030";
    ctx.fillRect(cx - 9, cy - 21, 18, 10); // crown
    ctx.fillStyle = "#8a6020";
    ctx.fillRect(cx - 9, cy - 13, 18, 2); // hatband

    // Backpack (when facing away)
    if (dir === 3) {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(cx - 6, cy + 6, 12, 14);
      ctx.fillStyle = "#6a3310";
      ctx.fillRect(cx - 4, cy + 8, 8, 10);
    }

    // Tool — trowel in hand
    if (dir !== 3) {
      ctx.fillStyle = "#8a7a60";
      ctx.fillRect(cx + 10, cy + 14, 2, 8);
      ctx.fillStyle = "#c0a060";
      ctx.fillRect(cx + 8, cy + 20, 6, 4);
    }

    return c;
  }

  // ─────────────────────────────────────────────
  // SCORPION MONSTER — 3-frame walk animation
  // ─────────────────────────────────────────────
  function drawScorpionFrame(frame) {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    const t = frame % 3;
    const bob = t === 1 ? 1 : 0;
    const cx = 24,
      cy = 26 + bob;

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(cx, 44, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyColor = "#8B2000";
    const darkColor = "#5c1000";
    const clawColor = "#c03000";

    // Tail segments (curved upward)
    const tailSegs = [
      [cx + 8, cy - 2],
      [cx + 14, cy - 10],
      [cx + 16, cy - 18],
      [cx + 13, cy - 24],
    ];
    tailSegs.forEach(([tx, ty], i) => {
      ctx.fillStyle = i % 2 === 0 ? bodyColor : darkColor;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 4 - i * 0.3, 4 - i * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // Stinger
    ctx.fillStyle = "#ff4400";
    ctx.beginPath();
    ctx.moveTo(13, cy - 28);
    ctx.lineTo(17, cy - 24);
    ctx.lineTo(11, cy - 22);
    ctx.fill();

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 2, 7, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Claws
    const clawOpen = t === 0 ? 3 : 0;
    ctx.fillStyle = clawColor;
    // Left claw
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 4);
    ctx.lineTo(cx - 20, cy - 8 - clawOpen);
    ctx.lineTo(cx - 22, cy - 3);
    ctx.lineTo(cx - 17, cy - 1);
    ctx.fill();
    // Right upper claw
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 4);
    ctx.lineTo(cx - 20, cy + 2 + clawOpen);
    ctx.lineTo(cx - 21, cy - 2);
    ctx.fill();

    // Legs (3 pairs)
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ly = cy + i * 3;
      const legWiggle = (i + t) % 2 === 0 ? 4 : -2;
      ctx.beginPath();
      ctx.moveTo(cx - 4 + i * 4, ly);
      ctx.lineTo(cx - 4 + i * 4 - 8, ly + 8 + legWiggle);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4 + i * 4, ly);
      ctx.lineTo(cx - 4 + i * 4 + 8, ly + 8 - legWiggle);
      ctx.stroke();
    }

    // Eyes — glowing red
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(cx - 14, cy - 5, 3, 3);
    ctx.fillRect(cx - 10, cy - 6, 3, 3);

    return c;
  }

  // ─────────────────────────────────────────────
  // SAND WRAITH MONSTER
  // ─────────────────────────────────────────────
  function drawWraithFrame(frame) {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    const t = frame % 4;
    const bob = Math.sin((t * Math.PI) / 2) * 3;
    const cx = 24,
      cy = 24 + bob;

    // Ghostly glow
    const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
    grd.addColorStop(0, "rgba(180,120,255,0.3)");
    grd.addColorStop(1, "rgba(180,120,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, S, S);

    // Body — flowing robe
    ctx.fillStyle = "rgba(130,80,200,0.9)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Robe bottom — wavy
    for (let i = 0; i < 5; i++) {
      const wx = cx - 12 + i * 6;
      const wy = cy + 16 + Math.sin(t * 0.8 + i) * 3;
      ctx.fillStyle = "rgba(100,50,180,0.8)";
      ctx.beginPath();
      ctx.ellipse(wx, wy, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head/hood
    ctx.fillStyle = "rgba(60,30,120,0.95)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hood point
    ctx.fillStyle = "rgba(60,30,120,0.9)";
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 16);
    ctx.lineTo(cx + 6, cy - 16);
    ctx.lineTo(cx, cy - 26);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = "#ffcc00";
    const eyeFlicker = t % 3 === 0 ? 0.5 : 1;
    ctx.globalAlpha = eyeFlicker;
    ctx.fillRect(cx - 6, cy - 10, 4, 4);
    ctx.fillRect(cx + 2, cy - 10, 4, 4);
    ctx.globalAlpha = 1;

    // Arms/tendrils
    ctx.strokeStyle = "rgba(180,120,255,0.8)";
    ctx.lineWidth = 3;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 10, cy);
      ctx.quadraticCurveTo(
        cx + side * 20,
        cy + 4 + Math.sin(t) * 4,
        cx + side * 18,
        cy + 14,
      );
      ctx.stroke();
    }

    return c;
  }

  // ─────────────────────────────────────────────
  // ENVIRONMENTAL SPRITES (static)
  // ─────────────────────────────────────────────

  function drawCactus() {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    const cx = 24;
    // Trunk
    ctx.fillStyle = "#4a8a3a";
    ctx.fillRect(cx - 4, 14, 8, 30);
    // Left arm
    ctx.fillRect(cx - 12, 20, 8, 5);
    ctx.fillRect(cx - 14, 12, 5, 10);
    // Right arm
    ctx.fillRect(cx + 4, 26, 8, 5);
    ctx.fillRect(cx + 7, 18, 5, 10);
    // Spines
    ctx.fillStyle = "#2a5a2a";
    ctx.fillRect(cx - 5, 14, 2, 4);
    ctx.fillRect(cx + 3, 20, 2, 4);
    ctx.fillRect(cx - 16, 14, 2, 4);
    ctx.fillRect(cx + 10, 20, 2, 4);
    // Top
    ctx.fillStyle = "#5aaa4a";
    ctx.beginPath();
    ctx.ellipse(cx, 14, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  function drawBones() {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#e8dfc0";
    // Skull
    ctx.beginPath();
    ctx.ellipse(28, 16, 10, 9, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c8bf9a";
    ctx.fillRect(23, 22, 12, 5);
    // Teeth
    ctx.fillStyle = "#e8dfc0";
    for (let i = 0; i < 3; i++) ctx.fillRect(24 + i * 4, 24, 3, 4);
    // Eye sockets
    ctx.fillStyle = "#2a1e10";
    ctx.beginPath();
    ctx.ellipse(24, 15, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(33, 14, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ribcage
    ctx.strokeStyle = "#e8dfc0";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(20, 34 + i * 4, 12, 4, 0, 0, Math.PI);
      ctx.stroke();
    }
    return c;
  }

  function drawPalmTree() {
    const c = makeCanvas(S, S * 1.5);
    const ctx = c.getContext("2d");
    const cx = 24;
    // Trunk — curved
    ctx.strokeStyle = "#7a5a30";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, 68);
    ctx.quadraticCurveTo(cx - 6, 40, cx + 4, 20);
    ctx.stroke();
    ctx.strokeStyle = "#5a4020";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 2 + i * 2, 30 + i * 8);
      ctx.lineTo(cx + 4 + i * 2, 35 + i * 8);
      ctx.stroke();
    }
    // Fronds
    const frondColor = "#3a8a2a";
    const fronds = [
      [-20, -10],
      [-14, -18],
      [0, -22],
      [14, -18],
      [20, -10],
      [10, -5],
      [-10, -5],
    ];
    fronds.forEach(([dx, dy]) => {
      ctx.strokeStyle = frondColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 4, 22);
      ctx.quadraticCurveTo(cx + dx / 2, 14 + dy / 2, cx + dx, 14 + dy);
      ctx.stroke();
      // Leaflets
      ctx.lineWidth = 1;
      for (let i = 0.3; i <= 0.9; i += 0.2) {
        const lx = cx + 4 + (dx - 4) * i;
        const ly = 22 + (dy - 8) * i;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 6, ly - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 6, ly - 4);
        ctx.stroke();
      }
    });
    // Coconuts
    ctx.fillStyle = "#8B5E3C";
    ctx.beginPath();
    ctx.arc(cx + 2, 24, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 4, 26, 3, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  function drawSandDune() {
    const c = makeCanvas(S * 2, S);
    const ctx = c.getContext("2d");
    const grd = ctx.createLinearGradient(0, 10, 0, S);
    grd.addColorStop(0, "#e0b862");
    grd.addColorStop(0.5, "#c8963a");
    grd.addColorStop(1, "#a87830");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, S);
    ctx.quadraticCurveTo(S * 0.5, 8, S, 20);
    ctx.quadraticCurveTo(S * 1.5, 32, S * 2, S);
    ctx.fill();
    // Wind lines
    ctx.strokeStyle = "rgba(255,220,100,0.4)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(8 + i * 14, 28 + i * 4);
      ctx.lineTo(28 + i * 14, 24 + i * 4);
      ctx.stroke();
    }
    return c;
  }

  function drawRuinPillar() {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    // Pillar base
    ctx.fillStyle = "#8a7055";
    ctx.fillRect(14, 32, 20, 14);
    // Broken pillar shaft
    ctx.fillStyle = "#9a8060";
    ctx.fillRect(17, 8, 14, 26);
    // Horizontal cracks
    ctx.fillStyle = "#6a5035";
    ctx.fillRect(17, 14, 14, 2);
    ctx.fillRect(17, 22, 14, 2);
    // Capital (broken top)
    ctx.fillStyle = "#b09070";
    ctx.fillRect(12, 6, 24, 6);
    // Rubble pieces
    ctx.fillStyle = "#7a6045";
    ctx.fillRect(6, 38, 8, 6);
    ctx.fillRect(36, 40, 7, 5);
    ctx.fillRect(16, 44, 5, 3);
    // Texture
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(20, 8, 2, 24);
    ctx.fillRect(26, 8, 2, 24);
    return c;
  }

  function drawCaveEntrance() {
    const c = makeCanvas(S * 2, S * 2);
    const ctx = c.getContext("2d");
    // Rock face
    ctx.fillStyle = "#5a4a35";
    ctx.fillRect(0, 20, S * 2, S * 2 - 20);
    // Cave opening (arch)
    ctx.fillStyle = "#0a0806";
    ctx.beginPath();
    ctx.arc(S, 48, 28, Math.PI, 0);
    ctx.rect(S - 28, 48, 56, 44);
    ctx.fill();
    // Rock highlight
    ctx.fillStyle = "#7a6a50";
    ctx.fillRect(0, 20, S * 2, 6);
    ctx.fillStyle = "#6a5a40";
    ctx.fillRect(0, 20, 8, S);
    // Stalactites above cave
    ctx.fillStyle = "#4a3a28";
    [
      [S - 20, 28, 5, 14],
      [S, 24, 6, 18],
      [S + 18, 26, 4, 12],
    ].forEach(([x, y, w, h]) => {
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.fill();
    });
    // Torchlight from inside
    const glow = ctx.createRadialGradient(S, 60, 2, S, 60, 30);
    glow.addColorStop(0, "rgba(255,140,0,0.25)");
    glow.addColorStop(1, "rgba(255,140,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(S - 30, 30, 60, 60);
    // Glowing eyes in darkness
    ctx.fillStyle = "rgba(255,50,0,0.8)";
    ctx.fillRect(S - 12, 54, 5, 5);
    ctx.fillRect(S + 7, 54, 5, 5);
    return c;
  }

  function drawOasisPool() {
    const c = makeCanvas(S * 2, S * 2);
    const ctx = c.getContext("2d");
    // Water
    const water = ctx.createRadialGradient(S, S, 4, S, S, 36);
    water.addColorStop(0, "#3ab4e8");
    water.addColorStop(0.6, "#1e8ab8");
    water.addColorStop(1, "#0e5a88");
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(S, S, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ripples
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    for (let r = 10; r < 34; r += 8) {
      ctx.beginPath();
      ctx.ellipse(S, S, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Sandy shore
    ctx.fillStyle = "#d4a84a";
    ctx.beginPath();
    ctx.ellipse(S, S, 44, 34, 0, 0, Math.PI * 2);
    ctx.ellipse(S, S, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill("evenodd");
    return c;
  }

  function drawAncientPot() {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    // Pot body
    const grad = ctx.createLinearGradient(10, 10, 38, 42);
    grad.addColorStop(0, "#c87040");
    grad.addColorStop(0.4, "#a85020");
    grad.addColorStop(1, "#7a3010");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(24, 30, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck
    ctx.fillStyle = "#b86030";
    ctx.fillRect(19, 14, 10, 10);
    // Rim
    ctx.fillStyle = "#d08040";
    ctx.fillRect(16, 12, 16, 5);
    // Hieroglyph markings
    ctx.strokeStyle = "#5a2800";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, 28);
    ctx.lineTo(22, 24);
    ctx.lineTo(28, 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24, 34, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(16, 38);
    ctx.lineTo(32, 38);
    ctx.stroke();
    // Crack
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 22);
    ctx.lineTo(32, 32);
    ctx.lineTo(28, 40);
    ctx.stroke();
    return c;
  }

  function drawScorpionNest() {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#6a5030";
    ctx.beginPath();
    ctx.ellipse(24, 32, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a3418";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        24 + Math.cos(a) * 10,
        32 + Math.sin(a) * 6,
        4,
        3,
        a,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // Mini scorpion
    ctx.fillStyle = "#8B2000";
    ctx.beginPath();
    ctx.ellipse(24, 30, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4400";
    ctx.beginPath();
    ctx.moveTo(28, 24);
    ctx.quadraticCurveTo(32, 20, 30, 16);
    ctx.lineTo(29, 16);
    ctx.quadraticCurveTo(31, 20, 27, 24);
    ctx.fill();
    return c;
  }

  function drawDesertFox() {
    const c = makeCanvas(S, S);
    const ctx = c.getContext("2d");
    const cx = 24,
      cy = 28;
    // Body
    ctx.fillStyle = "#e0a050";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 4, 9, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Snout
    ctx.fillStyle = "#d09040";
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy - 3, 5, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0a00";
    ctx.beginPath();
    ctx.ellipse(cx - 21, cy - 4, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill(); // nose
    // Ears — big!
    ctx.fillStyle = "#e0a050";
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 10);
    ctx.lineTo(cx - 10, cy - 24);
    ctx.lineTo(cx - 4, cy - 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 10);
    ctx.lineTo(cx - 1, cy - 22);
    ctx.lineTo(cx + 4, cy - 10);
    ctx.fill();
    ctx.fillStyle = "#ffd0b0";
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 11);
    ctx.lineTo(cx - 10, cy - 21);
    ctx.lineTo(cx - 7, cy - 11);
    ctx.fill();
    // Tail
    ctx.strokeStyle = "#e0a050";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 4);
    ctx.quadraticCurveTo(cx + 24, cy - 4, cx + 22, cy - 12);
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy - 10);
    ctx.lineTo(cx + 22, cy - 16);
    ctx.stroke();
    // Legs
    ctx.fillStyle = "#d09040";
    ctx.fillRect(cx - 12, cy + 10, 4, 8);
    ctx.fillRect(cx - 4, cy + 10, 4, 8);
    ctx.fillRect(cx + 4, cy + 10, 4, 8);
    ctx.fillRect(cx + 10, cy + 10, 4, 8);
    // Eye
    ctx.fillStyle = "#1a0a00";
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 5, 1, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  function drawTorch() {
    const c = makeCanvas(24, 40);
    const ctx = c.getContext("2d");
    // Handle
    ctx.fillStyle = "#6a4a20";
    ctx.fillRect(9, 20, 6, 20);
    // Top wrap
    ctx.fillStyle = "#5a3a10";
    ctx.fillRect(8, 18, 8, 5);
    // Flame — orange/yellow
    ctx.fillStyle = "#ff8800";
    ctx.beginPath();
    ctx.ellipse(12, 14, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.ellipse(12, 12, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(12, 11, 1.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  function drawAncientAltar() {
    const c = makeCanvas(S * 2, S);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#6a5035";
    ctx.fillRect(4, 20, S * 2 - 8, S - 20);
    ctx.fillStyle = "#8a6a45";
    ctx.fillRect(0, 16, S * 2, 10);
    // Top surface
    ctx.fillStyle = "#5a4025";
    ctx.fillRect(4, 16, S * 2 - 8, 8);
    // Runes
    ctx.strokeStyle = "rgba(255,140,0,0.6)";
    ctx.lineWidth = 1.5;
    const runes = [
      [16, 20],
      [36, 20],
      [56, 20],
      [76, 20],
    ];
    runes.forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.moveTo(rx, ry - 4);
      ctx.lineTo(rx, ry + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - 4, ry);
      ctx.lineTo(rx + 4, ry);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - 3, ry - 3);
      ctx.lineTo(rx + 3, ry + 3);
      ctx.stroke();
    });
    // Glowing center gem
    const gem = ctx.createRadialGradient(S, 18, 1, S, 18, 8);
    gem.addColorStop(0, "rgba(255,60,0,1)");
    gem.addColorStop(0.5, "rgba(255,120,0,0.6)");
    gem.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = gem;
    ctx.beginPath();
    ctx.arc(S, 18, 8, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  // ─────────────────────────────────────────────
  // BUILD ALL SPRITE SHEETS
  // ─────────────────────────────────────────────
  function buildAll() {
    const sheets = {};

    // Player — 4 dirs × 4 frames
    const playerSheet = makeCanvas(S * 4, S * 4);
    const pctx = playerSheet.getContext("2d");
    for (let dir = 0; dir < 4; dir++) {
      for (let f = 0; f < 4; f++) {
        const frame = drawPlayerFrame(dir, f);
        pctx.drawImage(frame, f * S, dir * S);
      }
    }
    sheets.player = playerSheet;

    // Scorpion — 3 frames
    const scSheet = makeCanvas(S * 3, S);
    const sctx = scSheet.getContext("2d");
    for (let f = 0; f < 3; f++) {
      sctx.drawImage(drawScorpionFrame(f), f * S, 0);
    }
    sheets.scorpion = scSheet;

    // Wraith — 4 frames
    const wrSheet = makeCanvas(S * 4, S);
    const wrtx = wrSheet.getContext("2d");
    for (let f = 0; f < 4; f++) {
      wrtx.drawImage(drawWraithFrame(f), f * S, 0);
    }
    sheets.wraith = wrSheet;

    // Environment (static)
    sheets.cactus = drawCactus();
    sheets.bones = drawBones();
    sheets.palmTree = drawPalmTree();
    sheets.ruinPillar = drawRuinPillar();
    sheets.caveEntrance = drawCaveEntrance();
    sheets.oasisPool = drawOasisPool();
    sheets.ancientPot = drawAncientPot();
    sheets.scorpionNest = drawScorpionNest();
    sheets.desertFox = drawDesertFox();
    sheets.torch = drawTorch();
    sheets.altar = drawAncientAltar();
    sheets.sandDune = drawSandDune();

    return sheets;
  }

  return { buildAll, SPRITE_SIZE: S };
})();
