import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, SURFACE_Y } from '../src/game.js';
import { loadSave, saveData, recordRun, SAVE_KEY } from '../src/storage.js';

function memoryStorage(initial) {
  const entries = new Map(initial === undefined ? [] : [[SAVE_KEY, initial]]);
  return {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

function run({ reached = 0.5, score = 10, time = 20, mode = 'classic', state = 'lose' } = {}) {
  const game = createGame({ mode });
  game.player.y -= (game.player.y - SURFACE_Y) * reached;
  Object.assign(game, { score, time, state });
  return game;
}

test('missing, malformed, unsupported, and blocked storage return fresh usable defaults', () => {
  const expected = { settings: { sound: false, autoSwim: false, reducedMotion: false }, records: {}, lastMode: 'classic' };
  for (const initial of [undefined, '{broken', 'null', '[]', '42', '{"version":9}', 'x'.repeat(256_001)]) {
    assert.deepEqual(loadSave(memoryStorage(initial)), expected);
  }
  assert.deepEqual(loadSave({ getItem() { throw new Error('SecurityError'); } }), expected);
  const first = loadSave(null);
  first.settings.sound = true;
  first.records.classic = {};
  assert.deepEqual(loadSave(null), expected);
});

test('saved settings round trip; only strict booleans and recognized modes are accepted', () => {
  const storage = memoryStorage();
  const data = loadSave(storage);
  Object.assign(data.settings, { sound: true, autoSwim: true, reducedMotion: true });
  data.lastMode = 'zen';
  assert.equal(saveData(data, storage), true);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).version, 1);
  assert.deepEqual(loadSave(storage), data);
  const malformed = loadSave(memoryStorage(JSON.stringify({
    settings: { sound: 'true', autoSwim: 1, reducedMotion: null, injected: true },
    lastMode: 'unknown',
  })));
  assert.deepEqual(malformed.settings, { sound: false, autoSwim: false, reducedMotion: false });
  assert.equal(malformed.lastMode, 'classic');
});

test('record validation bounds numbers and discards prototype and invalid date keys', () => {
  const data = loadSave(memoryStorage(`{
    "records": {
      "classic": { "progress": 150, "score": -1, "wins": 8, "attempts": 2, "bestTime": -4 },
      "zen": { "progress": "40", "score": 12.9, "wins": 0, "attempts": 4, "bestTime": 15 },
      "daily:2026-02-30": {}, "daily:2026-09-20": {}, "daily:bad": {},
      "__proto__": {"polluted": true}, "constructor": {}, "alien": {}, "daily:2026-09-19": []
    }
  }`));
  assert.deepEqual(Object.keys(data.records).sort(), ['classic', 'daily:2026-09-20', 'zen']);
  assert.deepEqual(data.records.classic, { progress: 100, score: 0, wins: 2, attempts: 2, bestTime: null });
  assert.deepEqual(data.records.zen, { progress: 0, score: 12, wins: 0, attempts: 4, bestTime: null });
  assert.equal({}.polluted, undefined);
});

test('best runs are ranked by progress then bubbles without replacing a stronger run', () => {
  const data = loadSave(null);
  assert.equal(recordRun(data, run({ reached: 0.6, score: 10 }), 'classic').isBest, true);
  assert.equal(recordRun(data, run({ reached: 0.5, score: 90 }), 'classic').isBest, false);
  assert.equal(data.records.classic.score, 10);
  assert.equal(recordRun(data, run({ reached: 0.6, score: 15 }), 'classic').isBest, true);
  assert.equal(recordRun(data, run({ reached: 0.6, score: 15 }), 'classic').isBest, false);
  assert.equal(recordRun(data, run({ reached: 0.7, score: 2 }), 'classic').isBest, true);
  assert.deepEqual(data.records.classic, { progress: 70, score: 2, wins: 0, attempts: 5, bestTime: null });
});

test('only victories count wins and fastest times; nonterminal or mismatched modes do not count', () => {
  const data = loadSave(null);
  assert.equal(recordRun(data, run({ state: 'play' }), 'classic').record, null);
  assert.equal(recordRun(data, run({ mode: 'zen' }), 'classic').record, null);
  assert.equal(recordRun(data, run({ state: 'winning' }), 'classic').record, null);
  recordRun(data, run({ state: 'win', score: 90, time: 52 }), 'classic');
  recordRun(data, run({ state: 'lose', reached: 0.999, score: 100, time: 1 }), 'classic');
  recordRun(data, run({ state: 'win', score: 20, time: 49 }), 'classic');
  recordRun(data, run({ state: 'win', score: 80, time: 60 }), 'classic');
  assert.deepEqual(data.records.classic, { progress: 100, score: 90, wins: 3, attempts: 4, bestTime: 49 });
});

test('daily records keep only the latest 35 valid UTC dates, independently of classic and zen', () => {
  const data = loadSave(null);
  recordRun(data, run(), 'classic');
  recordRun(data, run({ mode: 'zen' }), 'zen');
  for (let day = 1; day <= 40; day++) {
    const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
    recordRun(data, run({ mode: 'daily', score: day }), `daily:${date}`);
  }
  const daily = Object.keys(data.records).filter(key => key.startsWith('daily:')).sort();
  assert.equal(daily.length, 35);
  assert.equal(daily[0], 'daily:2026-01-06');
  assert.equal(daily.at(-1), 'daily:2026-02-09');
  assert.equal(Object.keys(data.records).length, 37);
  const storage = memoryStorage();
  assert.equal(saveData(data, storage), true);
  assert.deepEqual(loadSave(storage).records, data.records);
  assert.equal(recordRun(data, run({ mode: 'daily' }), 'daily:2026-02-30').record, null);
});

test('quota and denied-write failures are reported without breaking a game session', () => {
  const data = loadSave(null);
  const denied = { setItem() { throw new Error('QuotaExceededError'); } };
  assert.equal(saveData(data, denied), false);
  assert.equal(saveData(data, null), false);
  assert.equal(saveData(null, memoryStorage()), false);
  assert.doesNotThrow(() => recordRun(data, run(), 'classic'));
  assert.equal(data.records.classic.attempts, 1);
});
