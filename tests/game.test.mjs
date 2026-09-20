import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, progress, getZone, WIDTH, HEIGHT, WORLD_HEIGHT, SURFACE_Y } from '../src/game.js';

const active = game => game.state === 'play' || game.state === 'winning';

// An imperfect player follows the visible trail with a small lookahead. This is
// also a reachability check: it uses the same public movement/collision rules.
function trailTarget(game) {
  const y = game.player.y - 40;
  for (let index = 1; index < game.route.length; index++) {
    const before = game.route[index - 1], after = game.route[index];
    if (y < after.y) continue;
    const ratio = Math.max(0, Math.min(1, (before.y - y) / (before.y - after.y)));
    return before.x + (after.x - before.x) * ratio;
  }
  return WIDTH / 2;
}

function completeRun({ seed = 1, mode = 'classic', fps = 60 } = {}) {
  const game = createGame({ seed, mode });
  const events = [];
  for (let frame = 0; frame < fps * 70 && active(game); frame++) {
    step(game, { swim: true, targetX: trailTarget(game) }, 1 / fps);
    events.push(...game.events.map(event => ({ ...event, time: game.time })));
  }
  return { game, events };
}

function isolatedGame() {
  const game = createGame();
  game.obstacles = [];
  game.bubbles = [];
  game.pickups = [];
  game.player.y = 7800;
  game.predator.y = 8500;
  game.predator.status = 'chasing';
  game.predator.delay = 0;
  return game;
}

test('seeded routes are reproducible and daily seeds produce different courses', () => {
  assert.deepEqual(createGame({ mode: 'daily', seed: '2026-09-20' }), createGame({ mode: 'daily', seed: '2026-09-20' }));
  assert.notDeepEqual(createGame({ seed: 1 }).obstacles, createGame({ seed: 2 }).obstacles);
  const game = createGame();
  assert.equal(progress(game), 0);
  assert.equal(game.cameraY, WORLD_HEIGHT - HEIGHT);
  assert.equal(game.hearts, 3);
  assert.equal(createGame({ mode: 'zen' }).hearts, 5);
});

test('each authored row has an open corridor throughout the enemy movement cycle', () => {
  const game = createGame({ seed: 42 });
  for (const obstacle of game.obstacles) {
    const routePoint = game.route.find(point => point.y === obstacle.y);
    assert.ok(routePoint);
    const largestRadius = obstacle.type === 'puffer' ? obstacle.r * 1.24 : obstacle.r;
    const clearance = Math.abs(obstacle.baseX - routePoint.x) - obstacle.amplitude - largestRadius;
    assert.ok(clearance >= 69.99, `row ${obstacle.row} passage remains clear`);
    assert.ok(game.nets.every(net => Math.abs(net.y - obstacle.y) >= 175), 'net approach is readable');
  }
});

test('multiple seeded courses can be completed by following the bubble trail', () => {
  for (const seed of [1, 2, 3, 42, 20260920, 4294967295]) {
    const { game, events } = completeRun({ seed });
    assert.equal(game.state, 'win', `seed ${seed}: ${game.deathReason}`);
    assert.equal(game.hearts, 3, 'a clear route does not require damage');
    assert.ok(game.time >= 45 && game.time <= 65, `run lasts ${game.time.toFixed(2)} seconds`);
    assert.equal(game.player.y, SURFACE_Y);
    assert.equal(progress(game), 1);
    assert.equal(game.caught.length, 3);
    assert.ok(game.nets.every(net => net.passed && net.caught));
    assert.deepEqual(game.caught.map(fish => fish.tier), [0, 1, 2]);
    assert.equal(events.filter(event => event.type === 'win').length, 1);
    assert.ok(game.score > 70, 'the visible route is rewarding');
  }
});

test('30, 60 and 120 Hz play has the same outcome and timing', () => {
  const runs = [30, 60, 120].map(fps => completeRun({ fps }).game);
  assert.ok(runs.every(game => game.state === 'win' && game.hearts === 3));
  assert.ok(Math.max(...runs.map(game => game.time)) - Math.min(...runs.map(game => game.time)) < 0.06);
  assert.ok(Math.max(...runs.map(game => game.score)) - Math.min(...runs.map(game => game.score)) <= 1);
});

