import { createGame, step, progress, getZone, WIDTH } from './game.js';
import { Renderer } from './renderer.js';
import { GameAudio } from './audio.js';
import { loadSave, saveData, recordRun } from './storage.js';

const $ = id => document.getElementById(id);
const canvas = $('game');
const renderer = new Renderer(canvas);
const audio = new GameAudio();
const save = loadSave();
let mode = save.lastMode;
let game = createGame();
let scene = 'title';
let started = false;
let inputArmed = false;
let resultSaved = false;
let endDelay = 0;
let currentRecordKey = 'classic';
let last = 0;
let ambientTime = 0;
let renderTime = 0;
let hudStamp = 0;
let lastHearts = '';
const keys = new Set();
const pointer = { id: null, startX: 0, fishX: 0, targetX: null };

function dateKey() { return new Date().toISOString().slice(0, 10); }
function recordKey() { return mode === 'daily' ? `daily:${dateKey()}` : mode; }
function announce(message) { $('announcement').textContent = message; }
function persist() { saveData(save); }
function clearInput() {
  keys.clear();
  if (pointer.id !== null && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
  pointer.id = null; pointer.targetX = null;
}
function showScene(next) {
  scene = next;
  $('stage').dataset.scene = next;
  $('menu').hidden = next !== 'title';
  $('hud').hidden = !['play', 'paused'].includes(next);
  $('pause-screen').hidden = next !== 'paused';
  $('result-screen').hidden = next !== 'result';
  $('frame-state').textContent = next === 'title' ? 'DIVE IN / BREAK FREE' : next === 'paused' ? 'TAKE YOUR TIME' : mode === 'daily' ? `DAILY / ${dateKey()}` : mode === 'zen' ? 'EASY TIDE / YOUR PACE' : 'CLASSIC / THE GREAT ESCAPE';
  // Covered controls must leave the keyboard order as well as the visual scene.
  canvas.tabIndex = next === 'play' ? 0 : -1;
  $('hud').inert = next !== 'play';
}
function refreshMenu() {
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('mode-description').textContent = mode === 'daily' ? `A fresh shared route · ${dateKey()} UTC` : mode === 'zen' ? 'Five hearts. A gentler chase. All the wonder.' : 'Three hunters. One way out.';
  const best = save.records[recordKey()];
  $('best-menu').textContent = best ? `BEST ${best.progress}% · ${best.score} BUBBLES` : 'YOUR FIRST ESCAPE AWAITS';
}
function refreshSettings() {
  $('setting-sound').checked = save.settings.sound;
  $('setting-auto').checked = save.settings.autoSwim;
  $('setting-motion').checked = save.settings.reducedMotion;
  $('sound').setAttribute('aria-pressed', String(save.settings.sound));
  $('sound').setAttribute('aria-label', `Turn sound ${save.settings.sound ? 'off' : 'on'}`);
  $('sound').querySelector('use').setAttribute('href', save.settings.sound ? '#i-sound' : '#i-mute');
  $('sound-caption').textContent = save.settings.sound ? 'SOUND ON' : 'SOUND OFF';
  $('control-caption').textContent = save.settings.autoSwim ? 'AUTO-SWIM · DRAG OR ← → TO STEER' : 'HOLD TO SWIM · DRAG TO STEER';
}
function start() {
  clearInput();
  const seed = mode === 'daily' ? dateKey() : mode === 'zen' ? 19 : 7;
  game = createGame({ mode, seed });
  currentRecordKey = recordKey();
  inputArmed = save.settings.autoSwim;
  started = true; resultSaved = false; endDelay = 0;
  lastHearts = ''; hudStamp = 0;
  renderer.reset(); audio.reset();
  audio.setEnabled(save.settings.sound);
  showScene('play'); refreshHUD();
  canvas.focus({ preventScroll: true });
  announce('Swim up. Hold Space or Up, and steer with Left and Right.');
}
function pause() {
  if (scene !== 'play') return;
  clearInput(); showScene('paused'); audio.suspend();
  $('resume').focus({ preventScroll: true });
  announce('Game paused.');
}
function resume() {
  if (scene !== 'paused') return;
  clearInput(); showScene('play'); audio.setEnabled(save.settings.sound);
  canvas.focus({ preventScroll: true });
  announce('Back in the water.');
}
function home() {
  clearInput(); started = false; renderer.reset();
  showScene('title'); refreshMenu();
  $('play').focus({ preventScroll: true });
}
function showDialog(id) {
  if (scene === 'play') pause();
  clearInput(); $(id).showModal();
}
function endRun() {
  if (resultSaved) return;
  resultSaved = true; clearInput();
  const outcome = recordRun(save, game, currentRecordKey);
  persist();
  const won = game.state === 'win';
  $('result-eyebrow').textContent = won ? 'SMALL FISH. GREAT ESCAPE.' : progress(game) > 0.7 ? 'SO CLOSE, LITTLE FISH' : 'THERE’S A LITTLE HERO IN YOU';
  $('result-title').innerHTML = won ? 'HELLO,<br>WORLD.' : 'ONE MORE<br>DEEP BREATH.';
  $('result-copy').textContent = won ? 'Three hunters outsmarted. A whole ocean ahead. Just… keep an eye on that seagull.' : game.deathReason === 'hazards' ? 'A few too many close encounters. Follow the bubbles and give those creatures a little space.' : 'The food chain caught up. Keep swimming, and use the nets to leave big trouble behind.';
  $('result-progress').textContent = `${won ? 100 : Math.floor(progress(game) * 100)}%`;
  $('result-bubbles').textContent = game.score;
  $('result-time').textContent = `${game.time.toFixed(1)}s`;
  $('result-record').textContent = outcome.isBest ? 'A NEW PERSONAL BEST. Nicely swum.' : `PERSONAL BEST · ${outcome.record.progress}% · ${outcome.record.score} bubbles`;
  showScene('result'); $('retry').focus({ preventScroll: true });
  announce(won ? `You escaped! ${game.score} bubbles in ${game.time.toFixed(1)} seconds.` : `Run over. ${Math.floor(progress(game) * 100)} percent of the ascent, ${game.score} bubbles. Try again.`);
}
function refreshHUD() {
  const zone = getZone(game);
  $('zone-name').textContent = zone.name.toUpperCase();
  document.querySelectorAll('[data-zone]').forEach(item => item.classList.toggle('active', Number(item.dataset.zone) === zone.index));
  const heartsKey = `${game.hearts}/${game.maxHearts}`;
  if (lastHearts !== heartsKey) {
    lastHearts = heartsKey;
    $('hearts').innerHTML = Array.from({ length: game.maxHearts }, (_, i) => `<svg aria-hidden="true" class="${i < game.hearts ? '' : 'empty'}"><use href="#i-heart"/></svg>`).join('');
    $('hearts').setAttribute('aria-label', `${game.hearts} lives remaining`);
  }
  $('score').textContent = game.score;
  const pct = Math.floor(progress(game) * 100);
  $('depth-label').textContent = `${pct}%`;
  $('depth-fill').style.height = `${pct}%`;
  $('depth-fish').style.bottom = `${pct}%`;
  $('banner').textContent = inputArmed && game.banner.time > 0 ? game.banner.text : '';
  $('first-hint').hidden = inputArmed;
  $('power-status').textContent = game.boost > 0 ? `BOOST ${Math.ceil(game.boost)}s` : game.shield > 0 ? `SHIELD ${Math.ceil(game.shield)}s` : `${game.nets.filter(net => net.caught).length} / 3 HUNTERS TRAPPED`;
  const danger = game.predator.y - game.player.y < 170 && game.predator.status === 'chasing' && game.state === 'play';
  $('chase-status').classList.toggle('danger', danger);
  $('chase-status').textContent = game.state === 'winning' ? 'THE SURFACE IS YOURS' : danger ? 'HUNTER CLOSE · SWIM!' : 'KEEP SWIMMING';
}

canvas.addEventListener('pointerdown', event => {
  if (scene !== 'play' || pointer.id !== null || !event.isPrimary || event.button !== 0) return;
  event.preventDefault(); canvas.focus({ preventScroll: true });
  pointer.id = event.pointerId;
  pointer.startX = event.clientX;
  pointer.fishX = game.player.x;
  pointer.targetX = game.player.x;
  canvas.setPointerCapture(event.pointerId);
  inputArmed = true;
  audio.setEnabled(save.settings.sound);
});
canvas.addEventListener('pointermove', event => {
  if (event.pointerId !== pointer.id) return;
  event.preventDefault();
  const scale = WIDTH / canvas.getBoundingClientRect().width;
  pointer.targetX = pointer.fishX + (event.clientX - pointer.startX) * scale;
});
function releasePointer(event) {
  if (event.pointerId !== pointer.id) return;
  pointer.id = null; pointer.targetX = null;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);
canvas.addEventListener('contextmenu', event => event.preventDefault());
const gameplayKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW', 'Space']);
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]')) return;
  if (event.code === 'Tab' && scene === 'play') { pause(); return; }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (event.repeat) return;
    if (scene === 'play') { event.preventDefault(); pause(); }
    else if (scene === 'paused') { event.preventDefault(); resume(); }
    return;
  }
  if (scene !== 'play' || !gameplayKeys.has(event.code)) return;
  // Keep native keyboard interaction on buttons; the canvas owns gameplay keys.
  if (event.target.closest?.('button,input,a')) return;
  event.preventDefault(); keys.add(event.code);
  if (['ArrowUp', 'KeyW', 'Space'].includes(event.code)) inputArmed = true;
});
document.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); audio.suspend(); } });
window.addEventListener('pagehide', () => { clearInput(); persist(); });
new ResizeObserver(() => renderer.resize()).observe(canvas);
window.addEventListener('resize', () => { renderer.resize(); if (scene === 'play') pause(); });
const orientationGuard = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
function checkOrientation() {
  if (orientationGuard.matches) pause();
  document.querySelector('.game-layout').inert = orientationGuard.matches;
  document.querySelector('.site-header').inert = orientationGuard.matches;
}
orientationGuard.addEventListener('change', checkOrientation);
$('play').addEventListener('click', start);
$('retry').addEventListener('click', start);
$('pause').addEventListener('click', pause);
$('resume').addEventListener('click', resume);
$('quit').addEventListener('click', home);
$('result-home').addEventListener('click', home);
$('reload').addEventListener('click', () => location.reload());
for (const id of ['settings-top', 'settings-menu', 'pause-settings']) $(id).addEventListener('click', () => showDialog('settings-dialog'));
for (const id of ['help-top', 'how-to']) $(id).addEventListener('click', () => showDialog('help-dialog'));
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => { if (scene === 'paused') $('resume').focus(); }));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode; save.lastMode = mode; persist(); refreshMenu();
}));
for (const [id, key] of [['setting-sound', 'sound'], ['setting-auto', 'autoSwim'], ['setting-motion', 'reducedMotion']]) {
  $(id).addEventListener('change', event => {
    save.settings[key] = event.target.checked;
    if (key === 'sound') audio.setEnabled(save.settings.sound);
    if (key === 'autoSwim' && save.settings.autoSwim) inputArmed = true;
    persist(); refreshSettings();
  });
}
$('sound').addEventListener('click', () => {
  save.settings.sound = !save.settings.sound;
  audio.setEnabled(save.settings.sound); persist(); refreshSettings();
  if (scene === 'play') canvas.focus({ preventScroll: true });
});
function fail(error) {
  console.error('The game stopped:', error);
  clearInput(); audio.suspend(); $('load-error').hidden = false;
  $('reload').focus();
}
window.addEventListener('error', event => fail(event.error || event.message));
window.addEventListener('unhandledrejection', event => fail(event.reason));
function frame(now) {
  const dt = Math.min((now - (last || now)) / 1000, 0.05);
  last = now;
  try {
    if (!document.hidden) {
      ambientTime += dt;
      if (scene === 'play' && inputArmed) {
        const axis = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
        const swim = save.settings.autoSwim || pointer.id !== null || keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');
        step(game, { axis, swim, targetX: pointer.targetX }, dt);
        renderer.handleEvents(game.events);
        for (const event of game.events) audio.event(event);
        audio.update(game.time, getZone(game).index);
        if (game.state === 'win' || game.state === 'lose') {
          endDelay += dt;
          if (endDelay > (game.state === 'win' ? 2.6 : 0.6)) endRun();
        }
      }
      if (scene !== 'paused') renderTime = ambientTime;
      renderer.render(game, { scene: scene === 'title' ? 'title' : 'play', time: renderTime, reducedMotion: save.settings.reducedMotion });
      if (started && now - hudStamp > 90) { refreshHUD(); hudStamp = now; }
    }
    requestAnimationFrame(frame);
  } catch (error) { fail(error); }
}
refreshMenu(); refreshSettings(); showScene('title'); renderer.resize(); checkOrientation();
requestAnimationFrame(frame);
