/* Piano Man — turinys: mokymosi kelias, iššūkiai, citatos */
window.PM = window.PM || {};

PM.LEVELS = [
  {
    id: 0, emoji: "🌱", name: "Pirmas prisilietimas", time: "0–1 mėn.", daily: "15–20 min./d.",
    goal: "Susipažinti su instrumentu, taisyklinga sėdėsena ir pirmosiomis melodijomis.",
    lessons: [
      ["Sėdėsena ir rankų forma", "Suolelio aukštis, alkūnės klaviatūros lygyje, „apvali obuolio“ plaštaka."],
      ["Klaviatūros geografija", "Juodų klavišų grupės po 2 ir 3, visų C, F ir G radimas."],
      ["Pirštų numeracija", "1 – nykštys … 5 – mažylis, abiem rankom."],
      ["Pulsas ir ritmas", "Sveikoji, pusinė, ketvirtinė natos; skaičiavimas balsu."],
      ["Penkių pirštų pozicija C", "C–D–E–F–G dešine ir kaire ranka."],
      ["Pirmoji melodija", "„Odė džiaugsmui“ dešine ranka lėtu tempu."],
      ["Pažintis su metronomu", "Grok ketvirtines 60 BPM tempu, kiekvienam spragtelėjimui po natą."],
      ["Kasdienė rutina", "Sukurk 15 min. praktikos įprotį 7 dienas iš eilės."]
    ],
    repertoire: ["Beethoven – „Odė džiaugsmui“ (supaprastinta)", "„Mary Had a Little Lamb“", "Penkių pirštų pratimai C pozicijoje"]
  },
  {
    id: 1, emoji: "🎼", name: "Pagrindai", time: "1–4 mėn.", daily: "20–30 min./d.",
    goal: "Skaityti natas abiejuose raktuose ir koordinuoti abi rankas.",
    lessons: [
      ["Smuiko raktas", "Linijos E-G-H-D-F, tarpai F-A-C-E (vokiška H = angl. B)."],
      ["Boso raktas", "Linijos G-H-D-F-A, tarpai A-C-E-G."],
      ["Intervalai", "Sekundos–oktavos: atpažink regėdama ir klausydama."],
      ["Gamos C, G, F mažoras", "Viena oktava atskiromis rankomis, teisinga aplikatūra (nykščio pakišimas)."],
      ["Triados", "Mažorinės ir minorinės triados nuo baltų klavišų."],
      ["Legato ir staccato", "Rišlus ir trumpas garsas; artikuliacija."],
      ["Abiejų rankų koordinacija", "Melodija dešine + vienas bosas kaire."],
      ["Dinamika", "p, mf, f, crescendo ir diminuendo."],
      ["Aštuntinės ir taškuotas ritmas", "Skaičiuok „vie-ne-ir du-ir“."],
      ["Dešinysis pedalas", "Pedalo nuspaudimas po garso (sinkopuotas pedalas) – pirmieji bandymai."]
    ],
    repertoire: ["Bartók – „Mikrokosmos“ I sąs. (pasirinktinai)", "Faber/Alfred metodikos 1 knyga", "Liaudies dainos dviem rankom"]
  },
  {
    id: 2, emoji: "🎹", name: "Pradedančioji pianistė", time: "4–12 mėn.", daily: "30–45 min./d.",
    goal: "Visos mažorinės gamos, pirmieji klasikiniai kūriniai ir akompanimentas.",
    lessons: [
      ["Visos mažorinės gamos", "2 oktavos abiem rankom, kvintų rato tvarka."],
      ["Natūralūs, harmoniniai, melodiniai minorai", "a, e, d moll ir toliau."],
      ["Arpedžio", "Mažorinių triadų arpedžio 2 oktavos."],
      ["Akordų apvertimai", "Pagrindinė padėtis, 1-asis ir 2-asis apvertimai."],
      ["Kadencija I–IV–V–I", "Visose išmoktose tonacijose."],
      ["Albertio bosas", "Klasikinis akompanimentas kaire ranka."],
      ["Šešioliktinės", "Tolygumas su metronomu 60→90 BPM."],
      ["Prima vista kasdien", "5 min. nematyto teksto skaitymo kasdien."],
      ["Lead sheet pagrindai", "Melodija + akordų simboliai (C, Am, F, G7)."],
      ["Pirmasis įrašas", "Įrašyk kūrinį Studijoje ir perklausyk kritiškai."]
    ],
    repertoire: ["Petzold – Menuetas G-dur (iš A. M. Bach sąsiuvinio)", "Schumann – „Melodija“ op. 68 nr. 1", "Clementi – Sonatina op. 36 nr. 1", "Einaudi – „Una Mattina“"]
  },
  {
    id: 3, emoji: "🎶", name: "Elementarusis lygis", time: "1–2 m.", daily: "45–60 min./d.",
    goal: "Polifonija, etiudai, ornamentika ir grojimas atmintinai.",
    lessons: [
      ["Gamos 4 oktavos", "Visos mažorinės ir minorinės, chromatinė gama."],
      ["Czerny etiudai", "Op. 599 / op. 849 – tolygumas ir greitis."],
      ["Bach – Mažosios preliudijos", "Dviejų balsų savarankiškumas."],
      ["Ornamentai", "Trilė, mordentas, forslagas – baroko ir klasikos stilius."],
      ["Frazavimas", "Kvėpavimas muzikoje, frazės kulminacija."],
      ["Septakordai", "Dominantinis septakordas ir jo apvertimai."],
      ["Grojimas atmintinai", "Analitinė, raumeninė, klausos ir vizualinė atmintis."],
      ["Improvizacija", "Pentatonika ant I–vi–IV–V progresijos."]
    ],
    repertoire: ["Bach – Preliudas C-dur BWV 846", "Burgmüller – Etiudai op. 100 („Arabeska“, „Pastoralė“)", "Čaikovskis – „Vaikų albumas“ op. 39", "Satie – „Gymnopédie“ nr. 1"]
  },
  {
    id: 4, emoji: "🎻", name: "Vidutinis lygis", time: "2–4 m.", daily: "1–1,5 val./d.",
    goal: "Klasikinės sonatos, romantizmas ir pirmasis viešas pasirodymas.",
    lessons: [
      ["Bach – Dviejų balsų invencijos", "Nr. 1, 4, 8, 13 – kontrapunktas."],
      ["Klasikinė sonata", "Sonatos formos analizė ir atlikimas."],
      ["Romantinis stilius", "Rubato, dainingas tonas, pedalizacija."],
      ["Oktavų ir akordų technika", "Riešo laisvumas, svoris iš peties."],
      ["Czerny op. 299", "Greitumo mokykla."],
      ["Muzikos istorija", "Barokas, klasicizmas, romantizmas, impresionizmas."],
      ["Scenos jaudulio valdymas", "Kvėpavimas, vizualizacija, „bandomieji koncertai“ draugams."],
      ["Pirmasis pasirodymas", "Sugrok 1–2 kūrinius auditorijai."]
    ],
    repertoire: ["Mozart – Sonata C-dur K. 545", "Chopin – Preliudas e-moll op. 28 nr. 4", "Chopin – Valsas a-moll (posth.)", "Beethoven – „Für Elise“ WoO 59"]
  },
  {
    id: 5, emoji: "🌙", name: "Pažengusioji", time: "4–7 m.", daily: "1,5–2 val./d.",
    goal: "Didieji kompozitoriai, garso spalva ir 20–30 min. programa.",
    lessons: [
      ["Bach – Gerai temperuotas klavyras", "Preliudai ir fugos."],
      ["Beethoven sonatos", "„Patetinė“ op. 13, „Mėnesienos“ op. 27 nr. 2."],
      ["Chopin noktiurnai", "Kantilena ir pedalo niuansai."],
      ["Impresionizmas", "Debussy – garsų spalvos ir pusė pedalo."],
      ["Czerny op. 740", "Pirštų miklumo menas."],
      ["Programos sudarymas", "20–30 min. rečitalio dramaturgija."],
      ["Įrašų kokybė", "Studijinis įrašas: mikrofonų/linijos įrašas, mastering pagrindai."]
    ],
    repertoire: ["Debussy – „Clair de lune“", "Beethoven – Sonata „Patetinė“ op. 13", "Chopin – Noktiurnas Es-dur op. 9 nr. 2", "Schubert – Ekspromtas Ges-dur op. 90 nr. 3"]
  },
  {
    id: 6, emoji: "🎭", name: "Koncertinis lygis", time: "7–10 m.", daily: "2–4 val./d.",
    goal: "Virtuozinis repertuaras, konkursai ir 45–60 min. rečitalis.",
    lessons: [
      ["Chopin etiudai ir baladės", "Etiudai op. 10/25, Baladė nr. 1 g-moll."],
      ["Liszt ir Rachmaninov", "Virtuozinė technika ir didelis garsas."],
      ["Interpretacija", "Lyginamoji įrašų analizė, savo koncepcija."],
      ["Kamerinė muzika", "Grojimas su kitais muzikantais."],
      ["Konkursai ir festivaliai", "Paraiškos, programos reikalavimai."],
      ["Pilnas rečitalis", "45–60 min. programa atmintinai."]
    ],
    repertoire: ["Chopin – Baladė nr. 1 g-moll op. 23", "Rachmaninov – Preliudas cis-moll op. 3 nr. 2", "Liszt – „Liebestraum“ nr. 3", "Čiurlionis – Preliudai"]
  },
  {
    id: 7, emoji: "👑", name: "Masterclass", time: "10+ m.", daily: "Pagal programą",
    goal: "Meistriškumo kursai, savitas stilius ir didžiosios scenos.",
    lessons: [
      ["Meistriškumo kursai", "Dalyvauk masterclass pas pripažintus pedagogus."],
      ["Koncertas su orkestru", "Pvz., Rachmaninov koncertas nr. 2 ar Grieg koncertas."],
      ["Savitas balsas", "Asmeninis interpretacijos braižas."],
      ["Kūryba", "Savų kūrinių ar aranžuočių koncertas."],
      ["Profesionalus įrašas", "Albumas / EP iš savo įrašų."],
      ["Dalinimasis", "Mokyk kitus – geriausias būdas tobulėti."]
    ],
    repertoire: ["Rachmaninov – Koncertas nr. 2 c-moll", "Grieg – Koncertas a-moll", "Liszt – Sonata h-moll", "Ravel – „Gaspard de la nuit“"]
  }
];