test('hunters hit each net physically after Roef clears it, and before the next hunter appears', () => {
  const { game, events } = completeRun();
  const crossings = events.filter(event => event.type === 'net' && !event.caught);
  const catches = events.filter(event => event.type === 'net' && event.caught);
  assert.equal(crossings.length, 3);
  assert.equal(catches.length, 3);
  for (let index = 0; index < 3; index++) {
    assert.ok(catches[index].time > crossings[index].time + 0.5);
    assert.ok(Math.abs(game.caught[index].y - (game.nets[index].y + game.caught[index].size * 0.74)) < 0.01);
    if (index < 2) assert.ok(catches[index].time < crossings[index + 1].time);
  }
  assert.ok(events.find(event => event.type === 'win').time >= catches[2].time);
});

test('doing nothing is caught, and lateral dodging cannot abandon the hunter', () => {
  const game = isolatedGame();
  game.player.x = WIDTH - game.player.r;
  game.predator.x = game.predator.size;
  game.predator.y = game.player.y + 20;
  for (let frame = 0; frame < 600 && active(game); frame++) step(game, {}, 1 / 60);
  assert.equal(game.state, 'lose');
  assert.equal(game.deathReason, 'hunter');
  assert.ok(game.time < 6, 'hunter returns to the player instead of escaping up-screen');
});

test('neither center-only swimming nor holding an edge can skip the route', () => {
  for (const seed of [1, 2, 3, 42, 20260920, 4294967295]) {
    for (const targetX of [14, WIDTH / 2, WIDTH - 14]) {
      const game = createGame({ seed });
      for (let frame = 0; frame < 4200 && active(game); frame++) step(game, { swim: true, targetX }, 1 / 60);
      assert.equal(game.state, 'lose', `seed ${seed}, constant lane ${targetX}`);
    }
  }
});

test('the opening gives reaction time and the trail safely introduces the first obstacles', () => {
  const idle = createGame();
  let warningAt;
  for (let frame = 0; frame < 600 && active(idle); frame++) {
    step(idle, {}, 1 / 60);
    if (idle.predator.status === 'chasing' && idle.predator.y - idle.player.y < 266) warningAt ??= idle.time;
  }
  assert.equal(idle.deathReason, 'hunter');
  assert.ok(idle.time > 3.2 && idle.time < 5);
  assert.ok(idle.time - warningAt > 1.2, 'visible danger precedes capture');
  const playing = createGame();
  for (let frame = 0; frame < 600; frame++) step(playing, { swim: true, targetX: trailTarget(playing) }, 1 / 60);
  assert.equal(playing.state, 'play');
  assert.equal(playing.hearts, 3);
  assert.ok(playing.score >= 15 && progress(playing) > 0.18);
});

test('zen gives extra hearts and more time to recover', () => {
  const classic = createGame(), zen = createGame({ mode: 'zen' });
  for (const game of [classic, zen]) {
    game.obstacles = [];
    for (let frame = 0; frame < 1200 && active(game); frame++) step(game, {}, 1 / 60);
  }
  assert.equal(classic.state, 'lose');
  assert.equal(zen.state, 'lose');
  assert.ok(zen.time > classic.time + 0.4);
  assert.equal(zen.hearts, 5);
  assert.equal(completeRun({ mode: 'zen' }).game.state, 'win');
});

test('rocks separate overlapping actors without consuming hearts', () => {
  const game = isolatedGame();
  const rock = { type: 'rock', x: game.player.x, y: game.player.y, r: 34 };
  game.obstacles.push(rock);
  step(game, {}, 1 / 120);
  assert.ok(Math.hypot(game.player.x - rock.x, game.player.y - rock.y) >= rock.r + game.player.r);
  assert.equal(game.hearts, 3);
  assert.ok(Number.isFinite(game.player.x) && Number.isFinite(game.player.y));
});

test('an exact zero-distance collision has a finite escape normal', () => {
  const game = isolatedGame();
  const rock = { type: 'rock', x: game.player.x, y: game.player.y, r: 34 };
  game.obstacles.push(rock);
  // A near-zero advance preserves coincident centers to numerical precision.
  step(game, {}, 0.000001);
  assert.ok(Number.isFinite(game.player.x) && Number.isFinite(game.player.y));
  assert.ok(Math.hypot(game.player.x - rock.x, game.player.y - rock.y) >= rock.r + game.player.r);
  assert.ok(game.player.x >= game.player.r && game.player.x <= WIDTH - game.player.r);
  assert.equal(game.hearts, 3);
});

