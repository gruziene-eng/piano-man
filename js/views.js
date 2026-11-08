/* Piano Man — puslapiai */
(function () {
  const S = PM.Store, A = PM.Audio;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} val. ${m % 60} min.` : `${m} min.`;
  const fmtClock = sec => { const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = Math.floor(sec % 60); const z = n => String(n).padStart(2, "0"); return (h ? h + ":" : "") + z(m) + ":" + z(s); };
  const dayLT = ["Sk", "Pr", "An", "Tr", "Kt", "Pn", "Št"];
  const monthsLT = ["sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio", "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio"];
  const fmtDate = iso => { const d = new Date(iso); return `${monthsLT[d.getMonth()]} ${d.getDate()} d.`; };

  /* ---------- UI pagalbininkai ---------- */
  const UI = {
    toast(msg) {
      const t = $("#toast"); t.textContent = msg; t.classList.add("show");
      clearTimeout(UI._tt); UI._tt = setTimeout(() => t.classList.remove("show"), 2400);
    },
    modal(html, mount) {
      const m = $("#modal"); $("#modalBody").innerHTML = html; m.hidden = false;
      const close = () => { m.hidden = true; $("#modalBody").innerHTML = ""; };
      m.onclick = e => { if (e.target === m) close(); };
      $$("[data-close]", m).forEach(b => b.onclick = close);
      mount && mount($("#modalBody"), close);
      const f = $("input,textarea,select", m); f && f.focus();
      return close;
    },
    confirm(text, okLabel = "Taip") {
      return new Promise(res => {
        UI.modal(`<h2>Ar tikrai?</h2><p>${esc(text)}</p><div class="btn-row" style="justify-content:flex-end"><button class="btn" data-close>Atšaukti</button><button class="btn accent" id="cOk">${esc(okLabel)}</button></div>`,
          (el, close) => { $("#modal").onclick = e => { if (e.target.id === "modal") { close(); res(false); } }; $$("[data-close]", el).forEach(b => b.onclick = () => { close(); res(false); }); $("#cOk", el).onclick = () => { close(); res(true); }; });
      });
    },
    download(blob, name) {
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  };
  PM.UI = UI;

  /* ---------- Praktikos laikmatis (veikia ir pereinant tarp puslapių) ---------- */
  const Timer = PM.Timer = {
    running: false, acc: 0, t0: 0, cat: "kurinys",
    elapsed() { return this.acc + (this.running ? (Date.now() - this.t0) / 1000 : 0); },
    start() { if (!this.running) { this.t0 = Date.now(); this.running = true; } },
    pause() { if (this.running) { this.acc = this.elapsed(); this.running = false; } },
    reset() { this.running = false; this.acc = 0; }
  };

  function saveSession(minutes, cat, note) {
    if (minutes <= 0) return;
    S.s.sessions.push({ id: S.uid(), date: S.today(), minutes, cat, note: note || "" });
    S.save();
  }

  function weekBars() {
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
    const vals = days.map(d => S.minutesOn(S.today(d)));
    const max = Math.max(S.s.settings.dailyGoal, ...vals, 1);
    return `<div class="week-bars">${days.map((d, i) => `
      <div class="bar ${i === 6 ? "today" : ""}"><b>${vals[i] || ""}</b><i style="height:${(vals[i] / max) * 100}%"></i><span>${dayLT[d.getDay()]}</span></div>`).join("")}</div>`;
  }

  function lessonBtn(L, i) {
    const key = `${L.id}-${i}`, done = !!S.s.lessonsDone[key], [t, d] = L.lessons[i];
    return `<button class="lesson ${done ? "done" : ""}" data-lesson="${key}"><span class="check">${done ? "✓" : ""}</span><span><div class="lt">${esc(t)}</div><div class="ld">${esc(d)}</div></span></button>`;
  }
  function bindLessons(root, rerender) {
    $$("[data-lesson]", root).forEach(b => b.onclick = () => {
      const k = b.dataset.lesson;
      if (S.s.lessonsDone[k]) delete S.s.lessonsDone[k];
      else { S.s.lessonsDone[k] = S.today(); UI.toast("Puiku! +25 XP 🎉"); }
      S.save(); rerender();
    });
  }

  /* ---------- Klaviatūros komponentas ---------- */
  const KB_KEYS = "awsedftgyhujkolp;'";
  function buildPiano(container, from, to, opts = {}) {
    const isBlack = m => [1, 3, 6, 8, 10].includes(m % 12);
    const whites = []; for (let m = from; m <= to; m++) if (!isBlack(m)) whites.push(m);
    const w = 100 / whites.length;
    let html = `<div class="piano-felt"></div><div class="piano">`;
    whites.forEach(m => {
      const kbIdx = opts.kbBase != null ? m - opts.kbBase : -1;
      const kb = kbIdx >= 0 && kbIdx < KB_KEYS.length ? KB_KEYS[kbIdx].toUpperCase() : "";
      html += `<div class="wk" data-m="${m}">${kb ? `<span class="kb">${kb}</span>` : ""}${m % 12 === 0 ? A.noteName(m) : ""}</div>`;
    });
    for (let m = from; m <= to; m++) if (isBlack(m)) {
      const wi = whites.indexOf(m - 1);
      if (wi >= 0) html += `<div class="bk" data-m="${m}" style="left:${(wi + 1) * w - w * 0.3}%;width:${w * 0.6}%"></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    const piano = $(".piano", container);
    const keyEl = m => $(`[data-m="${m}"]`, piano);
    const api = {
      set(m, on) { const k = keyEl(m); k && k.classList.toggle("on", on); },
      hint(m) { $$(".hint", piano).forEach(x => x.classList.remove("hint")); if (m != null) { const k = keyEl(m); k && k.classList.add("hint"); } },
      press(m, vel = 90) { A.noteOn(m, vel); api.set(m, true); opts.onNote && opts.onNote(m, vel); },
      release(m) { A.noteOff(m); api.set(m, false); }
    };
    let down = null;
    piano.addEventListener("pointerdown", e => {
      const k = e.target.closest("[data-m]"); if (!k) return;
      down = +k.dataset.m; api.press(down); piano.setPointerCapture(e.pointerId);
    });
    const up = () => { if (down != null) { api.release(down); down = null; } };
    piano.addEventListener("pointerup", up); piano.addEventListener("pointercancel", up);
    return api;
  }

  function bindComputerKeys(api, base) {
    const held = new Set();
    const kd = e => {
      if (e.target.matches("input,textarea,select") || e.metaKey || e.ctrlKey) return;
      const i = KB_KEYS.indexOf(e.key.toLowerCase()); if (i < 0 || held.has(i)) return;
      held.add(i); api.press(base + i);
    };
    const ku = e => { const i = KB_KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return; held.delete(i); api.release(base + i); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }

  function bindMidiToPiano(api, extra) {
    return A.Midi.on(ev => {
      if (ev.type === "on") { api.set(ev.note, true); extra && extra(ev.note, ev.vel); }
      else if (ev.type === "off") api.set(ev.note, false);
    });
  }

  /* =========================================================
     PRADŽIA
     ========================================================= */
  function home(el) {
    const render = () => {
      const st = S.s, r = S.rank(), L = S.currentLevel();
      const todayMin = S.minutesOn(S.today()), goal = st.settings.dailyGoal;
      const q = PM.QUOTES[new Date().getDate() % PM.QUOTES.length];
      const hour = new Date().getHours();
      const greet = hour < 11 ? "Labas rytas" : hour < 18 ? "Laba diena" : "Labas vakaras";
      const name = st.settings.name ? `, ${esc(st.settings.name)}` : "";
      const pct = r.next ? Math.min(100, ((r.xp - r.from) / (r.next[0] - r.from)) * 100) : 100;
      const undone = L.lessons.map((_, i) => i).filter(i => !st.lessonsDone[`${L.id}-${i}`]).slice(0, 4);
      const active = PM.CHALLENGES.filter(c => st.challenges[c.id] && !st.challenges[c.id].doneAt);
      const upcoming = st.performances.filter(p => p.date >= S.today()).sort((a, b) => a.date.localeCompare(b.date))[0];
      const lvlDone = S.lessonsDoneCount(L.id);

      el.innerHTML = `
      <section class="hero">
        <div class="keys-deco">${"<i></i><i class='b'></i><i class='b'></i><i></i><i class='b'></i><i class='b'></i><i class='b'></i>".repeat(2)}</div>
        <div class="eyebrow" style="color:#f3c9a8">${esc(r.name)} · ${r.xp} XP</div>
        <h1>${greet}${name} 🎹</h1>
        <p>${todayMin >= goal ? "Šiandienos tikslas pasiektas – nuostabu! Gal dar vienas kūrinys sielai?" : `Šiandien liko ${goal - todayMin} min. iki dienos tikslo. Tavo baltas Kawai laukia.`}</p>
        <div class="btn-row" style="margin-top:16px">
          <a class="btn accent lg" href="#/praktika">▶ Pradėti praktiką</a>
          <a class="btn lg" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.25)" href="#/kelias">Mano kelias</a>
        </div>
        <div class="hero-quote">„${esc(q[0])}“ — ${esc(q[1])}</div>
      </section>

      <div class="grid g4" style="margin-bottom:18px">
        <div class="card stat"><span class="ico">🔥</span><div class="num">${S.streak()}</div><div class="lbl">dienų iš eilės</div></div>
        <div class="card stat"><span class="ico">⏱️</span><div class="num">${todayMin}<span class="muted" style="font-size:1rem"> / ${goal}</span></div><div class="lbl">min. šiandien</div><div class="progress" style="margin-top:8px"><i style="width:${Math.min(100, todayMin / goal * 100)}%"></i></div></div>
        <div class="card stat"><span class="ico">🎼</span><div class="num">${Math.round(S.totalMinutes() / 6) / 10}</div><div class="lbl">valandų iš viso</div></div>
        <div class="card stat"><span class="ico">⭐</span><div class="num">${r.xp}</div><div class="lbl">${r.next ? `iki „${esc(r.next[1])}“: ${r.next[0] - r.xp} XP` : "Aukščiausias rangas!"}</div><div class="progress" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>
      </div>

      <div class="grid g3">
        <div class="card span2">
          <div class="card-title"><div><div class="eyebrow">Dabartinis lygis ${L.id} / 7</div><h2 style="margin:0">${L.emoji} ${esc(L.name)}</h2></div><span class="chip accent">${lvlDone}/${L.lessons.length}</span></div>
          <div class="progress"><i style="width:${lvlDone / L.lessons.length * 100}%"></i></div>
          <p class="muted" style="margin-top:10px">${esc(L.goal)}</p>
          <div class="lessons">${undone.map(i => lessonBtn(L, i)).join("") || `<div class="muted">Visos pamokos atliktos – sveikinu!</div>`}</div>
        </div>
        <div class="card">
          <div class="card-title"><h3>Ši savaitė</h3><span class="muted">${fmtMin([0,1,2,3,4,5,6].reduce((a, i) => { const d = new Date(); d.setDate(d.getDate() - i); return a + S.minutesOn(S.today(d)); }, 0))}</span></div>
          ${weekBars()}
        </div>
        <div class="card">
          <div class="card-title"><h3>🏆 Aktyvūs iššūkiai</h3><a class="btn sm ghost" href="#/issukiai">Visi →</a></div>
          ${active.length ? active.map(c => { const p = challengeProgress(c); return `<div class="list-item"><span style="font-size:1.4rem">${c.emoji}</span><div class="grow"><div class="title small">${esc(c.title)}</div><div class="progress"><i style="width:${p.pct}%"></i></div></div><span class="muted">${p.label}</span></div>`; }).join("") : `<div class="empty"><span class="big">🎯</span>Pasirink pirmą iššūkį</div>`}
        </div>
        <div class="card">
          <div class="card-title"><h3>✨ Artimiausias pasirodymas</h3></div>
          ${upcoming ? `<div class="score-big">${Math.ceil((new Date(upcoming.date) - new Date(S.today())) / 864e5)} d.</div><div class="title">${esc(upcoming.title)}</div><div class="muted">${fmtDate(upcoming.date)} · ${esc(upcoming.place || "")}</div>` : `<div class="empty"><span class="big">🎭</span>Suplanuok pirmą (net ir namų) koncertą<br><a class="btn sm" style="margin-top:10px" href="#/pasirodymai">Planuoti</a></div>`}
        </div>
        <div class="card">
          <div class="card-title"><h3>⚡ Greiti veiksmai</h3></div>
          <div class="btn-row" style="flex-direction:column;align-items:stretch">
            <a class="btn" href="#/klaviatura">🧠 Natų treniruotė (5 min.)</a>
            <a class="btn" href="#/studija">🎙️ Įrašyti kūrinį</a>
            <a class="btn" href="#/praktika">🥁 Metronomas</a>
          </div>
        </div>
      </div>`;
      bindLessons(el, render);
    };
    render();
  }

  /* =========================================================
     MOKYMOSI KELIAS
     ========================================================= */
  function kelias(el) {
    const render = () => {
      const cur = S.currentLevel();
      el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Nuo nulio iki masterclass</div><h1>Mokymosi kelias</h1>
      <p>8 lygiai, kurie veda nuo pirmo prisilietimo prie klavišų iki didžiųjų scenų. Pažymėk pamoką, kai ją įvaldai. Laiko rėmai – orientaciniai: kiekvienas mokosi savo tempu.</p></div></div>
      <div class="path">${PM.LEVELS.map(L => {
        const done = S.lessonsDoneCount(L.id), total = L.lessons.length;
        const cls = done === total ? "done" : L.id === cur.id ? "current" : L.id > cur.id ? "locked" : "";
        return `<div class="level ${cls}">
          <div class="level-badge">${done === total ? "✅" : L.emoji}</div>
          <div>
            <div class="level-head"><h2>${L.id}. ${esc(L.name)}</h2><span class="chip ${done === total ? "green" : "accent"}">${done}/${total}</span></div>
            <div class="level-meta"><span class="chip">🗓️ ${L.time}</span><span class="chip">⏱️ ${L.daily}</span></div>
            <p class="muted" style="margin:0 0 8px">${esc(L.goal)}</p>
            <div class="progress"><i style="width:${done / total * 100}%"></i></div>
            <details class="level-more" ${L.id === cur.id ? "open" : ""}><summary>Pamokos ir repertuaras</summary>
              <div class="lessons">${L.lessons.map((_, i) => lessonBtn(L, i)).join("")}</div>
              <div class="rep-line"><b>Repertuaras:</b> ${L.repertoire.map(esc).join(" · ")}</div>
              <div class="btn-row" style="margin-top:10px"><button class="btn sm" data-addrep="${L.id}">＋ Įtraukti repertuarą į mano sąrašą</button></div>
            </details>
          </div></div>`;
      }).join("")}</div>
      <div class="tip" style="margin-top:20px"><b>Patarimas:</b> pirmuosius 6–12 mėn. labai verta turėti gyvą mokytoją bent kartą per 2 savaites – jis pastebės rankų įtampą ir įpročius, kurių programėlė nepamatys. Piano Man – tavo kasdienis partneris tarp pamokų.</div>`;
      bindLessons(el, render);
      $$("[data-addrep]", el).forEach(b => b.onclick = () => {
        const L = PM.LEVELS[+b.dataset.addrep]; let n = 0;
        L.repertoire.forEach(t => {
          const [composer, title] = t.includes(" – ") ? t.split(" – ") : ["", t];
          if (!S.s.repertoire.some(r => r.title === title)) { S.s.repertoire.push({ id: S.uid(), title, composer, status: "noriu", level: L.id, notes: "", added: S.today() }); n++; }
        });
        S.save(); UI.toast(n ? `Pridėta kūrinių: ${n}` : "Jau yra tavo sąraše");
      });
    };
    render();
  }

  /* =========================================================
     PRAKTIKA: laikmatis + metronomas
     ========================================================= */
  function praktika(el) {
    const M = A.Metro;
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Kasdienė praktika</div><h1>Praktika</h1><p>Paleisk laikmatį, pasirink, ką treniruoji, ir įjunk metronomą. Kiekviena minutė = 1 XP.</p></div></div>
      <div class="grid g2">
        <div class="card">
          <div class="card-title"><h3>⏱️ Praktikos laikmatis</h3><span class="chip" id="tState">Sustabdyta</span></div>
          <div class="cat-picker" id="cats">${PM.CATEGORIES.map(c => `<button data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join("")}</div>
          <div class="timer-face" id="tFace">00:00</div>
          <div class="btn-row" style="justify-content:center;margin:16px 0 6px">
            <button class="btn accent lg" id="tStart">▶ Pradėti</button>
            <button class="btn lg" id="tSave">💾 Išsaugoti sesiją</button>
            <button class="btn ghost" id="tReset">↺</button>
          </div>
          <div class="field" style="margin-top:12px"><label>Užrašai (ką pavyko, kas sekasi sunkiau)</label><textarea id="tNote" placeholder="Pvz., G-dur gama 80 BPM – tolygiai, kairė ranka dar stringa ties 4 pirštu"></textarea></div>
          <div class="muted small">Arba įrašyk rankiniu būdu: <input type="number" id="manMin" min="1" max="600" style="width:80px;display:inline-block"> min. <button class="btn sm" id="manAdd">Pridėti</button></div>
        </div>
        <div class="card">
          <div class="card-title"><h3>🥁 Metronomas</h3><button class="btn sm" id="mTap">Tap tempo</button></div>
          <div class="metro-bpm"><span id="mBpm">${M.bpm}</span> <span class="muted" style="font-size:1rem">BPM</span></div>
          <div class="tempo-name" id="mName"></div>
          <div class="metro-beats" id="mBeats"></div>
          <input type="range" id="mRange" min="30" max="240" value="${M.bpm}">
          <div class="btn-row" style="justify-content:center;margin:10px 0">
            <button class="btn sm" data-d="-5">−5</button><button class="btn sm" data-d="-1">−1</button>
            <button class="btn primary lg" id="mStart">${M.running ? "■ Stabdyti" : "▶ Groti"}</button>
            <button class="btn sm" data-d="1">+1</button><button class="btn sm" data-d="5">+5</button>
          </div>
          <div class="row">
            <div class="field"><label>Taktas</label><select id="mBeatsSel">${[2, 3, 4, 5, 6, 7].map(n => `<option value="${n}" ${n === M.beats ? "selected" : ""}>${n}/4</option>`).join("")}</select></div>
            <div class="field"><label>Skaidymas</label><select id="mSub"><option value="1">Ketvirtinės</option><option value="2">Aštuntinės</option><option value="3">Triolės</option><option value="4">Šešioliktinės</option></select></div>
          </div>
          <div class="tip"><b>Lėtoji praktika:</b> pradėk tempu, kuriuo groji be klaidų, ir didink po 2–4 BPM. Greitis – tikslumo pasekmė.</div>
        </div>
        <div class="card"><div class="card-title"><h3>📊 7 dienos</h3></div><div id="wb">${weekBars()}</div></div>
        <div class="card"><div class="card-title"><h3>📔 Praktikos dienoraštis</h3></div><div class="list" id="log"></div></div>
      </div>`;

    // Laikmatis
    const face = $("#tFace", el), stEl = $("#tState", el), startB = $("#tStart", el);
    const paint = () => {
      face.textContent = fmtClock(Timer.elapsed());
      startB.textContent = Timer.running ? "⏸ Pauzė" : (Timer.elapsed() > 0 ? "▶ Tęsti" : "▶ Pradėti");
      stEl.textContent = Timer.running ? "Groja…" : "Sustabdyta"; stEl.className = "chip " + (Timer.running ? "green" : "");
      $$("[data-cat]", el).forEach(b => b.classList.toggle("active", b.dataset.cat === Timer.cat));
    };
    const iv = setInterval(paint, 500); paint();
    startB.onclick = () => { Timer.running ? Timer.pause() : Timer.start(); paint(); };
    $$("[data-cat]", el).forEach(b => b.onclick = () => { Timer.cat = b.dataset.cat; paint(); });
    $("#tReset", el).onclick = () => { Timer.reset(); paint(); };
    const log = () => {
      const items = S.s.sessions.slice().reverse().slice(0, 12);
      $("#log", el).innerHTML = items.length ? items.map(s => { const c = PM.CATEGORIES.find(x => x.id === s.cat) || PM.CATEGORIES[1]; return `<div class="list-item"><span style="font-size:1.3rem">${c.emoji}</span><div class="grow"><div class="title small">${c.name} · ${fmtMin(s.minutes)}</div>${s.note ? `<div class="muted">${esc(s.note)}</div>` : ""}</div><span class="muted small">${fmtDate(s.date)}</span><button class="btn sm ghost danger" data-delsess="${s.id}" title="Ištrinti">✕</button></div>`; }).join("") : `<div class="empty"><span class="big">📔</span>Čia atsiras tavo praktikos sesijos</div>`;
      $$("[data-delsess]", el).forEach(b => b.onclick = async () => { if (await UI.confirm("Ištrinti šią sesiją?", "Ištrinti")) { S.s.sessions = S.s.sessions.filter(x => x.id !== b.dataset.delsess); S.save(); log(); $("#wb", el).innerHTML = weekBars(); } });
    };
    log();
    $("#tSave", el).onclick = () => {
      const min = Math.round(Timer.elapsed() / 60);
      if (min < 1) return UI.toast("Sesija trumpesnė nei 1 min.");
      saveSession(min, Timer.cat, $("#tNote", el).value.trim()); Timer.reset(); $("#tNote", el).value = "";
      paint(); log(); $("#wb", el).innerHTML = weekBars(); UI.toast(`Išsaugota: ${min} min. (+${min} XP)`);
    };
    $("#manAdd", el).onclick = () => {
      const min = parseInt($("#manMin", el).value, 10);
      if (!(min > 0)) return UI.toast("Įvesk minutes");
      saveSession(min, Timer.cat, $("#tNote", el).value.trim()); $("#manMin", el).value = ""; $("#tNote", el).value = "";
      log(); $("#wb", el).innerHTML = weekBars(); UI.toast(`Pridėta ${min} min.`);
    };

    // Metronomas
    const bpmEl = $("#mBpm", el), rng = $("#mRange", el), nameEl = $("#mName", el), beatsEl = $("#mBeats", el);
    $("#mSub", el).value = M.sub;
    const drawBeats = () => { beatsEl.innerHTML = Array.from({ length: M.beats }, (_, i) => `<i class="${i === 0 ? "first" : ""}"></i>`).join(""); };
    const setBpm = v => {
      M.bpm = Math.max(30, Math.min(240, v)); bpmEl.textContent = M.bpm; rng.value = M.bpm;
      let n = PM.TEMPO_NAMES[0][1]; PM.TEMPO_NAMES.forEach(([b, nm]) => { if (M.bpm >= b) n = nm; }); nameEl.textContent = n;
    };
    setBpm(M.bpm); drawBeats();
    M.onBeat = i => { const dots = $$("i", beatsEl); dots.forEach((d, j) => d.classList.toggle("on", j === i)); };
    rng.oninput = () => setBpm(+rng.value);
    $$("[data-d]", el).forEach(b => b.onclick = () => setBpm(M.bpm + +b.dataset.d));
    $("#mTap", el).onclick = () => setBpm(M.tap());
    $("#mStart", el).onclick = e => { e.target.textContent = M.toggle() ? "■ Stabdyti" : "▶ Groti"; };
    $("#mBeatsSel", el).onchange = e => { M.beats = +e.target.value; drawBeats(); };
    $("#mSub", el).onchange = e => { M.sub = +e.target.value; };

    return () => { clearInterval(iv); M.onBeat = null; };
  }

  /* =========================================================
     KLAVIATŪRA, NATŲ TRENERIS, KLAUSOS LAVINIMAS
     ========================================================= */
  function klaviatura(el) {
    let mode = "natos";
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Groti · skaityti · girdėti</div><h1>Klaviatūra ir natos</h1>
      <p>Prijunk Kawai CA901 USB kabeliu (USB to Host) arba Bluetooth MIDI – klavišai švies čia ekrane. Be pianino gali groti pele ar kompiuterio klaviatūra (A W S E D F T G Y H U J K).</p></div></div>
      <div class="card" style="margin-bottom:18px"><div class="card-title"><h3>🎹 Klaviatūra</h3><span class="muted small" id="lastNote">Paspausk klavišą…</span></div><div class="piano-wrap" id="pianoBox"></div></div>
      <div class="tabs" id="tabs"><button data-t="natos" class="active">🧠 Natų skaitymas</button><button data-t="klausa">👂 Klausos lavinimas</button></div>
      <div id="tabBody"></div>`;

    let onNote = null;
    const piano = buildPiano($("#pianoBox", el), 48, 84, { kbBase: 60, onNote: (m) => { $("#lastNote", el).textContent = A.noteName(m); onNote && onNote(m); } });
    const offKeys = bindComputerKeys(piano, 60);
    const offMidi = bindMidiToPiano(piano, (m) => { $("#lastNote", el).textContent = A.noteName(m); onNote && onNote(m); });

    const tabs = { natos: trainerNotes, klausa: trainerEar };
    let cleanupTab = null;
    const show = t => {
      mode = t; cleanupTab && cleanupTab(); onNote = null; piano.hint(null);
      $$("#tabs button", el).forEach(b => b.classList.toggle("active", b.dataset.t === t));
      cleanupTab = tabs[t]($("#tabBody", el), f => onNote = f, piano);
    };
    $$("#tabs button", el).forEach(b => b.onclick = () => show(b.dataset.t));
    show(mode);
    return () => { offKeys(); offMidi(); cleanupTab && cleanupTab(); };
  }

  function trainerNotes(box, setOnNote, piano) {
    const LET = ["C", "D", "E", "F", "G", "A", "H"], SEMI = [0, 2, 4, 5, 7, 9, 11];
    let clef = "treble", cur = null, streak = 0, ok = 0, tot = 0, showHint = false;
    box.innerHTML = `
      <div class="trainer">
        <div class="card">
          <div class="card-title"><h3>Kokia tai nata?</h3><div class="tabs" style="margin:0" id="clefs"><button data-c="treble" class="active">𝄞 Smuiko</button><button data-c="bass">𝄢 Boso</button><button data-c="both">Abu</button></div></div>
          <div class="staff-box" id="staff"></div>
          <div class="answer-btns">${LET.map((l, i) => `<button data-a="${i}">${l}</button>`).join("")}</div>
          <div class="btn-row" style="margin-top:12px;justify-content:space-between"><label class="small"><input type="checkbox" id="hint"> Rodyti užuominą klaviatūroje</label><span class="muted small">Su MIDI – spausk tikslų klavišą pianine</span></div>
        </div>
        <div class="card">
          <div class="muted">Serija</div><div class="score-big" id="sStreak">0</div>
          <div class="muted">Geriausia serija</div><div class="score-big" id="sBest">${S.s.trainer.bestStreak}</div>
          <div class="muted">Tikslumas šiame seanse</div><div class="score-big" id="sAcc">–</div>
          <div class="tip">H – tai vokiškoji / lietuviškoji B (angl. B) žymėjimo sistema.</div>
        </div>
      </div>`;
    const staff = $("#staff", box);
    const draw = n => {
      const bottom = n.clef === "treble" ? 30 : 18; // E4 arba G2 diatoninis indeksas
      const y0 = 150, gap = 14, yOf = d => y0 - (d - bottom) * (gap / 2);
      let svg = `<svg viewBox="0 0 320 220">`;
      for (let i = 0; i < 5; i++) svg += `<line class="ln" x1="20" x2="300" y1="${y0 - i * gap}" y2="${y0 - i * gap}"/>`;
      svg += n.clef === "treble" ? `<text class="clef" x="24" y="${y0}" style="font-size:108px">𝄞</text>` : `<text class="clef" x="28" y="${y0 - 6}" style="font-size:70px">𝄢</text>`;
      const y = yOf(n.d), x = 190;
      for (let l = bottom - 2; l >= n.d; l -= 2) svg += `<line class="ln" x1="${x - 20}" x2="${x + 20}" y1="${yOf(l)}" y2="${yOf(l)}"/>`;
      for (let l = bottom + 10; l <= n.d; l += 2) svg += `<line class="ln" x1="${x - 20}" x2="${x + 20}" y1="${yOf(l)}" y2="${yOf(l)}"/>`;
      svg += `<ellipse class="nt" cx="${x}" cy="${y}" rx="10" ry="7.5" transform="rotate(-20 ${x} ${y})"/>`;
      const up = n.d < bottom + 4;
      svg += up ? `<line class="ln" x1="${x + 9}" x2="${x + 9}" y1="${y - 2}" y2="${y - 48}" style="stroke-width:1.8"/>` : `<line class="ln" x1="${x - 9}" x2="${x - 9}" y1="${y + 2}" y2="${y + 48}" style="stroke-width:1.8"/>`;
      staff.innerHTML = svg + `</svg>`;
    };
    const next = () => {
      const c = clef === "both" ? (Math.random() < .5 ? "treble" : "bass") : clef;
      const range = c === "treble" ? [28, 40] : [16, 28]; // C4–A5 arba E2–C4
      let d; do { d = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)); } while (cur && d === cur.d && c === cur.clef);
      const oct = Math.floor(d / 7), li = d % 7;
      cur = { clef: c, d, li, midi: 12 * (oct + 1) + SEMI[li] };
      draw(cur); piano.hint(showHint ? cur.midi : null);
    };
    const answer = (correct) => {
      tot++; S.s.trainer.total++;
      if (correct) { ok++; streak++; S.s.trainer.correct++; if (streak > S.s.trainer.bestStreak) S.s.trainer.bestStreak = streak; staff.className = "staff-box ok"; }
      else { streak = 0; staff.className = "staff-box bad"; UI.toast(`Tai buvo ${LET[cur.li]} (${A.noteName(cur.midi)})`); }
      void staff.offsetWidth; S.save(); checkTrainerChallenge();
      $("#sStreak", box).textContent = streak; $("#sBest", box).textContent = S.s.trainer.bestStreak;
      $("#sAcc", box).textContent = Math.round(ok / tot * 100) + "%";
      setTimeout(next, correct ? 250 : 700);
    };
    $$("[data-a]", box).forEach(b => b.onclick = () => { A.noteOn(cur.midi, 70); setTimeout(() => A.noteOff(cur.midi), 400); answer(+b.dataset.a === cur.li); });
    $$("[data-c]", box).forEach(b => b.onclick = () => { clef = b.dataset.c; $$("[data-c]", box).forEach(x => x.classList.toggle("active", x === b)); cur = null; next(); });
    $("#hint", box).onchange = e => { showHint = e.target.checked; piano.hint(showHint ? cur.midi : null); };
    setOnNote(m => answer(m === cur.midi));
    next();
    return () => piano.hint(null);
  }

  function trainerEar(box, setOnNote) {
    const IV = [[1, "m2", "Mažoji sekunda"], [2, "D2", "Didžioji sekunda"], [3, "m3", "Mažoji tercija"], [4, "D3", "Didžioji tercija"], [5, "g4", "Grynoji kvarta"], [6, "tritonas", "Tritonas"], [7, "g5", "Grynoji kvinta"], [8, "m6", "Mažoji seksta"], [9, "D6", "Didžioji seksta"], [10, "m7", "Mažoji septima"], [11, "D7", "Didžioji septima"], [12, "g8", "Oktava"]];
    let set = [3, 4, 5, 7, 12], cur = null, ok = 0, tot = 0, harmonic = false;
    box.innerHTML = `
      <div class="trainer"><div class="card">
        <div class="card-title"><h3>Koks intervalas skamba?</h3><label class="small"><input type="checkbox" id="harm"> Harmoninis (kartu)</label></div>
        <div class="btn-row" style="justify-content:center;margin:20px 0"><button class="btn accent lg" id="play">🔊 Groti dar kartą</button><button class="btn lg" id="nxt">Kitas →</button></div>
        <div class="answer-btns" id="ans" style="grid-template-columns:repeat(4,1fr)"></div>
        <div class="field" style="margin-top:16px"><label>Treniruojami intervalai</label><div class="cat-picker" style="justify-content:flex-start" id="ivs">${IV.map(i => `<button data-iv="${i[0]}">${i[1]}</button>`).join("")}</div></div>
      </div>
      <div class="card"><div class="muted">Teisingai</div><div class="score-big" id="eS">0 / 0</div>
      <div class="tip"><b>Atmintinės:</b> D3 – „Oh When the Saints“, g4 – „Here Comes the Bride“, g5 – „Twinkle Twinkle“, g8 – „Somewhere Over the Rainbow“.</div></div></div>`;
    const drawSet = () => {
      $$("[data-iv]", box).forEach(b => b.classList.toggle("active", set.includes(+b.dataset.iv)));
      $("#ans", box).innerHTML = IV.filter(i => set.includes(i[0])).map(i => `<button data-ans="${i[0]}" title="${i[2]}" style="font-size:.85rem">${i[1]}</button>`).join("");
      $$("[data-ans]", box).forEach(b => b.onclick = () => {
        if (!cur) return; tot++;
        if (+b.dataset.ans === cur.iv) { ok++; UI.toast("Teisingai! 🎉"); cur = null; setTimeout(nextQ, 600); }
        else UI.toast(`Ne – tai ${IV.find(i => i[0] === cur.iv)[2].toLowerCase()}`);
        $("#eS", box).textContent = `${ok} / ${tot}`;
      });
    };
    const play = () => {
      if (!cur) return; const { a, iv } = cur, b = a + iv;
      A.noteOn(a, 80); setTimeout(() => A.noteOff(a), harmonic ? 1200 : 600);
      setTimeout(() => { A.noteOn(b, 80); setTimeout(() => A.noteOff(b), 900); }, harmonic ? 0 : 650);
    };
    const nextQ = () => { const iv = set[Math.floor(Math.random() * set.length)]; cur = { a: 55 + Math.floor(Math.random() * 12), iv }; play(); };
    $$("[data-iv]", box).forEach(b => b.onclick = () => { const v = +b.dataset.iv; if (set.includes(v)) { if (set.length > 2) set = set.filter(x => x !== v); } else set.push(v); set.sort((x, y) => x - y); drawSet(); });
    $("#play", box).onclick = () => cur ? play() : nextQ();
    $("#nxt", box).onclick = nextQ;
    $("#harm", box).onchange = e => harmonic = e.target.checked;
    drawSet(); setOnNote(null);
    return () => {};
  }

  /* =========================================================
     IŠŠŪKIAI
     ========================================================= */
  function challengeProgress(c) {
    const st = S.s.challenges[c.id] || {};
    let n = 0, total = c.days || c.target;
    if (c.type === "daily") n = (st.days || []).length;
    else if (c.type === "trainer") n = Math.min(total, S.s.trainer.bestStreak);
    else if (c.type === "minutes") n = Math.min(total, S.totalMinutes());
    else if (c.type === "recordings") n = Math.min(total, PM._recCount || 0);
    return { n, total, pct: Math.min(100, n / total * 100), label: `${n}/${total}` };
  }
  function checkTrainerChallenge() { autoComplete(); }
  function autoComplete() {
    let changed = false;
    PM.CHALLENGES.filter(c => c.type !== "daily").forEach(c => {
      const st = S.s.challenges[c.id];
      if (st && !st.doneAt && challengeProgress(c).n >= c.target) { st.doneAt = S.today(); changed = true; UI.toast(`🏆 Iššūkis įveiktas: ${c.title}! +${c.xp} XP`); }
    });
    if (changed) S.save();
  }
  PM.autoComplete = autoComplete;

  function issukiai(el) {
    const render = () => {
      el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Motyvacija</div><h1>Iššūkiai</h1><p>Pasirink iššūkį ir kasdien pažymėk atliktą dieną. Kai kurie iššūkiai sekami automatiškai – iš praktikos, natų trenerio ir įrašų.</p></div></div>
      <div class="grid g3">${PM.CHALLENGES.map(c => {
        const st = S.s.challenges[c.id], p = challengeProgress(c), todayDone = st && (st.days || []).includes(S.today());
        return `<div class="card challenge">
          <div class="card-title"><span class="emoji">${c.emoji}</span>${st && st.doneAt ? `<span class="chip green">✓ Įveikta</span>` : st ? `<span class="chip accent">Vyksta</span>` : `<span class="chip">+${c.xp} XP</span>`}</div>
          <h3>${esc(c.title)}</h3><p class="muted">${esc(c.desc)}</p>
          ${c.type === "daily" && c.days > 1 ? `<div class="days">${Array.from({ length: c.days }, (_, i) => `<i class="${i < p.n ? "d" : ""}"></i>`).join("")}</div>` : `<div class="progress" style="margin:12px 0"><i style="width:${st ? p.pct : 0}%"></i></div>`}
          <div class="btn-row" style="justify-content:space-between"><span class="muted small">${st ? p.label : ""}</span>
          ${!st ? `<button class="btn sm primary" data-start="${c.id}">Pradėti</button>`
            : st.doneAt ? `<button class="btn sm ghost" data-restart="${c.id}">Kartoti</button>`
            : c.type === "daily" ? `<button class="btn sm accent" data-day="${c.id}" ${todayDone ? "disabled" : ""}>${todayDone ? "Šiandien ✓" : "Šiandien atlikta"}</button>`
            : `<span class="chip blue">Sekama automatiškai</span>`}</div>
        </div>`;
      }).join("")}</div>`;
      $$("[data-start]", el).forEach(b => b.onclick = () => { S.s.challenges[b.dataset.start] = { startedAt: S.today(), days: [] }; S.save(); autoComplete(); render(); });
      $$("[data-restart]", el).forEach(b => b.onclick = () => { S.s.xpBonus = (S.s.xpBonus || 0) + ((PM.CHALLENGES.find(c => c.id === b.dataset.restart) || {}).xp || 0); S.s.challenges[b.dataset.restart] = { startedAt: S.today(), days: [] }; S.save(); render(); });
      $$("[data-day]", el).forEach(b => b.onclick = () => {
        const c = PM.CHALLENGES.find(x => x.id === b.dataset.day), st = S.s.challenges[c.id];
        st.days = st.days || []; if (!st.days.includes(S.today())) st.days.push(S.today());
        if (st.days.length >= c.days) { st.doneAt = S.today(); UI.toast(`🏆 ${c.title} – įveikta! +${c.xp} XP`); } else UI.toast("Diena pažymėta 💪");
        S.save(); render();
      });
    };
    render();
  }

  /* =========================================================
     ĮRAŠŲ STUDIJA
     ========================================================= */
  function studija(el) {
    let stream = null, rec = null, chunks = [], t0 = 0, raf = 0, tick = 0, an = null, urls = [], stopPlay = null, midiRecording = false;
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Mano kūriniai</div><h1>Įrašų studija</h1>
      <p>Įrašyk garsą per mikrofoną ar garso plokštę, arba MIDI tiesiai iš Kawai CA901. Įrašai saugomi šioje naršyklėje – svarbiausius atsisiųsk ir laikyk OneDrive.</p></div></div>
      <div class="grid g2">
        <div class="card">
          <div class="card-title"><h3>🎙️ Garso įrašas</h3><span class="chip" id="aState">Paruošta</span></div>
          <div class="field"><label>Įvesties šaltinis</label><select id="aDev"><option value="">Numatytasis mikrofonas</option></select></div>
          <button class="rec-btn" id="aRec" title="Įrašyti"><i></i></button>
          <div class="rec-time" id="aTime">00:00</div>
          <div class="meter"><i id="aMeter"></i></div>
          <div class="muted small">Įrašoma be triukšmo slopinimo ir automatinio garsumo – natūraliam pianino skambesiui.</div>
        </div>
        <div class="card">
          <div class="card-title"><h3>🎹 MIDI įrašas</h3><span class="chip" id="mState">${A.Midi.inputs.length ? "Pianinas prijungtas" : "Prijunk pianiną"}</span></div>
          <p class="muted">MIDI įrašas išsaugo kiekvieną paspaudimą, jo stiprumą ir pedalą. Vėliau atsisiųsk <b>.mid</b> failą ir atidaryk GarageBand, Logic, MuseScore ar grok atgal per Kawai garsą.</p>
          <div class="rec-time" id="mTime">00:00</div>
          <div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn accent lg" id="mRec" ${A.Midi.supported ? "" : "disabled"}>● Įrašyti MIDI</button></div>
          ${A.Midi.supported ? "" : `<div class="tip"><b>Dėmesio:</b> ši naršyklė nepalaiko Web MIDI. Naudok Chrome arba Edge.</div>`}
        </div>
      </div>
      <div class="card" style="margin-top:18px"><div class="card-title"><h3>📀 Mano įrašai</h3><span class="muted" id="recCount"></span></div><div id="recList"></div></div>`;

    const aState = $("#aState", el), aBtn = $("#aRec", el), aTime = $("#aTime", el), meter = $("#aMeter", el);
    async function listDevices() {
      try {
        const devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "audioinput");
        const sel = $("#aDev", el), v = sel.value;
        sel.innerHTML = devs.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || "Įvestis " + (i + 1))}</option>`).join("") || `<option value="">Numatytasis mikrofonas</option>`;
        if (v) sel.value = v;
      } catch (e) {}
    }
    listDevices();

    async function startAudio() {
      try {
        const id = $("#aDev", el).value;
        stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: id ? { exact: id } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2 } });
      } catch (e) { return UI.toast("Nepavyko pasiekti mikrofono – leisk prieigą naršyklėje"); }
      listDevices();
      const c = A.ac(), src = c.createMediaStreamSource(stream); an = c.createAnalyser(); an.fftSize = 1024; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const loop = () => { an.getFloatTimeDomainData(buf); let pk = 0; for (const v of buf) pk = Math.max(pk, Math.abs(v)); meter.style.width = Math.min(100, pk * 100) + "%"; raf = requestAnimationFrame(loop); };
      loop();
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 256000 } : undefined);
      chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" }), dur = (Date.now() - t0) / 1000;
        await S.recs.put({ id: S.uid(), kind: "audio", name: `Įrašas ${new Date().toLocaleString("lt-LT")}`, created: Date.now(), duration: dur, blob, mime: blob.type, notes: "" });
        UI.toast("Įrašas išsaugotas 🎉"); listRecs();
      };
      rec.start(1000); t0 = Date.now();
      aBtn.classList.add("recording"); aState.textContent = "● Įrašoma"; aState.className = "chip accent";
      tick = setInterval(() => aTime.textContent = fmtClock((Date.now() - t0) / 1000), 250);
    }
    function stopAudio() {
      if (rec && rec.state !== "inactive") rec.stop();
      stream && stream.getTracks().forEach(t => t.stop()); stream = null;
      cancelAnimationFrame(raf); clearInterval(tick); meter.style.width = "0";
      aBtn.classList.remove("recording"); aState.textContent = "Paruošta"; aState.className = "chip";
    }
    aBtn.onclick = () => (rec && rec.state === "recording") ? stopAudio() : startAudio();

    // MIDI
    const mBtn = $("#mRec", el); let mTick = 0, mT0 = 0;
    mBtn.onclick = async () => {
      if (!midiRecording) {
        if (!A.Midi.inputs.length) { await A.Midi.init(); if (!A.Midi.inputs.length) return UI.toast("Nerasta MIDI įrenginių – prijunk pianiną USB kabeliu"); }
        A.MidiRec.start(); midiRecording = true; mT0 = Date.now();
        mBtn.textContent = "■ Stabdyti"; $("#mState", el).textContent = "● Įrašoma";
        mTick = setInterval(() => $("#mTime", el).textContent = fmtClock((Date.now() - mT0) / 1000), 250);
      } else {
        const evs = A.MidiRec.stop(); midiRecording = false; clearInterval(mTick);
        mBtn.textContent = "● Įrašyti MIDI"; $("#mState", el).textContent = "Pianinas prijungtas";
        if (!evs.some(e => e.type === "on")) return UI.toast("Nebuvo sugrota nė viena nata");
        await S.recs.put({ id: S.uid(), kind: "midi", name: `MIDI ${new Date().toLocaleString("lt-LT")}`, created: Date.now(), duration: evs[evs.length - 1].t / 1000, events: evs, notes: "" });
        UI.toast("MIDI įrašas išsaugotas 🎹"); listRecs();
      }
    };

    async function listRecs() {
      urls.forEach(URL.revokeObjectURL); urls = [];
      let recs = [];
      try { recs = await S.recs.all(); } catch (e) {}
      PM._recCount = recs.length; autoComplete();
      $("#recCount", el).textContent = recs.length ? `${recs.length} įraš.` : "";
      const box = $("#recList", el);
      if (!recs.length) { box.innerHTML = `<div class="empty"><span class="big">📀</span>Dar nėra įrašų. Pirmasis įrašas – svarbus etapas!</div>`; return; }
      box.innerHTML = recs.map(r => {
        let player = "";
        if (r.kind === "audio") { const u = URL.createObjectURL(r.blob); urls.push(u); player = `<audio controls preload="none" src="${u}"></audio>`; }
        return `<div class="track"><div class="art">${r.kind === "audio" ? "🎧" : "🎹"}</div>
          <div class="grow"><div class="title">${esc(r.name)}</div><div class="muted small">${new Date(r.created).toLocaleDateString("lt-LT")} · ${fmtClock(r.duration || 0)} · ${r.kind === "audio" ? "Garsas" : "MIDI"}${r.notes ? " · " + esc(r.notes) : ""}</div>${player}</div>
          <div class="btn-row">
            ${r.kind === "midi" ? `<button class="btn sm" data-play="${r.id}">▶ Groti</button>` : ""}
            <button class="btn sm" data-dl="${r.id}">⬇</button><button class="btn sm" data-ren="${r.id}">✎</button><button class="btn sm danger" data-del="${r.id}">✕</button></div></div>`;
      }).join("");
      const find = id => recs.find(r => r.id === id);
      $$("[data-play]", box).forEach(b => b.onclick = () => {
        if (stopPlay) { stopPlay(); stopPlay = null; $$("[data-play]", box).forEach(x => x.textContent = "▶ Groti"); return; }
        b.textContent = "■ Stop"; stopPlay = A.MidiRec.play(find(b.dataset.play).events, () => { stopPlay = null; b.textContent = "▶ Groti"; });
      });
      $$("[data-dl]", box).forEach(b => b.onclick = () => {
        const r = find(b.dataset.dl), safe = r.name.replace(/[^\wąčęėįšųūž\- ]/gi, "_");
        if (r.kind === "audio") UI.download(r.blob, `${safe}.${(r.mime || "").includes("mp4") ? "m4a" : "webm"}`);
        else UI.download(A.MidiRec.toFile(r.events), `${safe}.mid`);
      });
      $$("[data-ren]", box).forEach(b => b.onclick = () => {
        const r = find(b.dataset.ren);
        UI.modal(`<h2>Įrašo informacija</h2><div class="field"><label>Pavadinimas</label><input type="text" id="rn" value="${esc(r.name)}"></div><div class="field"><label>Užrašai</label><textarea id="rnn">${esc(r.notes || "")}</textarea></div><div class="btn-row" style="justify-content:flex-end"><button class="btn" data-close>Atšaukti</button><button class="btn accent" id="rs">Išsaugoti</button></div>`,
          (m, close) => $("#rs", m).onclick = async () => { r.name = $("#rn", m).value.trim() || r.name; r.notes = $("#rnn", m).value.trim(); await S.recs.put(r); close(); listRecs(); });
      });
      $$("[data-del]", box).forEach(b => b.onclick = async () => { if (await UI.confirm("Ištrinti įrašą visam laikui? Šio veiksmo atšaukti negalima.", "Ištrinti")) { await S.recs.del(b.dataset.del); listRecs(); } });
    }
    listRecs();
    return () => { stopAudio(); if (midiRecording) A.MidiRec.stop(); clearInterval(mTick); stopPlay && stopPlay(); urls.forEach(URL.revokeObjectURL); };
  }

  /* =========================================================
     REPERTUARAS
     ========================================================= */
  function repertuaras(el) {
    let filter = "all";
    const editor = (r) => {
      r = r || { id: null, title: "", composer: "", status: "noriu", level: S.currentLevel().id, notes: "" };
      UI.modal(`<h2>${r.id ? "Redaguoti kūrinį" : "Naujas kūrinys"}</h2>
        <div class="field"><label>Pavadinimas</label><input type="text" id="rt" value="${esc(r.title)}" placeholder="pvz., Gymnopédie nr. 1"></div>
        <div class="field"><label>Kompozitorius</label><input type="text" id="rc" value="${esc(r.composer)}" placeholder="pvz., Erik Satie arba „Mano kūrinys“"></div>
        <div class="row"><div class="field"><label>Būsena</label><select id="rs">${PM.REP_STATUS.map(s => `<option value="${s.id}" ${s.id === r.status ? "selected" : ""}>${s.name}</option>`).join("")}</select></div>
        <div class="field"><label>Lygis</label><select id="rl">${PM.LEVELS.map(L => `<option value="${L.id}" ${L.id == r.level ? "selected" : ""}>${L.id}. ${L.name}</option>`).join("")}</select></div></div>
        <div class="field"><label>Užrašai (tempas, sunkios vietos, natų nuoroda)</label><textarea id="rn">${esc(r.notes)}</textarea></div>
        <div class="btn-row" style="justify-content:space-between">${r.id ? `<button class="btn danger" id="rdel">Ištrinti</button>` : "<span></span>"}<div class="btn-row"><button class="btn" data-close>Atšaukti</button><button class="btn accent" id="rsave">Išsaugoti</button></div></div>`,
        (m, close) => {
          $("#rsave", m).onclick = () => {
            const title = $("#rt", m).value.trim(); if (!title) return UI.toast("Įvesk pavadinimą");
            const data = { title, composer: $("#rc", m).value.trim(), status: $("#rs", m).value, level: +$("#rl", m).value, notes: $("#rn", m).value.trim() };
            if (r.id) Object.assign(S.s.repertoire.find(x => x.id === r.id), data);
            else S.s.repertoire.push({ id: S.uid(), added: S.today(), ...data });
            S.save(); close(); render();
          };
          const d = $("#rdel", m); if (d) d.onclick = () => { S.s.repertoire = S.s.repertoire.filter(x => x.id !== r.id); S.save(); close(); render(); };
        });
    };
    const render = () => {
      const all = S.s.repertoire, list = filter === "all" ? all : all.filter(r => r.status === filter);
      el.innerHTML = `
        <div class="page-head"><div><div class="eyebrow">Mano biblioteka</div><h1>Repertuaras</h1><p>Kūriniai, kuriuos noriu išmokti, mokausi, moku ir galiu groti scenoje. Spustelėk būseną, kad ją pakeistum.</p></div><button class="btn primary" id="add">＋ Naujas kūrinys</button></div>
        <div class="tabs" id="flt"><button data-f="all">Visi (${all.length})</button>${PM.REP_STATUS.map(s => `<button data-f="${s.id}">${s.name} (${all.filter(r => r.status === s.id).length})</button>`).join("")}</div>
        <div class="card">${list.length ? `<div class="list">${list.map(r => { const s = PM.REP_STATUS.find(x => x.id === r.status) || PM.REP_STATUS[0]; return `
          <div class="list-item"><span style="font-size:1.4rem">${(PM.LEVELS[r.level] || PM.LEVELS[0]).emoji}</span>
          <div class="grow"><div class="title">${esc(r.title)}</div><div class="muted small">${esc(r.composer || "—")}${r.notes ? " · " + esc(r.notes) : ""}</div></div>
          <button class="chip ${s.cls}" style="border:none;cursor:pointer" data-cycle="${r.id}">${s.name}</button>
          <button class="btn sm ghost" data-edit="${r.id}">✎</button></div>`; }).join("")}</div>`
          : `<div class="empty"><span class="big">📚</span>Sąrašas tuščias. Pridėk kūrinį arba įtrauk repertuarą iš <a href="#/kelias">mokymosi kelio</a>.</div>`}</div>
        <div class="tip"><b>Natos nemokamai:</b> daugumą klasikinių kūrinių (Bach, Chopin, Satie, Čiurlionis…) rasi viešojo domeno bibliotekoje <a href="https://imslp.org" target="_blank" rel="noopener">IMSLP.org</a>.</div>`;
      $$("#flt button", el).forEach(b => { b.classList.toggle("active", b.dataset.f === filter); b.onclick = () => { filter = b.dataset.f; render(); }; });
      $("#add", el).onclick = () => editor();
      $$("[data-edit]", el).forEach(b => b.onclick = () => editor({ ...S.s.repertoire.find(r => r.id === b.dataset.edit) }));
      $$("[data-cycle]", el).forEach(b => b.onclick = () => { const r = S.s.repertoire.find(x => x.id === b.dataset.cycle), i = PM.REP_STATUS.findIndex(s => s.id === r.status); r.status = PM.REP_STATUS[(i + 1) % PM.REP_STATUS.length].id; S.save(); render(); });
    };
    render();
  }

  /* =========================================================
     PASIRODYMAI
     ========================================================= */
  function pasirodymai(el) {
    const editor = p => {
      p = p || { id: null, title: "", date: S.today(), place: "", program: "", notes: "", checks: {} };
      UI.modal(`<h2>${p.id ? "Redaguoti" : "Naujas"} pasirodymas</h2>
        <div class="field"><label>Pavadinimas</label><input type="text" id="pt" value="${esc(p.title)}" placeholder="pvz., Kalėdinis namų koncertas"></div>
        <div class="row"><div class="field"><label>Data</label><input type="date" id="pd" value="${esc(p.date)}"></div><div class="field"><label>Vieta</label><input type="text" id="pp" value="${esc(p.place)}" placeholder="Namai, salė, festivalis…"></div></div>
        <div class="field"><label>Programa (po vieną kūrinį eilutėje)</label><textarea id="ppr">${esc(p.program)}</textarea></div>
        <div class="field"><label>Užrašai</label><textarea id="pn">${esc(p.notes)}</textarea></div>
        <div class="btn-row" style="justify-content:space-between">${p.id ? `<button class="btn danger" id="pdel">Ištrinti</button>` : "<span></span>"}<div class="btn-row"><button class="btn" data-close>Atšaukti</button><button class="btn accent" id="psave">Išsaugoti</button></div></div>`,
        (m, close) => {
          $("#psave", m).onclick = () => {
            const title = $("#pt", m).value.trim(); if (!title) return UI.toast("Įvesk pavadinimą");
            const data = { title, date: $("#pd", m).value, place: $("#pp", m).value.trim(), program: $("#ppr", m).value.trim(), notes: $("#pn", m).value.trim() };
            if (p.id) Object.assign(S.s.performances.find(x => x.id === p.id), data); else S.s.performances.push({ id: S.uid(), checks: {}, ...data });
            S.save(); close(); render();
          };
          const d = $("#pdel", m); if (d) d.onclick = () => { S.s.performances = S.s.performances.filter(x => x.id !== p.id); S.save(); close(); render(); };
        });
    };
    const render = () => {
      const list = S.s.performances.slice().sort((a, b) => b.date.localeCompare(a.date));
      el.innerHTML = `
        <div class="page-head"><div><div class="eyebrow">Scena</div><h1>Pasirodymai</h1><p>Kiekvienas pasirodymas – nuo namų koncerto iki didžiosios salės – auga iš pasiruošimo. Planuok, ruoškis pagal kontrolinį sąrašą ir įrašyk įspūdžius.</p></div><button class="btn primary" id="add">＋ Naujas pasirodymas</button></div>
        ${list.length ? `<div class="grid g2">${list.map(p => {
          const days = Math.ceil((new Date(p.date) - new Date(S.today())) / 864e5), done = Object.values(p.checks || {}).filter(Boolean).length;
          return `<div class="card">
            <div class="card-title"><div><h3>${esc(p.title)}</h3><div class="muted small">${fmtDate(p.date)}${p.place ? " · " + esc(p.place) : ""}</div></div>
            <span class="chip ${days < 0 ? "green" : "accent"}">${days < 0 ? "Įvyko" : days === 0 ? "Šiandien!" : `po ${days} d.`}</span></div>
            ${p.program ? `<div class="small" style="margin-bottom:10px">${p.program.split("\n").map(l => `🎵 ${esc(l)}`).join("<br>")}</div>` : ""}
            <div class="muted small" style="margin:8px 0 4px">Pasiruošimas: ${done}/${PM.STAGE_CHECKLIST.length}</div><div class="progress"><i style="width:${done / PM.STAGE_CHECKLIST.length * 100}%"></i></div>
            <details style="margin-top:8px"><summary class="small" style="cursor:pointer;color:var(--accent);font-weight:600">Kontrolinis sąrašas</summary>
            ${PM.STAGE_CHECKLIST.map((c, i) => `<label class="small" style="display:flex;gap:8px;margin:6px 0"><input type="checkbox" data-pc="${p.id}" data-i="${i}" ${p.checks && p.checks[i] ? "checked" : ""}> ${esc(c)}</label>`).join("")}</details>
            ${p.notes ? `<p class="muted small" style="margin-top:8px">${esc(p.notes)}</p>` : ""}
            <div class="btn-row" style="margin-top:10px"><button class="btn sm" data-edit="${p.id}">✎ Redaguoti</button></div></div>`;
        }).join("")}</div>`
        : `<div class="card"><div class="empty"><span class="big">🎭</span>Dar nėra pasirodymų. Pradėk nuo mažo – 1 kūrinys šeimai jau yra koncertas!</div></div>`}`;
      $("#add", el).onclick = () => editor();
      $$("[data-edit]", el).forEach(b => b.onclick = () => editor({ ...S.s.performances.find(x => x.id === b.dataset.edit) }));
      $$("[data-pc]", el).forEach(c => c.onchange = () => { const p = S.s.performances.find(x => x.id === c.dataset.pc); p.checks = p.checks || {}; p.checks[c.dataset.i] = c.checked; S.save(); render(); });
    };
    render();
  }

  /* =========================================================
     ĮRANGA
     ========================================================= */
  function iranga(el) {
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Studija namuose</div><h1>Mano įranga</h1><p>Kaip sujungti Kawai CA901, FiiO K7 ir Sennheiser HD 800 S praktikai, klausymuisi ir įrašams.</p></div></div>
      <div class="grid g3" style="margin-bottom:18px">
        <div class="card"><div style="font-size:2rem">🎹</div><h3>Kawai CA901 (baltas)</h3><p class="muted small">Skaitmeninis pianinas su medine Grand Feel klaviatūra ir Shigeru Kawai koncertinio fortepijono garso imitacija. Turi ausinių lizdus, linijinį išėjimą, USB ir Bluetooth jungtis.</p></div>
        <div class="card"><div style="font-size:2rem">🔊</div><h3>FiiO K7</h3><p class="muted small">Stalinis <b>DAC + ausinių stiprintuvas viename</b>. Atskiro DAK pirkti nereikia – K7 jau jį turi. Prie kompiuterio jungiamas USB.</p></div>
        <div class="card"><div style="font-size:2rem">🎧</div><h3>Sennheiser HD 800 S</h3><p class="muted small">Atviro tipo studijinės ausinės (300 Ω) su labai plačia erdve. K7 jas varo be vargo. Atviros – aplinkiniai šiek tiek girdi, o tu girdi aplinką.</p></div>
      </div>
      <div class="card" style="margin-bottom:18px"><h2>🎧 1 schema: grojimas ir Piano Man naudojimas</h2>
        <div class="chain"><div class="node"><b>Kawai CA901</b><span>USB to Host</span></div><span class="arrow">→</span><div class="node"><b>Kompiuteris / iPad</b><span>Piano Man (Chrome/Edge)</span></div><span class="arrow">→</span><div class="node"><b>FiiO K7</b><span>USB DAC</span></div><span class="arrow">→</span><div class="node"><b>HD 800 S</b><span>6,35 mm / balansinis</span></div></div>
        <p class="muted small">USB kabeliu (A–B tipo, kaip spausdintuvo) MIDI keliauja į Piano Man: veikia klaviatūros vizualizacija, natų treneris ir MIDI įrašai.</p></div>
      <div class="card" style="margin-bottom:18px"><h2>🎹 2 schema: Kawai garsas per HD 800 S</h2>
        <div class="chain"><div class="node"><b>Kawai CA901</b><span>LINE OUT</span></div><span class="arrow">→</span><div class="node"><b>FiiO K7</b><span>analoginis LINE IN (RCA)</span></div><span class="arrow">→</span><div class="node"><b>HD 800 S</b><span>aukščiausia kokybė</span></div></div>
        <p class="muted small">Arba paprasčiausia – ausines jungti tiesiai į pianino ausinių lizdą. Per K7 skambės švariau ir galingiau. Prieš perkant kabelius pasitikrink K7 ir CA901 jungtis instrukcijose.</p></div>
      <div class="card" style="margin-bottom:18px"><h2>🎙️ 3 schema: įrašai</h2>
        <div class="grid g3">
          <div><h3>A. MIDI (nemokama, jau dabar)</h3><p class="small muted">Kawai → USB → Piano Man Studija → .mid failas. Puiku analizei ir natų generavimui (MuseScore).</p></div>
          <div><h3>B. Į USB atmintinę</h3><p class="small muted">CA901 turi integruotą įrašymo funkciją į USB atmintinę (USB to Device). Garso failą perkelk į kompiuterį ir įkelk į Piano Man.</p></div>
          <div><h3>C. Studijinė kokybė</h3><p class="small muted">Kawai LINE OUT (L/R) → garso plokštė (pvz., Focusrite Scarlett 2i2, Audient iD4) → kompiuteris. Piano Man Studijoje pasirink ją kaip įvestį.</p></div>
        </div>
        <div class="tip"><b>Svarbu:</b> FiiO K7 yra skirtas klausymui (išvestis), jis <b>neturi įvesties įrašymui</b>. Studijinės kokybės įrašams reikės nedidelės garso plokštės (~120–200 €). Tada ausines gali jungti į garso plokštę įrašant, o K7 naudoti klausymuisi.</div></div>
      <div class="card"><h2>✅ Prieš pirkdama įrangą</h2><ul class="small">
        <li>USB A–B kabelis Kawai ↔ kompiuteris (dažnai įeina į komplektą – patikrink).</li>
        <li>2× 6,35 mm (TRS/TS) → 2× RCA kabelis: Kawai LINE OUT → K7 LINE IN.</li>
        <li>Dirbant iš iPad – USB-C ↔ USB-B kabelis arba Bluetooth MIDI.</li>
        <li>Ausinių stovas HD 800 S – jos jautrios ir brangios 😊</li>
        <li>Pianino suolelis su reguliuojamu aukščiu (dažnai pateikiamas kartu su CA901).</li></ul></div>`;
  }

  /* =========================================================
     NUSTATYMAI
     ========================================================= */
  function nustatymai(el) {
    const st = S.s.settings;
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Asmeniška</div><h1>Nustatymai</h1></div></div>
      <div class="grid g2">
        <div class="card"><h3>👤 Profilis</h3>
          <div class="field"><label>Vardas</label><input type="text" id="sName" value="${esc(st.name)}" placeholder="Kaip į tave kreiptis?"></div>
          <div class="field"><label>Dienos tikslas (min.)</label><input type="number" id="sGoal" min="5" max="600" value="${st.dailyGoal}"></div>
          <div class="field"><label>Tema</label><select id="sTheme"><option value="light">☀️ Šviesi (dramblio kaulas)</option><option value="dark">🌙 Tamsi (vakaro scena)</option></select></div>
          <button class="btn primary" id="sSave">Išsaugoti</button></div>
        <div class="card"><h3>💾 Duomenų atsarginė kopija</h3>
          <p class="muted small">Pažanga saugoma šioje naršyklėje. Norėdama tęsti kitame įrenginyje, eksportuok failą (pvz., į OneDrive) ir importuok ten. Įrašai (garsas) neįeina – juos atsisiųsk atskirai Studijoje.</p>
          <div class="btn-row"><button class="btn" id="exp">⬇ Eksportuoti</button><label class="btn">⬆ Importuoti<input type="file" id="imp" accept="application/json" hidden></label></div>
          <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
          <button class="btn danger" id="rst">Ištrinti visą pažangą</button></div>
      </div>`;
    $("#sTheme", el).value = st.theme;
    $("#sSave", el).onclick = () => { st.name = $("#sName", el).value.trim(); st.dailyGoal = Math.max(5, parseInt($("#sGoal", el).value, 10) || 30); st.theme = $("#sTheme", el).value; S.save(); PM.applyTheme(); UI.toast("Išsaugota ✓"); };
    $("#exp", el).onclick = () => UI.download(new Blob([S.exportJSON()], { type: "application/json" }), `piano-man-${S.today()}.json`);
    $("#imp", el).onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { S.importJSON(t); PM.applyTheme(); UI.toast("Duomenys importuoti ✓"); nustatymai(el); } catch (er) { UI.toast("Netinkamas failas"); } }); };
    $("#rst", el).onclick = async () => { if (await UI.confirm("Bus ištrinta visa pažanga, sesijos, repertuaras ir pasirodymai (įrašai Studijoje liks). Atšaukti negalima.", "Ištrinti viską")) { S.reset(); PM.applyTheme(); UI.toast("Pažanga ištrinta"); nustatymai(el); } };
  }

  PM.Views = { "": home, kelias, praktika, klaviatura, issukiai, studija, repertuaras, pasirodymai, iranga, nustatymai };
})();
