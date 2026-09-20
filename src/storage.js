import { progress } from './game.js';

export const SAVE_KEY = 'to-the-top:save:v1';
const MAX_DAILY_RECORDS = 35;
const modes = new Set(['classic', 'daily', 'zen']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const integer = value => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(finite(value))));
const emptyRecord = () => ({ progress: 0, score: 0, wins: 0, attempts: 0, bestTime: null });

function browserStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function defaults() {
  let reducedMotion = false;
  try { reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true; } catch { /* Browser preference is optional. */ }
  return {
    settings: { sound: false, autoSwim: false, reducedMotion },
    records: {},
    lastMode: 'classic',
  };
}

function validRecordKey(key) {
  if (key === 'classic' || key === 'zen') return true;
  if (typeof key !== 'string' || !/^daily:\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = key.slice(6);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function sanitizeRecord(value) {
  if (!isObject(value)) return null;
  const attempts = integer(value.attempts);
  const wins = Math.min(attempts, integer(value.wins));
  const bestTime = wins > 0 && typeof value.bestTime === 'number'
    && Number.isFinite(value.bestTime) && value.bestTime >= 0 ? value.bestTime : null;
  return {
    progress: Math.max(0, Math.min(100, finite(value.progress))),
    score: integer(value.score),
    wins,
    attempts,
    bestTime,
  };
}

function sanitizeRecords(value) {
  const records = {};
  if (!isObject(value)) return records;
  const keys = Object.keys(value).filter(validRecordKey).sort().reverse();
  let dailyCount = 0;
  for (const key of keys) {
    const record = sanitizeRecord(value[key]);
    if (!record) continue;
    if (key.startsWith('daily:') && dailyCount++ >= MAX_DAILY_RECORDS) continue;
    records[key] = record;
  }
  return records;
}

function sanitizeData(value) {
  const data = defaults();
  if (!isObject(value)) return data;
  if (isObject(value.settings)) {
    for (const key of Object.keys(data.settings)) {
      if (typeof value.settings[key] === 'boolean') data.settings[key] = value.settings[key];
    }
  }
  data.records = sanitizeRecords(value.records);
  if (modes.has(value.lastMode)) data.lastMode = value.lastMode;
  return data;
}

/** Load only validated preferences and local records; unavailable storage is harmless. */
export function loadSave(storage = browserStorage()) {
  try {
    const serialized = storage?.getItem(SAVE_KEY);
    if (typeof serialized !== 'string' || serialized.length > 256_000) return defaults();
    const value = JSON.parse(serialized);
    if (isObject(value) && value.version !== undefined && value.version !== 1) return defaults();
    return sanitizeData(value);
  } catch {
    return defaults();
  }
}

/** Persist a versioned snapshot without throwing for blocked storage or quota limits. */
export function saveData(data, storage = browserStorage()) {
  try {
    if (!storage || typeof storage.setItem !== 'function' || !isObject(data)) return false;
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, ...sanitizeData(data) }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Record a completed attempt. Progress and score belong to the same best run,
 * ranked by whole percent reached, then bubbles. Wins/attempts are totals;
 * bestTime is the fastest successful run regardless of its bubble count.
 * Daily courses use their starting UTC date, supplied by the caller in recordKey.
 */
export function recordRun(data, game, recordKey = game?.mode) {
  if (!isObject(data) || !isObject(game) || !validRecordKey(recordKey)) {
    return { isBest: false, record: null };
  }
  data.records = sanitizeRecords(data.records);
  const previous = data.records[recordKey];
  const keyMode = recordKey.startsWith('daily:') ? 'daily' : recordKey;
  if ((game.state !== 'win' && game.state !== 'lose') || game.mode !== keyMode) {
    return { isBest: false, record: previous || null };
  }

  const won = game.state === 'win';
  const reached = game.player && Number.isFinite(game.player.y) ? finite(progress(game)) : 0;
  const runProgress = won ? 100 : Math.max(0, Math.min(99, Math.floor(reached * 100)));
  const score = integer(game.score);
  const isBest = !previous || runProgress > previous.progress
    || (runProgress === previous.progress && score > previous.score);
  const record = previous || emptyRecord();
  if (isBest) {
    record.progress = runProgress;
    record.score = score;
  }
  record.attempts = Math.min(Number.MAX_SAFE_INTEGER, record.attempts + 1);
  if (won) {
    record.wins = Math.min(record.attempts, record.wins + 1);
    if (typeof game.time === 'number' && Number.isFinite(game.time) && game.time >= 0) {
      record.bestTime = record.bestTime === null ? game.time : Math.min(record.bestTime, game.time);
    }
  }
  data.records[recordKey] = record;
  data.records = sanitizeRecords(data.records);
  return { isBest, record: data.records[recordKey] || record };
}
