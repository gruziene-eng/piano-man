/* Piano Man — garsas: sintezatorius, metronomas, MIDI įvestis/įrašymas */
(function () {
  let ctx = null, master = null;
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H"];
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);

  /* ---- paprastas „pianino“ sintezatorius ---- */
  const voices = {};
  function noteOn(m, vel = 90) {
    const c = ac();
    noteOff(m, true);
    const t = c.currentTime, f = freq(m), v = (vel / 127) * 0.5;
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(Math.min(12000, f * 8 + vel * 30), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + 1.5);
    const decay = Math.max(1.2, 6 - (m - 40) * 0.06);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.005);
    g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0008, t + decay);
    const oscs = [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12], [1.003, "sine", 0.3]].map(([mul, type, amp]) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f * mul;
      const og = c.createGain(); og.gain.value = amp;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + decay + 0.1);
      return o;
    });
    lp.connect(g); g.connect(master);
    voices[m] = { g, oscs };
  }
  function noteOff(m, fast) {
    const v = voices[m]; if (!v) return;
    const t = ctx.currentTime;
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), t);
    v.g.gain.exponentialRampToValueAtTime(0.0001, t + (fast ? 0.03 : 0.35));
    v.oscs.forEach(o => { try { o.stop(t + 0.4); } catch (e) {} });
    delete voices[m];
  }

  /* ---- metronomas (lookahead planuoklis) ---- */
  const Metro = {
    bpm: 80, beats: 4, sub: 1, running: false, onBeat: null,
    _next: 0, _beat: 0, _timer: null, _taps: [],
    start() {
      const c = ac(); this.running = true; this._beat = 0; this._next = c.currentTime + 0.08;
      this._timer = setInterval(() => this._sched(), 25);
    },
    stop() { this.running = false; clearInterval(this._timer); },
    toggle() { this.running ? this.stop() : this.start(); return this.running; },
    _sched() {
      const c = ctx;
      while (this._next < c.currentTime + 0.12) {
        const total = this.beats * this.sub;
        const i = this._beat % total;
        const first = i === 0, main = i % this.sub === 0;
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.value = first ? 1760 : main ? 1100 : 800;
        g.gain.setValueAtTime(first ? 0.6 : main ? 0.4 : 0.18, this._next);
        g.gain.exponentialRampToValueAtTime(0.0001, this._next + 0.05);
        o.connect(g); g.connect(c.destination);
        o.start(this._next); o.stop(this._next + 0.06);
        if (main && this.onBeat) {
          const beatIdx = i / this.sub, delay = (this._next - c.currentTime) * 1000;
          setTimeout(() => this.onBeat && this.onBeat(beatIdx), Math.max(0, delay));
        }
        this._next += 60 / this.bpm / this.sub;
        this._beat++;
      }
    },
    tap() {
      const now = performance.now();
      this._taps = this._taps.filter(t => now - t < 2500); this._taps.push(now);
      if (this._taps.length >= 2) {
        const d = (this._taps[this._taps.length - 1] - this._taps[0]) / (this._taps.length - 1);
        this.bpm = Math.max(30, Math.min(240, Math.round(60000 / d)));
      }
      return this.bpm;
    }
  };

  /* ---- Web MIDI (Kawai CA901 per USB ar Bluetooth MIDI) ---- */
  const Midi = {
    access: null, inputs: [], handlers: new Set(), statusHandlers: new Set(),
    supported: !!navigator.requestMIDIAccess,
    async init() {
      if (!this.supported) return false;
      try {
        this.access = await navigator.requestMIDIAccess({ sysex: false });
        this._bind();
        this.access.onstatechange = () => this._bind();
        return true;
      } catch (e) { return false; }
    },
    _bind() {
      this.inputs = [...this.access.inputs.values()];
      this.inputs.forEach(inp => { inp.onmidimessage = e => this._msg(e); });
      this.statusHandlers.forEach(f => f(this.inputs));
    },
    _msg(e) {
      const [st, d1, d2] = e.data, type = st & 0xf0;
      let ev = null;
      if (type === 0x90 && d2 > 0) ev = { type: "on", note: d1, vel: d2 };
      else if (type === 0x80 || (type === 0x90 && d2 === 0)) ev = { type: "off", note: d1, vel: 0 };
      else if (type === 0xb0 && d1 === 64) ev = { type: "pedal", value: d2 };
      if (ev) this.handlers.forEach(f => f(ev));
    },
    on(f) { this.handlers.add(f); return () => this.handlers.delete(f); }
  };

  /* ---- MIDI įrašymas ir .mid failo eksportas ---- */
  const MidiRec = {
    events: [], t0: 0, recording: false, _off: null,
    start() {
      this.events = []; this.t0 = performance.now(); this.recording = true;
      this._off = Midi.on(ev => this.push(ev));
    },
    push(ev) { if (this.recording) this.events.push({ t: performance.now() - this.t0, ...ev }); },
    stop() { this.recording = false; if (this._off) this._off(); return this.events.slice(); },
    play(events, onEnd) {
      const timers = [];
      events.forEach(ev => timers.push(setTimeout(() => {
        if (ev.type === "on") noteOn(ev.note, ev.vel); else if (ev.type === "off") noteOff(ev.note);
      }, ev.t)));
      const end = events.length ? events[events.length - 1].t + 1500 : 0;
      timers.push(setTimeout(() => onEnd && onEnd(), end));
      return () => { timers.forEach(clearTimeout); Object.keys(voices).forEach(m => noteOff(+m)); };
    },
    toFile(events, bpm = 120) {
      const ppq = 480, msPerTick = 60000 / bpm / ppq;
      const vlq = n => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
      const trk = [];
      const tempo = Math.round(60000000 / bpm);
      trk.push(0, 0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255);
      let last = 0;
      events.forEach(ev => {
        const tick = Math.round(ev.t / msPerTick), dt = tick - last; last = tick;
        if (ev.type === "on") trk.push(...vlq(dt), 0x90, ev.note, ev.vel);
        else if (ev.type === "off") trk.push(...vlq(dt), 0x80, ev.note, 64);
        else if (ev.type === "pedal") trk.push(...vlq(dt), 0xb0, 64, ev.value);
      });
      trk.push(0, 0xff, 0x2f, 0);
      const u32 = n => [(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255];
      const bytes = [0x4d, 0x54, 0x68, 0x64, ...u32(6), 0, 0, 0, 1, (ppq >> 8) & 255, ppq & 255,
        0x4d, 0x54, 0x72, 0x6b, ...u32(trk.length), ...trk];
      return new Blob([new Uint8Array(bytes)], { type: "audio/midi" });
    }
  };

  PM.Audio = { ac, noteOn, noteOff, freq, noteName, NAMES, Metro, Midi, MidiRec };
})();
