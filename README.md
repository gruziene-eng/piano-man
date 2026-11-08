# 🎹 Piano Man

Asmeninė pianino platforma: kelias nuo pirmos natos iki masterclass, kasdienė praktika, iššūkiai, įrašai ir pasirodymai.
Sukurta grojimui su **Kawai CA901**, klausymuisi per **FiiO K7 + Sennheiser HD 800 S**.

## Kas viduje

| Skiltis | Ką daro |
|---|---|
| 🏠 Pradžia | Dienos tikslas, serija 🔥, XP ir rangas, dabartinio lygio pamokos, savaitės grafikas |
| 🗺️ Mokymosi kelias | 8 lygiai (0 – Pirmas prisilietimas … 7 – Masterclass), pamokos ir repertuaras |
| ⏱️ Praktika | Laikmatis su kategorijomis, metronomas (taktas, skaidymas, tap tempo), dienoraštis |
| 🎹 Klaviatūra ir natos | Ekrano klaviatūra, **Web MIDI** su Kawai, natų skaitymo treneris, intervalų klausos lavinimas |
| 🏆 Iššūkiai | 10 iššūkių – kasdieniai ir automatiškai sekami |
| 🎙️ Įrašų studija | Garso įrašai (pasirenkama įvestis) ir **MIDI įrašai su .mid eksportu** |
| 📚 Repertuaras | Kūrinių sąrašas su būsenomis: noriu → mokausi → moku → koncertinis |
| ✨ Pasirodymai | Koncertų planavimas, atgalinis skaičiavimas, pasiruošimo kontrolinis sąrašas |
| 🎧 Mano įranga | Jungimo schemos: Kawai ↔ kompiuteris ↔ K7 ↔ HD 800 S, įrašų variantai |
| ⚙️ Nustatymai | Vardas, dienos tikslas, šviesi/tamsi tema, duomenų eksportas/importas |

## Kaip naudoti

- **Naršyklė:** Chrome arba Edge (Safari nepalaiko Web MIDI).
- **Pianino prijungimas:** USB A–B kabelis iš Kawai „USB to Host“ į kompiuterį → apačioje kairėje užsidegs „MIDI“.
- **Įdiegti kaip programėlę:** Chrome adreso juostoje → „Įdiegti Piano Man“ (veikia ir be interneto).
- **Duomenys** saugomi naršyklėje. Kitame įrenginyje: Nustatymai → Eksportuoti → Importuoti.

## Paleisti lokaliai

```bash
python3 -m http.server 5173
```

Tada atidaryk http://localhost:5173

## Technologijos

Grynas HTML/CSS/JavaScript be priklausomybių – Web Audio, Web MIDI, MediaRecorder, IndexedDB, Service Worker. Talpinama GitHub Pages.
