/* Piano Man — duomenų saugykla (localStorage + IndexedDB įrašams) */
(function () {
  const KEY = "pianoman.v1";
  const defaults = () => ({
    settings: { name: "", theme: "light", dailyGoal: 30, startedAt: today() },
    lessonsDone: {},          // "lvl-idx": "2026-11-08"
    sessions: [],             // {id, date, minutes, cat, note}
    repertoire: [],           // {id, title, composer, status, level, notes, added}
    performances: [],         // {id, title, date, place, program, checks:{}, notes}
    challenges: {},           // id: {startedAt, days:[dates], doneAt}
    trainer: { bestStreak: 0, total: 0, correct: 0 },
    xpBonus: 0
  });

  function today(d) {
    d = d || new Date();
    const z = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  let state;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    state = Object.assign(defaults(), raw || {});
    state.settings = Object.assign(defaults().settings, state.settings || {});
    state.trainer = Object.assign(defaults().trainer, state.trainer || {});
  } catch (e) { state = defaults(); }

  const listeners = [];
  const Store = {
    get s() { return state; },
    today,
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    save() {
      localStorage.setItem(KEY, JSON.stringify(state));
      listeners.forEach(f => f());
    },
    onChange(f) { listeners.push(f); },
    reset() { state = defaults(); Store.save(); },
    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(txt) {
      const obj = JSON.parse(txt);
      if (!obj || typeof obj !== "object" || !obj.settings) throw new Error("Netinkamas failas");
      state = Object.assign(defaults(), obj);
      Store.save();
    },

    /* ---- skaičiavimai ---- */
    minutesOn(date) {
      return state.sessions.filter(x => x.date === date).reduce((a, b) => a + b.minutes, 0);
    },
    totalMinutes() { return state.sessions.reduce((a, b) => a + b.minutes, 0); },
    streak() {
      const days = new Set(state.sessions.filter(s => s.minutes > 0).map(s => s.date));
      let n = 0; const d = new Date();
      if (!days.has(today(d))) d.setDate(d.getDate() - 1); // šiandien dar galima spėti
      while (days.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    lessonsDoneCount(lvl) {
      return Object.keys(state.lessonsDone).filter(k => k.startsWith(lvl + "-")).length;
    },
    currentLevel() {
      for (const L of PM.LEVELS) {
        if (Store.lessonsDoneCount(L.id) < L.lessons.length) return L;
      }
      return PM.LEVELS[PM.LEVELS.length - 1];
    },
    xp() {
      const lessons = Object.keys(state.lessonsDone).length * 25;
      const minutes = Store.totalMinutes();
      const ch = Object.entries(state.challenges)
        .filter(([, v]) => v.doneAt)
        .reduce((a, [id]) => a + ((PM.CHALLENGES.find(c => c.id === id) || {}).xp || 0), 0);
      return lessons + minutes + ch + (state.xpBonus || 0);
    },
    rank() {
      const xp = Store.xp();
      let cur = PM.RANKS[0], next = null;
      for (let i = 0; i < PM.RANKS.length; i++) {
        if (xp >= PM.RANKS[i][0]) { cur = PM.RANKS[i]; next = PM.RANKS[i + 1] || null; }
      }
      return { xp, name: cur[1], from: cur[0], next };
    }
  };

  /* ---- IndexedDB įrašams (audio blob'ai ir MIDI) ---- */
  let dbp;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open("pianoman-studio", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("recs", { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = async (mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction("recs", mode);
      const st = t.objectStore("recs");
      const req = fn(st);
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  Store.recs = {
    all: () => tx("readonly", st => st.getAll()).then(a => (a || []).sort((x, y) => y.created - x.created)),
    put: rec => tx("readwrite", st => st.put(rec)),
    del: id => tx("readwrite", st => st.delete(id)),
    get: id => tx("readonly", st => st.get(id))
  };

  PM.Store = Store;
})();