PM.CATEGORIES = [
  { id: "tech", name: "Technika", emoji: "💪" },
  { id: "kurinys", name: "Kūriniai", emoji: "🎼" },
  { id: "natos", name: "Natų skaitymas", emoji: "👀" },
  { id: "teorija", name: "Teorija", emoji: "📖" },
  { id: "klausa", name: "Klausa", emoji: "👂" },
  { id: "improv", name: "Improvizacija", emoji: "✨" },
  { id: "kuryba", name: "Kūryba", emoji: "🖋️" }
];

PM.CHALLENGES = [
  { id: "streak7", emoji: "🔥", title: "7 dienų įprotis", desc: "Groti kasdien bent 15 min. visą savaitę.", days: 7, type: "daily", xp: 100 },
  { id: "scales30", emoji: "🎯", title: "30 dienų gamų", desc: "Kasdien sugrok visas šiuo metu mokomas gamas su metronomu.", days: 30, type: "daily", xp: 300 },
  { id: "sight21", emoji: "👀", title: "21 diena prima vista", desc: "Kasdien 5 min. skaityk naują, nematytą tekstą.", days: 21, type: "daily", xp: 200 },
  { id: "notes50", emoji: "🧠", title: "Natų meistrė", desc: "Natų treneryje atspėk 50 natų iš eilės be klaidų.", target: 50, type: "trainer", xp: 250 },
  { id: "rec10", emoji: "🎙️", title: "10 įrašų", desc: "Padaryk 10 įrašų Studijoje – stebėk savo progresą.", target: 10, type: "recordings", xp: 200 },
  { id: "min1000", emoji: "⏳", title: "1000 minučių", desc: "Sukaupk 1000 praktikos minučių.", target: 1000, type: "minutes", xp: 400 },
  { id: "improv14", emoji: "✨", title: "14 dienų improvizacijos", desc: "Kasdien 10 min. laisvos improvizacijos – be natų, tik klausa.", days: 14, type: "daily", xp: 150 },
  { id: "slow7", emoji: "🐢", title: "Lėtosios praktikos savaitė", desc: "7 dienas kiekvieną kūrinį groji perpus lėčiau, nei norisi.", days: 7, type: "daily", xp: 120 },
  { id: "compose", emoji: "🖋️", title: "Mano pirmasis kūrinys", desc: "Sukurk ir įrašyk 8 taktų melodiją su akompanimentu.", days: 1, type: "daily", xp: 250 },
  { id: "concert", emoji: "🎭", title: "Namų koncertas", desc: "Sugrok 3 kūrinius šeimai ar draugams.", days: 1, type: "daily", xp: 300 }
];

