import { createGame, step, progress, WIDTH } from '../src/game.js';

// This file is a browser-only fixture. The guard also keeps Node's automatic
// test-file discovery harmless; browser results are never claimed by npm test.
if (typeof window !== 'undefined' && typeof document !== 'undefined') setup();

function setup() {
  const $ = id => document.getElementById(id);
  const iframe = $('app');
  const checked = new Set();
  let active = false;
  let cancelRun = null;
  let lastResult = null;
  let startZone = '';

  const app = () => iframe.contentDocument;
  const element = id => {
    const found = app().getElementById(id);
    if (!found) throw new Error(`The real UI is missing #${id}.`);
    return found;
  };
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  const scene = () => element('stage').dataset.scene;
  const text = id => element(id).textContent.trim();
  const log = message => {
    $('log').textContent += `${message}\n`;
    $('log').scrollTop = $('log').scrollHeight;
  };
  const status = (message, state) => {
    $('status').textContent = message;
    $('status').dataset.state = state;
  };
  const check = message => {
    if (checked.has(message)) return;
    checked.add(message);
    const item = document.createElement('li');
    item.textContent = message;
    $('checks').append(item);
  };

  async function ready() {
    const deadline = performance.now() + 12_000;
    while (performance.now() < deadline) {
      const doc = app();
      // main.js changes the initially focusable canvas to tabindex=-1 only
      // after its UI listeners have been installed and the title is ready.
      if (doc?.getElementById('game')?.tabIndex === -1
        && doc.getElementById('stage')?.dataset.scene === 'title') return;
      if (doc?.getElementById('load-error')?.hidden === false) throw new Error('The real game reported a startup error.');
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    throw new Error('Timed out waiting for the real game to initialize.');
  }

  const nextFrame = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      iframe.contentWindow.cancelAnimationFrame(frameId);
      reject(new Error('The browser stopped rendering during the control checks. Keep the tab visible.'));
    }, 3000);
    const frameId = iframe.contentWindow.requestAnimationFrame(now => {
      clearTimeout(timer);
      resolve(now);
    });
  });

  function key(code, down, target = element('game')) {
    const event = new iframe.contentWindow.KeyboardEvent(down ? 'keydown' : 'keyup', {
      code, key: code === 'Space' ? ' ' : code, bubbles: true, cancelable: true,
    });
    target.dispatchEvent(event);
  }

  function releaseKeys() {
    for (const code of ['Space', 'ArrowLeft', 'ArrowRight', 'Escape']) key(code, false);
  }

  function setting(id, value) {
    const input = element(id);
    input.checked = value;
    input.dispatchEvent(new iframe.contentWindow.Event('change', { bubbles: true }));
    require(input.checked === value, `${id} did not retain its requested value.`);
  }

  function closeDialog(id) {
    element(id).querySelector('.primary-button.close-dialog').click();
    require(!element(id).open, `${id} did not close through its button.`);
  }

  async function controls() {
    element('how-to').click();
    require(element('help-dialog').open, 'How to play did not open.');
    closeDialog('help-dialog');
    check('Help opens and closes through the real controls.');

    element('settings-menu').click();
    require(element('settings-dialog').open, 'Settings did not open.');
    setting('setting-sound', false);
    setting('setting-auto', false);
    closeDialog('settings-dialog');
    require(element('sound').getAttribute('aria-pressed') === 'false', 'Sound control does not reflect the preference.');
    require(text('control-caption').includes('HOLD TO SWIM'), 'Manual swimming preference was not applied.');
    check('Settings apply sound off and manual swimming.');

    app().querySelector('[data-mode="classic"]').click();
    require(app().querySelector('[data-mode="classic"]').getAttribute('aria-pressed') === 'true', 'Classic selection failed.');
    element('play').click();
    require(scene() === 'play', 'Play did not start the real game.');
    require(text('depth-label') === '0%' && text('score') === '0', 'A new run did not begin at zero.');
    require(!element('first-hint').hidden, 'Manual swimming should wait for the first input.');
    startZone = text('zone-name');
    check('Classic starts at 0% with the first-input hint.');

    element('pause').click();
    require(scene() === 'paused' && !element('pause-screen').hidden, 'Pause button did not show the pause screen.');
    const frozen = `${text('depth-label')}/${text('score')}`;
    for (let index = 0; index < 4; index++) await nextFrame();
    require(`${text('depth-label')}/${text('score')}` === frozen, 'The visible HUD changed while paused.');
    element('pause-settings').click();
    require(element('settings-dialog').open && scene() === 'paused', 'Settings did not preserve the paused scene.');
    closeDialog('settings-dialog');
    element('resume').click();
    require(scene() === 'play', 'Resume did not return to the game.');
    key('Escape', true);
    key('Escape', false);
    require(scene() === 'paused', 'Escape did not pause the game.');
    key('Escape', true, app().activeElement);
    key('Escape', false, app().activeElement);
    require(scene() === 'play', 'Escape did not resume the game.');
    require(app().activeElement === element('game'), 'The resumed game did not focus its canvas.');
    check('Pause, pause settings, resume, and Escape work.');
    log('Real controls passed. Beginning keyboard-only swim.');
  }

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

  function playthrough() {
    return new Promise((resolveRun, rejectRun) => {
      // Independent predictor only. This never reads or alters main.js's game.
      const predictor = createGame({ mode: 'classic', seed: 7 });
      let previousTime;
      let axis = 0;
      let frameId;
      let lastCheckpoint = -1;
      let lastZone = '';
      let settled = false;
      const timer = setTimeout(() => finish(new Error('The real UI did not finish within 100 seconds.')), 100_000);

      function finish(error, result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        iframe.contentWindow.cancelAnimationFrame(frameId);
        releaseKeys();
        cancelRun = null;
        if (error) rejectRun(error); else resolveRun(result);
      }
      cancelRun = () => finish(new Error('Playthrough stopped by the operator.'));

      function frame(now) {
        try {
          require(!document.hidden && !app().hidden, 'Tab visibility changed; the game correctly paused. Run again with this tab visible.');
          require(element('load-error').hidden, 'The real game displayed its runtime error screen.');
          if (scene() === 'result') {
            const result = {
              title: text('result-title').replace(/\s+/g, ' '),
              progress: text('result-progress'),
              score: Number(text('result-bubbles')),
              time: text('result-time'),
              record: text('result-record'),
            };
            require(result.title.includes('HELLO,') && result.title.includes('WORLD.'), `The actual game lost: ${result.progress}, ${result.score} bubbles. ${text('result-copy')}`);
            require(result.progress === '100%', `Winning result reported ${result.progress} ascent.`);
            require(Number.isInteger(result.score) && result.score > 0, 'Winning result has no valid bubble score.');
            require(/^\d+\.\ds$/.test(result.time), 'Winning result has no valid elapsed time.');
            require(!element('retry').disabled && element('retry').getClientRects().length > 0, 'Retry control is not available on the result screen.');
            require(result.record.includes('PERSONAL BEST'), 'Result did not report a personal record.');
            check('Real keyboard play reaches the 100% winning screen.');
            check('Result shows bubbles, elapsed time, record, and retry.');
            log(`WIN — actual UI: ${result.progress}, ${result.score} bubbles, ${result.time}.`);
            log(`Predictor finished ${predictor.state} with ${predictor.score} bubbles; it did not set the UI result.`);
            finish(null, result);
            return;
          }
          require(scene() === 'play', `The game changed to ${scene()} before finishing. Focus/visibility changes can pause the run.`);
          require(app().activeElement === element('game'), 'Canvas lost keyboard focus during the run.');

          if (previousTime === undefined) {
            // This callback runs after the game's own rAF. Start both streams
            // at the same timestamp, then model each prior frame's input.
            previousTime = now;
            key('Space', true);
          } else {
            const dt = Math.min((now - previousTime) / 1000, 0.05);
            previousTime = now;
            step(predictor, { axis, swim: true, targetX: null }, dt);
            const dx = trailTarget(predictor) - predictor.player.x;
            const nextAxis = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
            if (nextAxis !== axis) {
              if (axis !== 0) key(axis < 0 ? 'ArrowLeft' : 'ArrowRight', false);
              if (nextAxis !== 0) key(nextAxis < 0 ? 'ArrowLeft' : 'ArrowRight', true);
              axis = nextAxis;
            }
          }

          const actualProgress = parseInt(text('depth-label'), 10);
          const checkpoint = Math.floor(actualProgress / 20);
          const zone = text('zone-name');
          if (checkpoint !== lastCheckpoint || zone !== lastZone) {
            lastCheckpoint = checkpoint; lastZone = zone;
            log(`${actualProgress}% · ${zone} · ${text('score')} bubbles · ${element('hearts').getAttribute('aria-label')}`);
          }
          const difference = Math.abs(actualProgress - progress(predictor) * 100);
          require(difference < 6, `Predictor diverged from the visible HUD by ${difference.toFixed(1)}%; stopped without forcing an outcome.`);
          frameId = iframe.contentWindow.requestAnimationFrame(frame);
        } catch (error) {
          finish(error);
        }
      }
      frameId = iframe.contentWindow.requestAnimationFrame(frame);
    });
  }

  function fail(error) {
    try { if (scene() === 'play') element('pause').click(); } catch { /* The failure can be a missing frame. */ }
    log(`FAIL — ${error.message}`);
    status(error.message, 'fail');
  }

  $('run').addEventListener('click', async () => {
    if (active) return;
    active = true; lastResult = null; checked.clear();
    $('checks').replaceChildren(); $('log').textContent = ''; $('result').hidden = true;
    $('run').disabled = true; $('verify').disabled = true; $('stop').disabled = true;
    status('Checking controls, then swimming the full route…', 'running');
    try {
      // Use normal page navigation to establish a fresh title screen on reruns.
      if (scene() !== 'title') {
        iframe.contentWindow.location.reload();
        await new Promise(resolve => iframe.addEventListener('load', resolve, { once: true }));
      }
      await ready();
      await controls();
      $('stop').disabled = false;
      lastResult = await playthrough();
      $('outcome').textContent = lastResult.title;
      $('ascent').textContent = lastResult.progress;
      $('bubbles').textContent = String(lastResult.score);
      $('time').textContent = lastResult.time;
      $('result').hidden = false;
      $('verify').disabled = false;
      status('PASS — the real game reached its winning screen. Use “Verify retry and saved record” for the remaining checks.', 'pass');
    } catch (error) { fail(error); }
    finally { active = false; $('run').disabled = false; $('stop').disabled = true; }
  });

  $('stop').addEventListener('click', () => cancelRun?.());

  $('verify').addEventListener('click', async () => {
    if (active || !lastResult) return;
    active = true; $('run').disabled = true; $('verify').disabled = true;
    status('Verifying retry and record persistence through the real UI…', 'running');
    try {
      require(scene() === 'result', 'The result screen is no longer open. Run the playthrough again.');
      element('retry').click();
      require(scene() === 'play', 'The native Retry button did not begin a new run.');
      require(text('depth-label') === '0%' && text('score') === '0', 'Retry did not reset progress and bubbles.');
      require(text('zone-name') === startZone && element('hearts').getAttribute('aria-label') === '3 lives remaining', 'Retry did not restore the starting zone and hearts.');
      require(!element('first-hint').hidden, 'Retry did not wait for the first swimming input.');
      check('Retry restores 0%, zero bubbles, three hearts, and the opening zone.');
      element('pause').click(); element('quit').click();
      require(scene() === 'title', 'Back to menu did not return to the title.');
      require(/BEST 100%/.test(text('best-menu')), 'The title did not show the completed 100% record.');
      const beforeReload = text('best-menu');
      iframe.contentWindow.location.reload();
      await new Promise(resolve => iframe.addEventListener('load', resolve, { once: true }));
      await ready();
      require(text('best-menu') === beforeReload, 'The personal record did not survive a normal page reload.');
      require(app().querySelector('[data-mode="classic"]').getAttribute('aria-pressed') === 'true', 'The selected Classic mode did not survive reload.');
      check('Back to menu shows the record, which persists after a page reload.');
      log(`Retry reset verified. Reloaded menu: ${text('best-menu')}.`);
      status('PASS — full UI victory, result, retry, menu return, and saved record verified.', 'pass');
    } catch (error) { fail(error); }
    finally { active = false; $('run').disabled = false; }
  });

  ready().then(() => {
    $('run').disabled = false;
    status('Ready. Start the full UI playthrough when this tab is visible.', 'idle');
  }).catch(fail);
}
