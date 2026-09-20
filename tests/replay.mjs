import { createGame, step, progress, getZone, WIDTH } from '../src/game.js';
import { Renderer } from '../src/renderer.js';

const $ = id => document.getElementById(id);
const renderer = new Renderer($('replay-canvas'));
const STEP = 1 / 120;
const terminals = new Set(['win', 'lose']);
const checkpoints = {
  abyss: { title: 'Abyss', reached: game => game.player.y <= 8050 },
  reef: { title: 'Reef', reached: game => game.player.y <= 5350 },
  shallows: { title: 'Shallows', reached: game => game.player.y <= 2450 },
  surface: { title: 'Surface', reached: game => terminals.has(game.state) },
};

let game = createGame({ mode: 'classic', seed: 1 });
let running = false;
let accumulator = 0;
let previous = performance.now();
let visualTime = 0;
let renderedFrames = 0;
let simulationSteps = 0;
let eventCount = 0;
let totalRenderMs = 0;
let lastStats = -Infinity;

// Same public controls as a player: continuous swimming and horizontal targeting.
function trailTarget(current) {
  const lookaheadY = current.player.y - 40;
  for (let index = 1; index < current.route.length; index++) {
    const before = current.route[index - 1], after = current.route[index];
    if (lookaheadY < after.y) continue;
    const ratio = Math.max(0, Math.min(1, (before.y - lookaheadY) / (before.y - after.y)));
    return before.x + (after.x - before.x) * ratio;
  }
  return WIDTH / 2;
}

function simulate(effects = true) {
  step(game, { swim: true, targetX: trailTarget(game) }, STEP);
  simulationSteps++;
  eventCount += game.events.length;
  if (effects) renderer.handleEvents(game.events);
}

function refreshControls() {
  $('pause').disabled = !running;
  $('resume').disabled = running || terminals.has(game.state);
}

function reset() {
  game = createGame({ mode: 'classic', seed: 1 });
  running = false;
  accumulator = 0;
  visualTime = 0;
  renderedFrames = 0;
  simulationSteps = 0;
  eventCount = 0;
  totalRenderMs = 0;
  renderer.reset();
  previous = performance.now();
  $('error').hidden = true;
}

function reportTerminal() {
  running = false;
  accumulator = 0;
  $('status').textContent = game.state === 'win'
    ? `Complete: escaped in ${game.time.toFixed(2)}s with ${game.hearts} hearts, ${game.score} bubbles and all ${game.caught.length} hunters caught. The actual surface scene remains visible.`
    : `Replay ended: ${game.deathReason || 'unknown reason'} at ${(progress(game) * 100).toFixed(1)}%.`;
  refreshControls();
}

function updateStats(force = false) {
  const now = performance.now();
  if (!force && now - lastStats < 120) return;
  lastStats = now;
  $('state').textContent = `${game.state} · ${running ? 'running' : 'paused'}`;
  $('zone').textContent = getZone(game).name;
  $('health').textContent = `${game.hearts} / ${game.maxHearts}`;
  $('progress').textContent = `${(progress(game) * 100).toFixed(1)}%`;
  $('score').textContent = game.score;
  $('nets').textContent = `${game.nets.filter(net => net.passed).length} / ${game.nets.filter(net => net.caught).length}`;
  $('elapsed').textContent = `${game.time.toFixed(2)}s`;
  $('frames').textContent = renderedFrames;
  $('steps').textContent = simulationSteps;
  $('render-ms').textContent = `${(renderedFrames ? totalRenderMs / renderedFrames : 0).toFixed(2)} ms`;
  $('events').textContent = eventCount;
}

$('run').addEventListener('click', () => {
  reset();
  $('checkpoint').value = '';
  running = true;
  $('status').textContent = 'Following the bubble trail using real game inputs.';
  refreshControls();
  updateStats(true);
});

$('pause').addEventListener('click', () => {
  running = false;
  accumulator = 0;
  $('status').textContent = `Paused at ${(progress(game) * 100).toFixed(1)}%.`;
  refreshControls();
  updateStats(true);
});

$('resume').addEventListener('click', () => {
  if (terminals.has(game.state)) return;
  previous = performance.now();
  running = true;
  $('status').textContent = 'Following the bubble trail using real game inputs.';
  refreshControls();
  updateStats(true);
});

$('checkpoint').addEventListener('change', () => {
  const checkpoint = checkpoints[$('checkpoint').value];
  if (!checkpoint) return;
  reset();
  // A bounded replay, not a snapshot or state injection. Rendering is skipped
  // during the seek; every physics/collision/net event still runs normally.
  while (!checkpoint.reached(game) && !terminals.has(game.state) && simulationSteps < 120 * 90) simulate(false);
  visualTime = game.time;
  if (terminals.has(game.state)) reportTerminal();
  else $('status').textContent = `${checkpoint.title} reached through ${simulationSteps} valid input steps. Paused for inspection.`;
  refreshControls();
  updateStats(true);
});

$('speed').addEventListener('change', () => { accumulator = 0; previous = performance.now(); });
window.addEventListener('resize', () => renderer.resize());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  running = false;
  accumulator = 0;
  $('status').textContent = terminals.has(game.state) ? $('status').textContent : 'Paused because this test page moved into the background.';
  refreshControls();
  updateStats(true);
});

function frame(now) {
  try {
    const elapsed = Math.max(0, Math.min((now - previous) / 1000, .1));
    previous = now;
    if (running) {
      accumulator += elapsed * Number($('speed').value);
      while (accumulator >= STEP && !terminals.has(game.state)) {
        simulate();
        accumulator -= STEP;
      }
      visualTime = game.time;
      if (terminals.has(game.state)) reportTerminal();
    } else if (terminals.has(game.state)) {
      visualTime += elapsed;
    }
    const beforeRender = performance.now();
    renderer.render(game, { scene: 'play', time: visualTime, reducedMotion: $('reduced-motion').checked });
    totalRenderMs += performance.now() - beforeRender;
    renderedFrames++;
    updateStats();
    requestAnimationFrame(frame);
  } catch (error) {
    running = false;
    $('error').hidden = false;
    $('error').textContent = `Replay error: ${error.stack || error}`;
    refreshControls();
  }
}

refreshControls();
updateStats(true);
requestAnimationFrame(frame);