PM.QUOTES = [
  ["Paprastumas yra galutinis pasiekimas.", "F. Chopin"],
  ["Muzika išreiškia tai, ko negalima pasakyti žodžiais.", "V. Hugo"],
  ["Groti neteisingą natą – nereikšminga; groti be aistros – neatleistina.", "L. van Beethoven"],
  ["Lėtai skubėk.", "Festina lente"],
  ["Mokymasis groti – tai mokymasis klausytis.", "Piano Man"],
  ["Kasdien po truputį – tai daugiau nei kartais daug.", "Piano Man"],
  ["Muzika – tai tyla tarp natų.", "C. Debussy"]
];

PM.TEMPO_NAMES = [
  [40, "Grave"], [50, "Largo"], [60, "Larghetto"], [66, "Adagio"], [76, "Andante"],
  [100, "Moderato"], [112, "Allegretto"], [120, "Allegro"], [156, "Vivace"], [176, "Presto"], [200, "Prestissimo"]
];

PM.RANKS = [
  [0, "Smalsuolė"], [300, "Mokinė"], [1000, "Muzikantė"], [2500, "Pianistė"],
  [5000, "Atlikėja"], [10000, "Koncertuojanti pianistė"], [20000, "Maestra"]
];

PM.REP_STATUS = [
  { id: "noriu", name: "Noriu išmokti", cls: "blue" },
  { id: "mokausi", name: "Mokausi", cls: "accent" },
  { id: "moku", name: "Moku", cls: "green" },
  { id: "koncert", name: "Koncertinis", cls: "gold" }
];

PM.STAGE_CHECKLIST = [
  "Kūrinys grojamas atmintinai 5 kartus iš eilės be sustojimų",
  "Įrašytas ir perklausytas bent 3 kartus",
  "Sugrotas „bandomasis koncertas“ šeimai / draugams",
  "Pasiruoštas lėtas ir labai lėtas tempas (avarinis planas)",
  "Žinomos „atramos vietos“, nuo kurių galima tęsti po klaidos",
  "Išbandytas kitas instrumentas / salė, jei įmanoma",
  "Apranga ir batai patogūs pedalui",
  "Kvėpavimo pratimai prieš išėjimą į sceną"
];
