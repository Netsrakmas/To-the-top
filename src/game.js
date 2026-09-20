/** Deterministic game rules. All distances use the same logical portrait space. */
export const WIDTH = 420;
export const HEIGHT = 760;
export const WORLD_HEIGHT = 9000;
export const SURFACE_Y = 70;
const START_Y = WORLD_HEIGHT - 84;
const PLAYER_RADIUS = 14;
const STEP = 1 / 120;
const TIERS = [
  { size: 31, speed: 150, gap: 260 },
  { size: 46, speed: 169, gap: 230 },
  { size: 65, speed: 183, gap: 190 },
];
const ZONES = [
  { index: 0, name: 'The abyss', subtitle: 'Find your way into the light', color: '#7787ff' },
  { index: 1, name: 'The reef', subtitle: 'Small fish. Bigger possibilities.', color: '#50e6c1' },
  { index: 2, name: 'The shallows', subtitle: 'The surface is within reach', color: '#9beddc' },
];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

function seedNumber(seed) {
  if (Number.isFinite(seed)) return seed >>> 0;
  let result = 2166136261;
  for (const character of String(seed)) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

function randomSource(seed) {
  let value = seed;
  return () => {
    value += 0x6D2B79F5;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function hunter(tier, x, y, status = 'chasing') {
  return { x, y, tier, size: TIERS[tier].size, status, delay: status === 'recovering' ? 1.5 : 0, phase: 0 };
}

function emit(game, type, details = {}) {
  game.events.push({ type, x: game.player.x, y: game.player.y, ...details });
}

function announce(game, text, seconds = 2.6) {
  game.banner = { text, time: seconds };
}

/**
 * Public model: player, predator, obstacles, bubbles, pickups, nets and caught are
 * mutable plain objects; renderers only read them. Timers are seconds. `events`
 * contains only events produced by the most recent call to step().
 */
export function createGame({ mode = 'classic', seed = 1 } = {}) {
  const normalizedMode = ['classic', 'daily', 'zen'].includes(mode) ? mode : 'classic';
  const actualSeed = seedNumber(seed);
  const random = randomSource(actualSeed);
  const game = {
    mode: normalizedMode, seed: actualSeed, state: 'play', time: 0,
    player: { x: WIDTH / 2, y: START_Y, vx: 0, vy: 0, r: PLAYER_RADIUS, invuln: 0, hx: 0, hy: -1 },
    predator: hunter(0, WIDTH / 2, START_Y + 420, 'recovering'),
    hearts: normalizedMode === 'zen' ? 5 : 3,
    maxHearts: normalizedMode === 'zen' ? 5 : 3,
    score: 0, shield: 0, boost: 0, cameraY: WORLD_HEIGHT - HEIGHT,
    nets: [6100, 3300, 340].map((y, i) => ({ y, passed: false, final: i === 2, caught: false, catchTimer: 0 })),
    obstacles: [], bubbles: [], pickups: [], caught: [], events: [], route: [],
    banner: { text: 'Swim up. Small is your superpower.', time: 3.8 },
    deathReason: '', distance: 0,
  };

  // Authored beats, varied by a reproducible seed. Each row has a clear passage;
  // moving enemies remain outside it even at their widest point of inflation.
  const courses = [
    [210, 130, 278, 184, 288, 138, 254, 126, 268, 178, 292, 150],
    [210, 282, 162, 270, 124, 198, 292, 154, 260, 132, 232, 286],
    [210, 148, 246, 292, 174, 128, 270, 188, 294, 150, 224, 126],
  ];
  game.course = Math.floor(random() * courses.length);
  const lanes = courses[game.course];
  const mirror = random() > 0.5;
  let row = 0;
  game.route.push({ x: WIDTH / 2, y: START_Y });
  for (let y = WORLD_HEIGHT - 430; y >= 560; y -= 280) {
    if (game.nets.some(net => Math.abs(net.y - y) < 175)) continue;
    const authored = lanes[row % lanes.length];
    const lane = clamp((mirror ? WIDTH - authored : authored) + (random() - 0.5) * 20, 122, 298);
    game.route.push({ x: lane, y });
    const zone = y > 6100 ? 0 : y > 3300 ? 1 : 2;
    for (const side of [-1, 1]) {
      const type = (row + (side === 1 ? 1 : 0)) % 4 === 0 ? 'rock'
        : row % 3 === 0 ? 'jelly' : ['angler', 'puffer', 'urchin'][zone];
      const radius = type === 'rock' ? 30 + random() * 5 : type === 'angler' ? 24 : 21 + random() * 3;
      const amplitude = type === 'rock' ? 0 : 9 + random() * 7;
      const maximumRadius = type === 'puffer' ? radius * 1.24 : radius;
      const x = lane + side * (70 + maximumRadius + amplitude);
      if (x < maximumRadius + 8 || x > WIDTH - maximumRadius - 8) continue;
      game.obstacles.push({
        type, x, y, r: radius, hitR: radius, baseX: x,
        phase: random() * Math.PI * 2, amplitude, frequency: 0.55 + random() * 0.35,
        inflated: 0.5, side, row,
      });
    }
    // Sparse reef edges close the otherwise trivial wall-hugging shortcut.
    // Their inner edge is x=50/370, outside even the narrowest authored passage.
    if (row % 4 === 2) {
      for (const x of [27, WIDTH - 27]) game.obstacles.push({
        type: 'rock', x, y, r: 23, hitR: 23, baseX: x, phase: row * 1.3,
        amplitude: 0, frequency: 0, inflated: 0, side: x < WIDTH / 2 ? -1 : 1, row, edge: true,
      });
    }
    row++;
  }
  game.route.push({ x: WIDTH / 2, y: SURFACE_Y });
  // Bubble trails connect the guaranteed openings, teaching a readable route.
  for (let i = 1; i < game.route.length; i++) {
    const before = game.route[i - 1];
    const after = game.route[i];
    const count = Math.max(2, Math.floor((before.y - after.y) / 85));
    for (let n = 1; n <= count; n++) {
      const t = n / count;
      game.bubbles.push({ x: lerp(before.x, after.x, t), y: lerp(before.y, after.y, t), r: 6, got: false, phase: random() * 6.28 });
    }
  }
  for (const [index, type] of [[4, 'shield'], [10, 'boost'], [16, 'shield'], [23, 'boost']]) {
    const point = game.route[Math.min(index, game.route.length - 2)];
    game.pickups.push({ type, x: point.x, y: point.y + 72, r: 13, got: false, phase: random() * 6.28 });
  }
  return game;
}

export function progress(game) {
  return clamp((START_Y - game.player.y) / (START_Y - SURFACE_Y), 0, 1);
}

export function getZone(game) {
  return ZONES[game.player.y > 6100 ? 0 : game.player.y > 3300 ? 1 : 2];
}

function finish(game, state, reason = '') {
  if (game.state === 'win' || game.state === 'lose') return;
  game.state = state;
  game.deathReason = reason;
  game.player.vx = 0;
  game.player.vy = 0;
  emit(game, state, { reason });
}

function damage(game, obstacle) {
  const player = game.player;
  if (player.invuln > 0) return;
  if (game.shield > 0) {
    game.shield = 0;
    player.invuln = 1.1;
    emit(game, 'shield', { consumed: true });
    announce(game, 'Bubble shield saved you');
    return;
  }
  game.hearts--;
  player.invuln = 1.65;
  player.y = Math.min(WORLD_HEIGHT - player.r, player.y + 28);
  player.vy = 35;
  emit(game, 'hurt', { obstacle: obstacle.type, hearts: game.hearts });
  if (game.hearts <= 0) {
    finish(game, 'lose', 'hazards');
    return;
  }
  announce(game, game.hearts === 1 ? 'One heart. You can still make it.' : 'Keep swimming. You have this.');
}

function movePlayer(game, input, dt) {
  const player = game.player;
  const autoExit = game.state === 'winning';
  const hasTarget = Number.isFinite(input.targetX);
  let targetVx = clamp(Number(input.axis) || 0, -1, 1) * 265;
  if (hasTarget) targetVx = clamp((clamp(input.targetX, player.r, WIDTH - player.r) - player.x) * 11, -285, 285);
  if (autoExit) targetVx = clamp((WIDTH / 2 - player.x) * 2.2, -110, 110);
  player.vx = lerp(player.vx, targetVx, 1 - Math.exp(-14 * dt));
  const inNet = game.nets.some(net => Math.abs(player.y - net.y) < 25);
  const swimSpeed = game.boost > 0 ? 265 : 184;
  const targetVy = (input.swim || autoExit) ? -swimSpeed * (inNet ? 0.8 : 1) : 88;
  player.vy = lerp(player.vy, targetVy, 1 - Math.exp(-8 * dt));
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  if (player.x < player.r || player.x > WIDTH - player.r) player.vx = 0;
  player.x = clamp(player.x, player.r, WIDTH - player.r);
  player.y = clamp(player.y, SURFACE_Y, WORLD_HEIGHT - player.r);
  if (player.y === WORLD_HEIGHT - player.r && player.vy > 0) player.vy = 0;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > 20) {
    const blend = 1 - Math.exp(-10 * dt);
    player.hx = lerp(player.hx, player.vx / speed, blend);
    player.hy = lerp(player.hy, player.vy / speed, blend);
  }
}

function moveObstacles(game) {
  for (const obstacle of game.obstacles) {
    const pulse = Math.sin(game.time * (obstacle.frequency || 0.7) + (obstacle.phase || 0));
    obstacle.inflated = 0.5 + pulse * 0.5;
    obstacle.hitR = obstacle.type === 'puffer' ? obstacle.r * (0.83 + obstacle.inflated * 0.41) : obstacle.r;
    const base = Number.isFinite(obstacle.baseX) ? obstacle.baseX : obstacle.x;
    obstacle.x = clamp(base + pulse * (obstacle.amplitude || 0), obstacle.hitR + 4, WIDTH - obstacle.hitR - 4);
    obstacle.y = clamp(obstacle.y, SURFACE_Y + obstacle.hitR, WORLD_HEIGHT - obstacle.hitR);
  }
}

function collideObstacles(game, previous) {
  const player = game.player;
  for (const obstacle of game.obstacles) {
    const distance = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
    const minimum = (obstacle.hitR || obstacle.r) + player.r;
    if (distance >= minimum) continue;
    let nx, ny;
    if (distance < 0.00001) {
      const oldDistance = Math.hypot(previous.x - obstacle.x, previous.y - obstacle.y);
      nx = oldDistance > 0.00001 ? (previous.x - obstacle.x) / oldDistance : 0;
      ny = oldDistance > 0.00001 ? (previous.y - obstacle.y) / oldDistance : 1;
    } else {
      nx = (player.x - obstacle.x) / distance;
      ny = (player.y - obstacle.y) / distance;
    }
    if (obstacle.type === 'rock') {
      let separatedX = obstacle.x + nx * (minimum + 0.1);
      let separatedY = obstacle.y + ny * (minimum + 0.1);
      // If the closest direction is blocked by a world edge, use a free vertical
      // side. This also handles exact overlap at the bottom without trapping.
      if (separatedX < player.r || separatedX > WIDTH - player.r || separatedY < SURFACE_Y || separatedY > WORLD_HEIGHT - player.r) {
        nx = 0;
        ny = previous.y >= obstacle.y ? 1 : -1;
        if (obstacle.y + ny * (minimum + 0.1) < SURFACE_Y || obstacle.y + ny * (minimum + 0.1) > WORLD_HEIGHT - player.r) ny *= -1;
        separatedX = obstacle.x;
        separatedY = obstacle.y + ny * (minimum + 0.1);
      }
      player.x = clamp(separatedX, player.r, WIDTH - player.r);
      player.y = clamp(separatedY, SURFACE_Y, WORLD_HEIGHT - player.r);
      const normalVelocity = player.vx * nx + player.vy * ny;
      if (normalVelocity < 0) {
        player.vx -= normalVelocity * nx;
        player.vy -= normalVelocity * ny;
      }
    } else if (player.invuln <= 0) {
      damage(game, obstacle);
      if (game.state === 'lose') return;
    }
  }
}

function checkNets(game) {
  for (const net of game.nets) {
    if (net.passed || game.player.y + game.player.r >= net.y) continue;
    net.passed = true;
    emit(game, 'net', { x: game.player.x, y: net.y, tier: game.predator.tier, final: net.final });
    announce(game, net.final ? 'One last net. You fit. It doesn’t.' : 'You fit through. Your hunter doesn’t.');
    if (net.final) game.state = 'winning';
  }
}

function movePredator(game, dt) {
  const predator = game.predator;
  if (predator.status === 'trapped') return;
  predator.phase += dt * 5;
  if (predator.delay > 0) {
    predator.delay = Math.max(0, predator.delay - dt);
    if (predator.delay === 0) predator.status = 'chasing';
    return;
  }
  const tier = TIERS[predator.tier];
  const gap = predator.y - game.player.y;
  const zen = game.mode === 'zen';
  const desiredGap = tier.gap + (zen ? 185 : 0);
  const speed = tier.speed - (zen ? 36 : 0) + clamp((gap - desiredGap) * (zen ? 0.18 : 0.28), 0, 125);
  predator.x = lerp(predator.x, game.player.x, 1 - Math.exp(-1.45 * dt));
  predator.x = clamp(predator.x, predator.size * 0.5, WIDTH - predator.size * 0.5);
  const pending = game.nets.find(net => net.passed && !net.caught);
  if (pending) {
    pending.catchTimer += dt;
    predator.y -= speed * dt;
    const contactY = pending.y + predator.size * 0.74;
    if (predator.y <= contactY) {
      predator.y = contactY;
      pending.caught = true;
      game.caught.push({ x: predator.x, y: contactY, tier: predator.tier, size: predator.size, thrash: 1, phase: predator.phase });
      emit(game, 'net', { x: predator.x, y: pending.y, tier: predator.tier, final: pending.final, caught: true });
      if (pending.final) {
        predator.status = 'trapped';
        announce(game, 'Small fish. Great escape.', 4);
      } else {
        const nextTier = Math.min(2, predator.tier + 1);
        game.predator = hunter(nextTier, predator.x, pending.y - TIERS[nextTier].size - 24, 'recovering');
        announce(game, 'Hunter trapped! A bigger one is waking…', 3.2);
      }
    }
    // A passed net is a physical barrier: it protects Roef on the other side.
    if (game.player.y + game.player.r < pending.y) return;
  } else {
    // Follow the player's depth when passing laterally; never swim away forever.
    predator.y = Math.max(predator.y - speed * dt, game.player.y + predator.size * 0.22);
  }
  predator.y = clamp(predator.y, SURFACE_Y, WORLD_HEIGHT + HEIGHT);
  if (game.state === 'play' && Math.hypot(predator.x - game.player.x, predator.y - game.player.y) < predator.size * 0.67 + game.player.r) {
    finish(game, 'lose', 'hunter');
  }
}

function collect(game) {
  const player = game.player;
  for (const bubble of game.bubbles) {
    if (bubble.got || Math.hypot(bubble.x - player.x, bubble.y - player.y) > bubble.r + player.r + 2) continue;
    bubble.got = true;
    game.score++;
    emit(game, 'collect', { x: bubble.x, y: bubble.y, score: game.score });
  }
  for (const pickup of game.pickups) {
    if (pickup.got || Math.hypot(pickup.x - player.x, pickup.y - player.y) > pickup.r + player.r + 3) continue;
    pickup.got = true;
    if (pickup.type === 'shield') {
      game.shield = 15;
      announce(game, 'Bubble shield · one safe landing');
    } else {
      game.boost = 3.6;
      announce(game, 'Current boost · ride the rush');
    }
    emit(game, pickup.type, { x: pickup.x, y: pickup.y, consumed: false });
  }
}

function tick(game, input, dt) {
  game.time += dt;
  game.player.invuln = Math.max(0, game.player.invuln - dt);
  game.shield = Math.max(0, game.shield - dt);
  game.boost = Math.max(0, game.boost - dt);
  game.banner.time = Math.max(0, game.banner.time - dt);
  for (const fish of game.caught) fish.thrash = Math.max(0.18, fish.thrash - dt * 0.13);
  const previous = { x: game.player.x, y: game.player.y };
  movePlayer(game, input, dt);
  moveObstacles(game);
  if (game.state === 'play') collideObstacles(game, previous);
  if (game.state === 'lose') return;
  checkNets(game);
  movePredator(game, dt);
  if (game.state === 'lose') return;
  collect(game);
  game.cameraY = clamp(Math.min(game.cameraY, game.player.y - HEIGHT * 0.56), 0, WORLD_HEIGHT - HEIGHT);
  if (game.player.y - game.cameraY > HEIGHT - 75) game.cameraY = clamp(game.player.y - (HEIGHT - 75), 0, WORLD_HEIGHT - HEIGHT);
  game.distance = Math.max(game.distance, START_Y - game.player.y);
  if (game.state === 'winning' && game.player.y <= SURFACE_Y && game.nets[2].caught) finish(game, 'win');
}

/** Advance up to 250ms, subdividing movement to avoid tunnelling on slow frames. */
export function step(game, input = {}, dt = 1 / 60) {
  game.events.length = 0;
  if (game.state === 'win' || game.state === 'lose' || !Number.isFinite(dt) || dt <= 0) return game;
  let remaining = Math.min(dt, 0.25);
  while (remaining > 0.0000001 && game.state !== 'win' && game.state !== 'lose') {
    const part = Math.min(remaining, STEP);
    tick(game, input, part);
    remaining -= part;
  }
  return game;
}