test('world edges cannot trap Roef inside a rock', () => {
  const game = isolatedGame();
  game.player.y = WORLD_HEIGHT - game.player.r;
  const rock = { type: 'rock', x: game.player.x, y: WORLD_HEIGHT - 34, r: 34 };
  game.obstacles.push(rock);
  step(game, {}, 1 / 120);
  assert.ok(Math.hypot(game.player.x - rock.x, game.player.y - rock.y) >= rock.r + game.player.r);
  assert.ok(game.player.y <= WORLD_HEIGHT - game.player.r);
  assert.equal(game.hearts, 3);
});

test('damage grants invulnerability and has a distinct terminal reason', () => {
  const game = isolatedGame();
  const enemy = { type: 'jelly', x: game.player.x, y: game.player.y, r: 25 };
  game.obstacles.push(enemy);
  step(game, {}, 1 / 60);
  assert.equal(game.hearts, 2);
  game.player.y = enemy.y;
  step(game, {}, 1 / 60);
  assert.equal(game.hearts, 2);
  game.player.invuln = 0;
  game.hearts = 1;
  game.player.y = enemy.y;
  step(game, {}, 1 / 60);
  assert.equal(game.state, 'lose');
  assert.equal(game.deathReason, 'hazards');
  assert.equal(game.hearts, 0);
});

test('shield absorbs one hazard; boost increases swimming speed and expires', () => {
  const game = isolatedGame();
  game.pickups.push({ type: 'shield', x: game.player.x, y: game.player.y, r: 13, got: false });
  step(game, { swim: true }, 1 / 60);
  assert.ok(game.shield > 14);
  game.obstacles.push({ type: 'jelly', x: game.player.x, y: game.player.y, r: 25 });
  step(game, { swim: true }, 1 / 60);
  assert.equal(game.shield, 0);
  assert.equal(game.hearts, 3);
  assert.ok(game.events.some(event => event.type === 'shield' && event.consumed));
  game.obstacles = [];
  game.pickups.push({ type: 'boost', x: game.player.x, y: game.player.y, r: 13, got: false });
  step(game, { swim: true }, 1 / 60);
  for (let frame = 0; frame < 60; frame++) step(game, { swim: true }, 1 / 60);
  assert.ok(game.player.vy < -250);
  for (let frame = 0; frame < 240; frame++) step(game, { swim: true }, 1 / 60);
  assert.equal(game.boost, 0);
  assert.ok(game.player.vy > -190);
});

test('terminal simulation freezes and a lethal frame cannot collect another bubble', () => {
  const game = isolatedGame();
  game.predator.x = game.player.x;
  game.predator.y = game.player.y;
  game.bubbles.push({ x: game.player.x, y: game.player.y, r: 6, got: false });
  step(game, {}, 1 / 60);
  assert.equal(game.state, 'lose');
  assert.equal(game.score, 0);
  const frozen = structuredClone({ ...game, events: [] });
  for (let frame = 0; frame < 120; frame++) step(game, { swim: true, axis: 1 }, 1 / 30);
  assert.deepEqual(game, frozen);
});

test('collection happens once, events clear each step, and invalid deltas do no work', () => {
  const game = isolatedGame();
  game.bubbles.push({ x: game.player.x, y: game.player.y, r: 6, got: false });
  step(game, {}, 1 / 60);
  assert.equal(game.score, 1);
  assert.equal(game.events.filter(event => event.type === 'collect').length, 1);
  step(game, {}, 1 / 60);
  assert.equal(game.score, 1);
  assert.equal(game.events.length, 0);
  const time = game.time;
  for (const dt of [0, -1, NaN, Infinity]) step(game, {}, dt);
  assert.equal(game.time, time);
  step(game, { swim: true }, 10);
  assert.ok(game.time <= time + 0.25001, 'background-tab catchup cannot consume the whole run');
});

test('actors stay in the logical playfield with extreme steering', () => {
  const game = isolatedGame();
  for (const targetX of [-100000, 100000]) {
    for (let frame = 0; frame < 100; frame++) step(game, { swim: true, targetX }, 1 / 60);
    assert.ok(game.player.x >= game.player.r && game.player.x <= WIDTH - game.player.r);
    assert.ok(game.cameraY >= 0 && game.cameraY <= WORLD_HEIGHT - HEIGHT);
  }
  assert.equal(getZone(game).index, 0);
  game.player.y = 5000;
  assert.equal(getZone(game).index, 1);
  game.player.y = 1000;
  assert.equal(getZone(game).index, 2);
});
