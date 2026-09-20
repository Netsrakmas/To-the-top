import { WIDTH, HEIGHT, WORLD_HEIGHT } from './game.js';

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (v) => `rgb(${v.join(',')})`;
const INK = '#062437';

function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

function seedRandom(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

/** All artwork is original Canvas geometry. Simulation remains in game.js. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.particles = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
    this.lastTime = null;
    const random = seedRandom(83071);
    this.motes = Array.from({ length: 40 }, () => ({ x: random() * WIDTH, y: random() * HEIGHT, r: .5 + random() * 1.3, speed: 4 + random() * 13, phase: random() * TAU }));
    this.shoal = Array.from({ length: 15 }, () => ({ x: random() * WIDTH, y: random() * HEIGHT, size: 2 + random() * 3, phase: random() * TAU }));
    this.resize();
  }

  resize() {
    const box = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round((box.width || WIDTH) * dpr));
    const height = Math.max(1, Math.round((box.height || HEIGHT) * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
    this.ctx.setTransform(width / WIDTH, 0, 0, height / HEIGHT, 0, 0);
  }

  reset() { this.particles.length = 0; this.rings.length = 0; this.shake = 0; this.flash = 0; }

  handleEvents(events = []) {
    for (const event of events) {
      const type = event.type;
      const colors = type === 'hurt' || type === 'lose' ? ['#ff7083', '#ffb19c']
        : type === 'boost' ? ['#ffc25d', '#ffe2a5'] : ['#72eadb', '#c7fffa'];
      const count = type === 'collect' ? 5 : type === 'lose' ? 26 : 15;
      if (Number.isFinite(event.x) && Number.isFinite(event.y)) {
        for (let i = 0; i < count; i++) {
          const angle = i / count * TAU;
          const speed = type === 'collect' ? 30 + i * 7 : 65 + (i % 5) * 24;
          this.particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .5 + (i % 4) * .1, max: .8, r: type === 'collect' ? 2 : 2 + i % 3, color: colors[i % 2] });
        }
        if (type !== 'collect') this.rings.push({ x: event.x, y: event.y, life: .7, color: colors[0] });
      }
      if (type === 'hurt') { this.shake = 6; this.flash = .18; }
      if (type === 'net') this.shake = 4;
      if (type === 'lose') this.shake = 10;
    }
    if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
  }

  render(game, { scene = 'play', time = 0, reducedMotion = false } = {}) {
    const ctx = this.ctx;
    const dt = this.lastTime === null ? 0 : clamp(time - this.lastTime, 0, .05);
    this.lastTime = time;
    const t = reducedMotion ? 0 : time;
    const title = scene === 'title' || !game;
    const camera = title ? WORLD_HEIGHT * .5 : game.cameraY;
    const depth = title ? .49 : clamp(camera / WORLD_HEIGHT);
    ctx.save();
    this.water(depth, t, camera, title);
    this.landscape(camera, t, depth, title);
    if (!title && camera < 120) this.surface(camera, t, game.state);

    if (title) {
      this.titleScene(t);
    } else {
      ctx.save();
      if (!reducedMotion && this.shake > .1) ctx.translate(Math.sin(time * 71) * this.shake, Math.cos(time * 57) * this.shake * .65);
      for (const caught of game.caught || []) {
        const y = caught.y - camera;
        if (y > -160 && y < HEIGHT + 180) {
          this.predator(caught.x, y, caught.size, caught.tier, t, true);
        }
      }
      for (const net of game.nets || []) {
        const y = net.y - camera;
        if (y > -100 && y < HEIGHT + 100) this.net(net, y, t);
      }
      for (const obstacle of game.obstacles || []) {
        const y = obstacle.y - camera;
        if (y > -100 && y < HEIGHT + 100) this.obstacle(obstacle, y, t);
      }
      for (const bubble of game.bubbles || []) {
        const y = bubble.y - camera;
        if (!bubble.got && y > -20 && y < HEIGHT + 20) this.bubble(bubble.x, y, bubble.r, t);
      }
      for (const pickup of game.pickups || []) {
        const y = pickup.y - camera;
        if (!pickup.got && y > -40 && y < HEIGHT + 40) this.pickup(pickup, y, t);
      }
      const predator = game.predator;
      if (predator && predator.status !== 'trapped') {
        const y = predator.y - camera;
        if (y > -160 && y < HEIGHT + 190) this.predator(predator.x, y, predator.size, predator.tier, t);
      }
      const p = game.player;
      if (p) {
        const y = p.y - camera;
        this.playerEffects(game, y, t);
        const heading = Math.atan2(p.hy ?? p.vy ?? -1, p.hx ?? p.vx ?? 0);
        ctx.save();
        if (p.invuln > 0 && !reducedMotion) ctx.globalAlpha = .62 + Math.sin(t * 30) * .28;
        this.fish(p.x, y, p.r, heading, t, false);
        ctx.restore();
      }
      this.effects(camera, dt, reducedMotion);
      ctx.restore();
      this.danger(game, reducedMotion ? 0 : t);
    }

    this.vignette(title);
    if (!reducedMotion && this.flash > 0) {
      ctx.fillStyle = `rgba(255,104,120,${this.flash})`; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    this.flash = Math.max(0, this.flash - dt);
    this.shake = Math.max(0, this.shake - dt * 23);
    ctx.restore();
  }

  water(depth, t, camera, title) {
    const ctx = this.ctx;
    const deep = [5, 19, 43], middle = [9, 49, 78], shallow = [14, 112, 132];
    const top = depth > .46 ? mix(middle, deep, (depth - .46) / .54) : mix(shallow, middle, depth / .46);
    const gradient = ctx.createLinearGradient(0, 0, WIDTH * .35, HEIGHT);
    gradient.addColorStop(0, rgb(top));
    gradient.addColorStop(.6, rgb(top.map(v => Math.round(v * .79))));
    gradient.addColorStop(1, rgb(top.map(v => Math.round(v * .58))));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Broad shafts preserve the quiet central route and reinforce upward motion.
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const x = 35 + i * 119 + Math.sin(t * .12 + i) * 15;
      const light = ctx.createLinearGradient(x, 0, x - 50, HEIGHT);
      light.addColorStop(0, `rgba(89,221,236,${title ? .08 : .08 * (1 - depth) + .012})`);
      light.addColorStop(1, 'rgba(89,221,236,0)');
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 17, 0); ctx.lineTo(x - 87, HEIGHT); ctx.lineTo(x - 175, HEIGHT); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (const mote of this.motes) {
      const y = ((mote.y - t * mote.speed - camera * .11) % HEIGHT + HEIGHT) % HEIGHT;
      const x = mote.x + Math.sin(t * .35 + mote.phase) * 9;
      ellipse(ctx, x, y, mote.r, mote.r, `rgba(159,228,237,${.09 + (1 - depth) * .1})`);
    }
    ctx.save(); ctx.globalAlpha = .14;
    for (const fish of this.shoal) {
      const x = ((fish.x + t * 9 + Math.sin(fish.phase) * 20) % (WIDTH + 40)) - 20;
      const y = ((fish.y - camera * .18) % HEIGHT + HEIGHT) % HEIGHT;
      ctx.fillStyle = '#6fb2c7';
      ellipse(ctx, x, y, fish.size * 1.4, fish.size * .47, '#6fb2c7');
      ctx.beginPath(); ctx.moveTo(x - fish.size, y); ctx.lineTo(x - fish.size * 2.1, y - fish.size * .65); ctx.lineTo(x - fish.size * 2.1, y + fish.size * .65); ctx.fill();
    }
    ctx.restore();
  }

  landscape(camera, t, depth, title) {
    const ctx = this.ctx;
    // Three restrained planes of organic basalt frame the playable lane.
    for (let side = 0; side < 2; side++) {
      ctx.save();
      if (side) { ctx.translate(WIDTH, 0); ctx.scale(-1, 1); }
      const offset = (camera * .12) % 360;
      ctx.fillStyle = depth > .6 ? '#0a203d' : '#103d55';
      ctx.beginPath(); ctx.moveTo(0, -50);
      for (let y = -400; y < HEIGHT + 400; y += 90) {
        const sy = y - offset;
        const x = 17 + Math.sin(y * .008 + side * 2) * 17 + Math.sin(y * .023) * 10;
        ctx.lineTo(x, sy); ctx.lineTo(x + 13, sy + 36);
      }
      ctx.lineTo(0, HEIGHT + 400); ctx.closePath(); ctx.fill();

      const gradient = ctx.createLinearGradient(0, 0, 59, 0);
      gradient.addColorStop(0, '#041d2f'); gradient.addColorStop(1, depth > .6 ? '#091b33' : '#082d43');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 0); ctx.bezierCurveTo(9, 73, 30, 75, 25, 116);
      ctx.lineTo(7, 166); ctx.lineTo(15, 277); ctx.lineTo(4, 313);
      ctx.bezierCurveTo(8, 373, 33, 396, 25, 449); ctx.lineTo(12, 496); ctx.lineTo(22, 580);
      ctx.bezierCurveTo(37, 620, 38, 664, 63, 760); ctx.lineTo(0, 760); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(82,159,174,.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(25, 448); ctx.lineTo(10, 465); ctx.lineTo(15, 502); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, 116); ctx.lineTo(8, 112); ctx.lineTo(4, 90); ctx.stroke();

      const base = title ? HEIGHT + 18 : HEIGHT + 90 - ((camera * .13 + side * 80) % 190);
      this.kelp(14, base, 145 + side * 45, t, side, '#0a4655');
      this.kelp(27, base + 25, 108, t, side + 1, '#0a3547');
      this.coral(11, HEIGHT - 19, 43, t, '#165569');
      ctx.restore();
    }
    if (title) {
      ctx.save(); ctx.globalAlpha = .38;
      this.coral(55, HEIGHT + 12, 90, t, '#167786');
      this.coral(WIDTH - 30, HEIGHT + 15, 83, t, '#147184');
      ctx.restore();
    }
  }

  kelp(x, y, h, t, phase, color) {
    const ctx = this.ctx;
    for (let i = 0; i < 4; i++) {
      const sway = Math.sin(t * .65 + phase + i) * 7;
      const height = h * (.56 + i * .15);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - 10 + i * 8, y - height * .3, x + 16 + sway + i * 3, y - height * .7, x + sway + i * 5, y - height);
      ctx.bezierCurveTo(x + 29 + sway + i * 3, y - height * .65, x + 2 + i * 8, y - height * .3, x + 6, y);
      ctx.closePath(); ctx.fill();
    }
  }

  coral(x, y, h, t, color) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const angle = -1.15 + i * .48;
      const length = h * (.62 + Math.sin(i * 2) * .2);
      const tx = Math.sin(angle) * length, ty = -Math.cos(angle) * length;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(tx * .2, ty * .7, tx, ty); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx * .55, ty * .58); ctx.lineTo(tx * .55 + (i % 2 ? 12 : -12), ty * .58 - 15); ctx.stroke(); ctx.lineWidth = 5;
    }
    ctx.restore();
  }

  titleScene(t) {
    const ctx = this.ctx;
    const glow = ctx.createRadialGradient(210, 421, 10, 210, 421, 157);
    glow.addColorStop(0, 'rgba(37,169,189,.2)'); glow.addColorStop(.65, 'rgba(37,169,189,.06)'); glow.addColorStop(1, 'rgba(37,169,189,0)');
    ctx.fillStyle = glow; ctx.fillRect(25, 240, 370, 350);
    // A quiet circular current gives the hero an illustrated focal point.
    ctx.strokeStyle = 'rgba(124,226,229,.10)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(210, 419, 130, 84, -.3, .2, Math.PI * 1.35); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(210, 419, 139, 92, -.3, Math.PI * 1.35, Math.PI * 1.88); ctx.stroke();
    this.fish(214, 409 + Math.sin(t * 1.7) * 5, 61, -.35 + Math.sin(t * .7) * .035, t, true);
    this.bubble(300 + Math.sin(t * .7) * 5, 334 - (t * 8 % 45), 7, t);
    this.bubble(324 + Math.sin(t * .8) * 4, 382 - (t * 6 % 37), 4, t);
    this.bubble(100, 463 - (t * 8 % 26), 4.5, t);
    // Long submerged silhouettes hint at the predator without stealing the hero.
    ctx.save(); ctx.globalAlpha = .16;
    this.predator(335, 665 + Math.sin(t * .8) * 5, 44, 0, t);
    ctx.restore();
  }

  fish(x, y, size, heading, t, hero = false) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y); ctx.rotate(heading); ctx.scale(size, size);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = hero ? .038 : .085;
    ctx.strokeStyle = '#8e3c20';
    const tail = Math.sin(t * (hero ? 5 : 13)) * .11;
    ctx.fillStyle = '#ef7430';
    ctx.beginPath(); ctx.moveTo(-.79, .02); ctx.bezierCurveTo(-1.13, -.12, -1.5, -.62 + tail, -1.73, -.48 + tail);
    ctx.quadraticCurveTo(-1.6, -.02, -1.76, .5 + tail); ctx.bezierCurveTo(-1.43, .61 + tail, -1.1, .12, -.79, .02); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(139,58,32,.5)'; ctx.lineWidth = .025;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-.92, .03); ctx.lineTo(-1.58, i * .25 + tail); ctx.stroke(); }
    ctx.fillStyle = '#ffac45'; ctx.strokeStyle = '#a74a24'; ctx.lineWidth = hero ? .032 : .055;
    ctx.beginPath(); ctx.moveTo(-.64, -.49); ctx.quadraticCurveTo(-.4, -1, .04, -.9); ctx.quadraticCurveTo(.27, -.74, .49, -.53); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d1702e'; ctx.lineWidth = .023;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-.45 + i * .2, -.57); ctx.lineTo(-.38 + i * .12, -.83 + i * .035); ctx.stroke(); }
    ctx.fillStyle = '#ea642a';
    ctx.beginPath(); ctx.moveTo(-.35, .47); ctx.quadraticCurveTo(-.2, .91, .27, .76); ctx.lineTo(.46, .49); ctx.closePath(); ctx.fill();

    const body = ctx.createLinearGradient(0, -.67, 0, .69);
    body.addColorStop(0, '#ffd078'); body.addColorStop(.24, '#ffb145'); body.addColorStop(.6, '#ff922f'); body.addColorStop(1, '#e96228');
    ctx.fillStyle = body; ctx.strokeStyle = '#9c4728'; ctx.lineWidth = hero ? .035 : .065;
    ctx.beginPath(); ctx.moveTo(-.94, 0); ctx.bezierCurveTo(-.75, -.68, -.01, -.87, .65, -.53);
    ctx.bezierCurveTo(1.07, -.32, 1.21, .12, .87, .47); ctx.bezierCurveTo(.35, .85, -.64, .7, -.94, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd589';
    ctx.beginPath(); ctx.moveTo(-.75, .22); ctx.bezierCurveTo(-.25, .5, .35, .56, .92, .26); ctx.bezierCurveTo(.58, .76, -.3, .74, -.75, .22); ctx.fill();
    ctx.strokeStyle = 'rgba(255,233,175,.65)'; ctx.lineWidth = .065;
    ctx.beginPath(); ctx.moveTo(-.61, -.39); ctx.quadraticCurveTo(-.2, -.68, .14, -.6); ctx.stroke();
    // A single oversized eye and raised eyebrow remain legible at game scale.
    ellipse(ctx, .53, -.22, .29, .33, '#fff9db', -.1);
    ctx.strokeStyle = '#b46230'; ctx.lineWidth = .026; ctx.stroke();
    ellipse(ctx, .64, -.2, .135, .18, '#062d40', -.06);
    ellipse(ctx, .68, -.26, .043, .052, '#ffffff');
    ctx.strokeStyle = '#913d25'; ctx.lineWidth = .045;
    ctx.beginPath(); ctx.moveTo(.28, -.57); ctx.quadraticCurveTo(.51, -.76, .76, -.57); ctx.stroke();
    ctx.strokeStyle = '#9b4328'; ctx.lineWidth = .036;
    ctx.beginPath(); ctx.moveTo(.77, .22); ctx.quadraticCurveTo(.97, .35, 1.03, .12); ctx.stroke();
    ellipse(ctx, .38, .19, .13, .062, 'rgba(239,103,48,.56)');
    ctx.strokeStyle = '#d56a2b'; ctx.lineWidth = .031;
    ctx.beginPath(); ctx.moveTo(.08, -.08); ctx.quadraticCurveTo(-.05, .16, .09, .31); ctx.stroke();
    const fin = Math.sin(t * (hero ? 5 : 13)) * .13;
    ctx.fillStyle = '#ffbd51'; ctx.strokeStyle = '#cf6029'; ctx.lineWidth = .027;
    ctx.beginPath(); ctx.moveTo(-.15, .06); ctx.bezierCurveTo(-.4, .02, -.76, .25 + fin, -.55, .38 + fin);
    ctx.quadraticCurveTo(-.21, .42, -.15, .06); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  predator(x, y, size, tier, t, trapped = false) {
    const ctx = this.ctx;
    const palettes = [['#31647b', '#102f48', '#58c8d4'], ['#684b87', '#281e4a', '#b28bd1'], ['#824260', '#2e1838', '#ec8a9e']];
    const [rim, core, highlight] = palettes[clamp(tier, 0, 2)];
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * (trapped ? 15 : 2.4)) * (trapped ? .14 : .06));
    ctx.scale(size, size);
    ctx.lineJoin = 'round';
    ctx.fillStyle = core; ctx.strokeStyle = rim; ctx.lineWidth = .06;
    ctx.beginPath(); ctx.moveTo(-.34, .59); ctx.lineTo(-.64, 1.3); ctx.quadraticCurveTo(0, 1.12, .6, 1.3); ctx.lineTo(.32, .59); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-.54, -.18); ctx.lineTo(-1, .36); ctx.lineTo(-.42, .35); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(.54, -.18); ctx.lineTo(1, .36); ctx.lineTo(.42, .35); ctx.closePath(); ctx.fill(); ctx.stroke();
    const gradient = ctx.createLinearGradient(-.8, -.8, .65, .6);
    gradient.addColorStop(0, rim); gradient.addColorStop(.55, core); gradient.addColorStop(1, '#071523');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.moveTo(-.73, -.67); ctx.bezierCurveTo(-.79, -.96, .76, -.99, .73, -.66);
    ctx.bezierCurveTo(.87, .16, .32, 1, 0, .94); ctx.bezierCurveTo(-.37, 1, -.88, .17, -.73, -.67); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = highlight; ctx.globalAlpha *= .5; ctx.lineWidth = .025;
    ctx.beginPath(); ctx.moveTo(-.63, -.67); ctx.quadraticCurveTo(-.27, -.88, .36, -.78); ctx.stroke(); ctx.globalAlpha /= .5;
    ellipse(ctx, 0, -.57, .52, .29 + Math.sin(t * 3) * .025, '#040d1c');
    ctx.fillStyle = '#cee2d8';
    for (let i = 0; i < 6 + tier; i++) {
      const tx = -.41 + i * .82 / (5 + tier);
      ctx.beginPath(); ctx.moveTo(tx - .043, -.76); ctx.lineTo(tx + .04, -.76); ctx.lineTo(tx, -.54 + (i % 2) * .04); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx - .04, -.4); ctx.lineTo(tx + .04, -.4); ctx.lineTo(tx, -.54); ctx.fill();
    }
    for (let side = -1; side <= 1; side += 2) {
      ellipse(ctx, side * .43, -.22, .16, .12, '#f9ae59', side * -.35);
      ellipse(ctx, side * .42, -.23, .043, .105, '#1b1824');
      ctx.strokeStyle = core; ctx.lineWidth = .09;
      ctx.beginPath(); ctx.moveTo(side * .62, -.36); ctx.lineTo(side * .28, -.26); ctx.stroke();
    }
    ctx.restore();
  }

  net(net, y, t) {
    const ctx = this.ctx;
    const passed = net.passed;
    const color = net.final ? '144,247,214' : '118,201,211';
    const sag = passed ? 13 + Math.sin(t * 6) * 2 : 4;
    ctx.save(); ctx.strokeStyle = `rgba(${color},${passed ? .58 : .27})`; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -30; x < WIDTH + 30; x += 21) {
      ctx.moveTo(x, y - 16); ctx.lineTo(x + 28, y + 18 + Math.sin(x / WIDTH * Math.PI) * sag);
      ctx.moveTo(x, y - 16); ctx.lineTo(x - 28, y + 18 + Math.sin(x / WIDTH * Math.PI) * sag);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(${color},.68)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y - 16); ctx.quadraticCurveTo(WIDTH / 2, y - 16 + sag, WIDTH, y - 16); ctx.stroke();
    ctx.strokeStyle = `rgba(${color},.36)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y + 18); ctx.quadraticCurveTo(WIDTH / 2, y + 18 + sag, WIDTH, y + 18); ctx.stroke();
    for (let x = 18; x < WIDTH; x += 48) {
      ellipse(ctx, x, y - 14 + Math.sin(x / WIDTH * Math.PI) * sag * .5, 3.4, 5, net.final ? '#a8f5d1' : '#a9dbd8');
    }
    ctx.restore();
  }

  obstacle(o, y, t) {
    switch (o.type) {
      case 'rock': this.rock(o, y); break;
      case 'jelly': this.jelly(o, y, t); break;
      case 'urchin': this.urchin(o, y, t); break;
      case 'puffer': this.puffer(o, y, t); break;
      default: this.angler(o, y, t);
    }
  }

  rock(o, y) {
    const ctx = this.ctx;
    const r = o.r;
    ctx.save(); ctx.translate(o.x, y);
    const phase = o.phase || 0;
    const points = Array.from({ length: 8 }, (_, i) => { const a = i * TAU / 8; const scale = .89 + Math.sin(i * 7 + phase) * .11; return [Math.cos(a) * r * scale, Math.sin(a) * r * scale]; });
    const gradient = ctx.createLinearGradient(-r, -r, r, r);
    gradient.addColorStop(0, '#557b83'); gradient.addColorStop(.45, '#355b68'); gradient.addColorStop(1, '#1b3e51');
    ctx.fillStyle = gradient; ctx.strokeStyle = '#10364a'; ctx.lineWidth = 2;
    ctx.beginPath(); points.forEach(([x, yy], i) => i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#709393'; ctx.globalAlpha = .36;
    ctx.beginPath(); ctx.moveTo(...points[4]); ctx.lineTo(...points[5]); ctx.lineTo(...points[6]); ctx.lineTo(r * .13, -r * .19); ctx.lineTo(-r * .38, -.12 * r); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .55; ctx.strokeStyle = '#112f42'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-r * .3, r * .14); ctx.lineTo(r * .12, -.08 * r); ctx.lineTo(r * .3, -r * .58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * .12, -.08 * r); ctx.lineTo(r * .48, r * .2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#5baf9e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * .64, -r * .53); ctx.quadraticCurveTo(-r * .35, -r * .73, -r * .16, -r * .78); ctx.stroke();
    ctx.restore();
  }

  jelly(o, y, t) {
    const ctx = this.ctx, r = o.r;
    const phase = o.phase || 0, pulse = 1 + Math.sin(t * 3 + phase) * .065;
    ctx.save(); ctx.translate(o.x, y); ctx.scale(pulse, 1 / pulse);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * r * .33;
      const sway = Math.sin(t * 3 + phase + i) * r * .22;
      ctx.strokeStyle = i % 2 ? '#9d91e7' : '#baacef'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x, r * .28); ctx.bezierCurveTo(x - sway, r * .75, x + sway, r * .9, x - sway * .3, r * (1.18 + (i % 2) * .12)); ctx.stroke();
    }
    const gradient = ctx.createLinearGradient(0, -r, 0, r * .3);
    gradient.addColorStop(0, '#c6a6f6'); gradient.addColorStop(.6, '#977cd5'); gradient.addColorStop(1, '#7662b3');
    ctx.fillStyle = gradient; ctx.strokeStyle = '#d5c3fa'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-r, r * .25); ctx.bezierCurveTo(-r * .98, -r * 1.13, r * .98, -r * 1.13, r, r * .25);
    ctx.quadraticCurveTo(r * .76, r * .48, r * .49, r * .26); ctx.quadraticCurveTo(r * .24, r * .5, 0, r * .28); ctx.quadraticCurveTo(-r * .24, r * .5, -r * .49, r * .26); ctx.quadraticCurveTo(-r * .76, r * .48, -r, r * .25); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(243,224,255,.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * .61, -r * .27); ctx.quadraticCurveTo(-r * .4, -r * .67, -.07 * r, -r * .63); ctx.stroke();
    ellipse(ctx, -.22 * r, -.02 * r, 1.5, 2.2, '#43365f'); ellipse(ctx, .22 * r, -.02 * r, 1.5, 2.2, '#43365f');
    ctx.restore();
  }

  urchin(o, y, t) {
    const ctx = this.ctx, r = o.r;
    ctx.save(); ctx.translate(o.x, y); ctx.rotate((o.phase || 0) + t * .11);
    ctx.fillStyle = '#66569d'; ctx.strokeStyle = '#9d8cd1'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 26; i++) { const a = i * TAU / 26; const radius = r * (i % 2 ? .62 : 1.04); const x = Math.cos(a) * radius, yy = Math.sin(a) * radius; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ellipse(ctx, 0, 0, r * .64, r * .64, '#433e70');
    ellipse(ctx, -r * .16, -r * .25, r * .31, r * .2, '#7567a0', -.35);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ellipse(ctx, Math.cos(a) * r * .4, Math.sin(a) * r * .4, 1.3, 1.3, '#b19dcc'); }
    ctx.restore();
    ellipse(ctx, o.x - r * .19, y - r * .08, 2, 2.8, '#e7d9fb'); ellipse(ctx, o.x + r * .19, y - r * .08, 2, 2.8, '#e7d9fb');
  }

  puffer(o, y, t) {
    const ctx = this.ctx, base = o.r;
    const r = o.hitR || base * (1 + (o.inflated || 0) * .48);
    ctx.save(); ctx.translate(o.x, y);
    ctx.fillStyle = '#619d9a';
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12 + (o.phase || 0), sx = Math.cos(a), sy = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(sx * r * .85 - sy * 3, sy * r * .85 + sx * 3); ctx.lineTo(sx * r * 1.12, sy * r * 1.12); ctx.lineTo(sx * r * .85 + sy * 3, sy * r * .85 - sx * 3); ctx.fill();
    }
    const gradient = ctx.createLinearGradient(0, -r, 0, r);
    gradient.addColorStop(0, '#aac798'); gradient.addColorStop(.6, '#80b6a3'); gradient.addColorStop(1, '#559b97');
    ellipse(ctx, 0, 0, r * .91, r * .9, gradient);
    ctx.strokeStyle = '#c1dcaf'; ctx.lineWidth = 1; ctx.stroke();
    ellipse(ctx, 0, r * .3, r * .64, r * .45, '#b5d4bb');
    for (let i = 0; i < 4; i++) ellipse(ctx, (i % 2 ? .53 : -.55) * r, (-.48 + Math.floor(i / 2) * .3) * r, 2.1, 2.5, '#538c85');
    for (let side = -1; side <= 1; side += 2) {
      ellipse(ctx, side * r * .3, -r * .13, r * .22, r * .25, '#eaf0d5');
      ellipse(ctx, side * r * .27, -r * .09, r * .085, r * .13, '#153944');
    }
    ellipse(ctx, 0, r * .24, r * .13, r * .14, '#497f7d');
    ctx.restore();
  }

  angler(o, y, t) {
    const ctx = this.ctx, r = o.r;
    ctx.save(); ctx.translate(o.x, y);
    ctx.fillStyle = '#34516e';
    ctx.beginPath(); ctx.moveTo(-r * .74, 0); ctx.lineTo(-r * 1.26, -r * .52); ctx.quadraticCurveTo(-r * 1.06, 0, -r * 1.26, r * .5); ctx.closePath(); ctx.fill();
    const gradient = ctx.createLinearGradient(0, -r, 0, r);
    gradient.addColorStop(0, '#47677e'); gradient.addColorStop(1, '#1c3553');
    ellipse(ctx, 0, 0, r * .93, r * .8, gradient);
    ctx.strokeStyle = '#7095a1'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#061a2e';
    ctx.beginPath(); ctx.moveTo(r * .91, -r * .3); ctx.lineTo(-r * .08, r * .13); ctx.quadraticCurveTo(r * .7, r * .79, r * .91, -r * .3); ctx.fill();
    ctx.fillStyle = '#a5c0c7';
    for (let i = 0; i < 4; i++) { const xx = r * (.23 + i * .16); ctx.beginPath(); ctx.moveTo(xx, r * (.05 - i * .05)); ctx.lineTo(xx + r * .09, -i * r * .045); ctx.lineTo(xx + r * .08, r * (.27 - i * .055)); ctx.fill(); }
    ellipse(ctx, r * .3, -r * .29, r * .16, r * .19, '#d9e79c'); ellipse(ctx, r * .35, -r * .27, r * .05, r * .105, '#173146');
    ctx.strokeStyle = '#6a9fac'; ctx.lineWidth = 1.6;
    const lampX = r * .8 + Math.sin(t * 2 + (o.phase || 0)) * 3;
    ctx.beginPath(); ctx.moveTo(-r * .1, -r * .68); ctx.bezierCurveTo(-r * .25, -r * 1.5, lampX, -r * 1.5, lampX, -r * .95); ctx.stroke();
    const glow = ctx.createRadialGradient(lampX, -r * .95, 1, lampX, -r * .95, r * .49);
    glow.addColorStop(0, 'rgba(168,243,186,.3)'); glow.addColorStop(1, 'rgba(168,243,186,0)');
    ellipse(ctx, lampX, -r * .95, r * .49, r * .49, glow); ellipse(ctx, lampX, -r * .95, 3.5, 4, '#c8f5cb');
    ctx.restore();
  }

  bubble(x, y, radius, t) {
    const ctx = this.ctx;
    ctx.save();
    const r = Math.max(3, radius);
    ellipse(ctx, x, y, r, r, 'rgba(86,219,221,.13)');
    ctx.strokeStyle = '#8cebdd'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.strokeStyle = '#e2fff5'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * .61, Math.PI * 1.14, Math.PI * 1.54); ctx.stroke();
    ellipse(ctx, x + r * .4, y + r * .4, .9, .9, '#69c2c8');
    ctx.restore();
  }

  pickup(pickup, y, t) {
    const ctx = this.ctx, boost = pickup.type === 'boost', x = pickup.x;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * .04);
    ctx.strokeStyle = boost ? '#ffd17c' : '#84eddb'; ctx.fillStyle = boost ? '#715039' : '#1a626b'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(15, -8); ctx.lineTo(15, 8); ctx.lineTo(0, 17); ctx.lineTo(-15, 8); ctx.lineTo(-15, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = boost ? '#fff0ba' : '#d5fff5'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.7;
    if (boost) { ctx.beginPath(); ctx.moveTo(1, -11); ctx.lineTo(-7, 2); ctx.lineTo(-1, 2); ctx.lineTo(-2, 11); ctx.lineTo(7, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, -5); ctx.lineTo(7, 4); ctx.quadraticCurveTo(4, 9, 0, 11); ctx.quadraticCurveTo(-4, 9, -7, 4); ctx.lineTo(-8, -5); ctx.closePath(); ctx.stroke(); }
    ctx.restore();
  }

  playerEffects(game, y, t) {
    const ctx = this.ctx, p = game.player;
    if (game.boost > 0) {
      const gradient = ctx.createLinearGradient(p.x, y + 15, p.x, y + 70);
      gradient.addColorStop(0, 'rgba(255,205,111,.6)'); gradient.addColorStop(1, 'rgba(255,205,111,0)');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(p.x - 7, y + 9); ctx.quadraticCurveTo(p.x - 8, y + 36, p.x, y + 68 + Math.sin(t * 20) * 7); ctx.quadraticCurveTo(p.x + 8, y + 36, p.x + 7, y + 9); ctx.fill();
    }
    if (game.shield > 0) {
      const radius = p.r + 10 + Math.sin(t * 3) * .8;
      ellipse(ctx, p.x, y, radius, radius, 'rgba(84,239,221,.07)'); ctx.strokeStyle = '#8beedc'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.strokeStyle = '#dbfff0'; ctx.lineWidth = 2.3; ctx.beginPath(); ctx.arc(p.x, y, radius - 3, 3.8, 4.5); ctx.stroke();
    }
    if (p.vy < -40) {
      ctx.save(); ctx.globalAlpha = .22;
      for (let i = 0; i < 4; i++) { const step = ((t * 2.4 + i * .25) % 1); ellipse(ctx, p.x + Math.sin(i * 2) * 7, y + 21 + step * 37, 1.8 * (1 - step), 2.5 * (1 - step), '#aeeedc'); }
      ctx.restore();
    }
  }

  effects(camera, dt, reducedMotion) {
    const ctx = this.ctx;
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 18 * dt;
      if (p.life <= 0 || reducedMotion) continue;
      ctx.save(); ctx.globalAlpha = clamp(p.life / p.max); ellipse(ctx, p.x, p.y - camera, p.r, p.r, p.color); ctx.restore();
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const ring of this.rings) {
      ring.life -= dt;
      if (ring.life <= 0 || reducedMotion) continue;
      ctx.save(); ctx.globalAlpha = ring.life * .7; ctx.strokeStyle = ring.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ring.x, ring.y - camera, 15 + (1 - ring.life / .7) * 65, 0, TAU); ctx.stroke(); ctx.restore();
    }
    this.rings = this.rings.filter(r => r.life > 0);
  }

  danger(game, t) {
    if (game.state !== 'play' || !game.player || !game.predator || game.predator.status !== 'chasing') return;
    const ctx = this.ctx;
    const distance = game.predator.y - game.player.y;
    const amount = clamp(1 - distance / 280);
    if (amount < .05) return;
    const gradient = ctx.createLinearGradient(0, HEIGHT - 130, 0, HEIGHT);
    gradient.addColorStop(0, 'rgba(193,60,98,0)'); gradient.addColorStop(1, `rgba(193,60,98,${amount * (.2 + Math.sin(t * 7) * .035)})`);
    ctx.fillStyle = gradient; ctx.fillRect(0, HEIGHT - 130, WIDTH, 130);
  }

  surface(camera, t, state) {
    const ctx = this.ctx;
    const y = 94 - camera;
    if (y < -20) return;
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, y));
    sky.addColorStop(0, '#92d9df'); sky.addColorStop(1, '#d0f2e5');
    ctx.fillStyle = sky; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(WIDTH, 0); ctx.lineTo(WIDTH, y);
    for (let x = WIDTH; x >= 0; x -= 12) ctx.lineTo(x, y + Math.sin(x * .035 + t * 2) * 3);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e1fff1'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let x = 0; x <= WIDTH; x += 8) { const yy = y + Math.sin(x * .035 + t * 2) * 3; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
    const sun = ctx.createRadialGradient(WIDTH * .78, 14, 2, WIDTH * .78, 14, 80); sun.addColorStop(0, 'rgba(255,255,222,.6)'); sun.addColorStop(1, 'rgba(255,255,222,0)'); ctx.fillStyle = sun; ctx.fillRect(WIDTH * .78 - 80, 0, 160, 95);
    if (state === 'winning' || state === 'win') {
      const x = WIDTH * .6 + Math.sin(t * .6) * 62, birdY = Math.max(17, y - 43);
      const flap = Math.sin(t * 3) * 7;
      ctx.strokeStyle = '#315c70'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 21, birdY - 5 - flap); ctx.quadraticCurveTo(x - 9, birdY - 12, x, birdY); ctx.quadraticCurveTo(x + 9, birdY - 12, x + 21, birdY - 5 - flap); ctx.stroke();
    }
  }

  vignette(title) {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(WIDTH * .5, HEIGHT * .42, WIDTH * .27, WIDTH * .5, HEIGHT * .46, HEIGHT * .71);
    gradient.addColorStop(0, 'rgba(0,8,24,0)'); gradient.addColorStop(1, `rgba(0,8,24,${title ? .5 : .3})`);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}
