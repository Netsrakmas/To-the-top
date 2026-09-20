/** Original synthesized audio: no downloads, decoding or autoplay dependency. */
export class GameAudio {
  constructor() { this.enabled = false; this.context = null; this.nextAmbience = 0; }
  async setEnabled(enabled) {
    this.enabled = enabled;
    try {
      if (enabled) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.context ||= new Context();
        await this.context.resume();
      } else if (this.context?.state === 'running') await this.context.suspend();
    } catch { /* A browser may restrict audio. Gameplay remains available. */ }
  }
  tone(frequency, duration = 0.12, volume = 0.04, type = 'sine', delay = 0, endFrequency = frequency) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running') return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.025, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(now); oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  event(event) {
    switch (event.type) {
      case 'collect': this.tone(540 + (event.score % 5) * 90, 0.13, 0.045, 'sine', 0, 1100); break;
      case 'hurt': this.tone(160, 0.24, 0.05, 'triangle', 0, 60); break;
      case 'net':
        if (!event.caught) { this.tone(350, 0.2, 0.04); this.tone(525, 0.3, 0.04, 'sine', 0.13); }
        else this.tone(100, 0.35, 0.045, 'triangle', 0, 45);
        break;
      case 'boost': case 'shield':
        [440, 660, 880].forEach((note, i) => this.tone(note, 0.2, 0.035, 'sine', i * 0.08)); break;
      case 'win': [392, 494, 587, 784].forEach((note, i) => this.tone(note, 0.6, 0.055, 'sine', i * 0.17)); break;
      case 'lose': this.tone(240, 0.6, 0.045, 'triangle', 0, 55); break;
    }
  }
  update(time, zone) {
    if (!this.enabled || time < this.nextAmbience) return;
    this.nextAmbience = time + 3.5;
    const base = [98, 130.81, 196][zone];
    this.tone(base, 3, 0.009); this.tone(base * 1.5, 2.8, 0.006, 'sine', 0.2);
  }
  reset() { this.nextAmbience = 0; }
  suspend() { this.context?.suspend().catch(() => {}); }
}
