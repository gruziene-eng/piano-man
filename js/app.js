/* Piano Man — maršrutizatorius ir paleidimas */
(function () {
  const S = PM.Store, A = PM.Audio;
  const view = document.getElementById("view");
  let cleanup = null;

  PM.applyTheme = () => {
    const dark = S.s.settings.theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.getElementById("themeToggle").textContent = dark ? "☀️" : "🌙";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#15141a" : "#f7f3ec";
  };

  function updateXP() {
    const r = S.rank();
    document.getElementById("xpPillTop").textContent = `⭐ ${r.xp} XP`;
  }

  function route() {
    const key = (location.hash.replace(/^#\/?/, "").split("/")[0]) || "";
    const fn = PM.Views[key] || PM.Views[""];
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("active", a.dataset.route === key));
    document.getElementById("sidebar").classList.remove("open");
    view.innerHTML = "";
    cleanup = fn(view) || null;
    window.scrollTo(0, 0);
    updateXP();
  }

  function midiStatus(inputs) {
    const el = document.getElementById("midiStatus");
    const on = inputs && inputs.length;
    el.classList.toggle("on", !!on);
    el.querySelector(".txt").textContent = on ? inputs[0].name || "MIDI prijungtas" : (A.Midi.supported ? "MIDI neprijungtas" : "MIDI: naudok Chrome");
  }

  // Paleidimas
  PM.applyTheme();
  S.onChange(updateXP);
  window.addEventListener("hashchange", route);
  document.getElementById("themeToggle").onclick = () => {
    S.s.settings.theme = S.s.settings.theme === "dark" ? "light" : "dark"; S.save(); PM.applyTheme();
  };
  document.getElementById("menuBtn").onclick = () => document.getElementById("sidebar").classList.toggle("open");

  A.Midi.statusHandlers.add(midiStatus);
  midiStatus([]);
  A.Midi.init();
  // MIDI garsas: kai groji Kawai, Piano Man pats negroja (girdi pianino garsą),
  // bet „klik“ ant ekrano klaviatūros naudoja sintezatorių.
  document.getElementById("midiStatus").onclick = () => A.Midi.init().then(ok => !ok && PM.UI.toast("MIDI nepasiekiamas – naudok Chrome arba Edge ir leisk prieigą"));

  // Įrašų skaičius iššūkiams
  S.recs.all().then(r => { PM._recCount = r.length; PM.autoComplete(); }).catch(() => {});

  route();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
