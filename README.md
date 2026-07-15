# Bindi's Fairy Word Garden 🧚🌸

A bilingual (English / 中文) first-words learning app for kids ~4-5 years old.
Built as static files for GitHub Pages — no build step, no server, no backend.

## Quick deploy to GitHub Pages
1. Create a new GitHub repo, push everything in this folder to it (keep the folder structure as-is).
2. Repo Settings → Pages → Source: deploy from `main` branch, root folder.
3. Open the published URL **on the iPad in Safari**, tap Share → "Add to Home Screen".
   This installs it as a real full-screen app icon (no browser bar), works offline after first load.
4. Generate the icon files (see below) and drop them into `assets/icons/` — the site works without
   them, it'll just use a blank icon until you add them.

## Icon files needed (Gemini, or any image tool)
| File | Size |
|---|---|
| `assets/icons/icon-192.png` | 192×192 |
| `assets/icons/icon-512.png` | 512×512 |
| `assets/icons/icon-512-maskable.png` | 512×512, ~20% padding on all sides |
| `assets/icons/apple-touch-icon.png` | 180×180 — **this is the one iOS actually uses** for Add to Home Screen |

## Project structure — and why it's split this way
```
index.html                  ← shell, loads everything else
manifest.json                ← PWA install config
service-worker.js            ← offline caching for iPad
css/
  variables.css               ← ALL colours/fonts/sizes live here — retheme by editing this ONE file
  base.css, components.css, garden.css, games.css
js/
  core/                       ← logic with no UI: storage, speech, progress, data loading, router
  ui/                         ← screens (home, letters, word detail, games hub, challenge, parent dashboard)
  games/                      ← each mini-game is one self-contained file
data/
  words/
    index.json                ← lists which letter files exist
    a.json ... z.json         ← one file per letter, ~5-18 words each right now (216 total)
```

## How to add more words (this is the whole point of the structure)
Open `data/words/<letter>.json`, copy an existing entry, change the fields, give it a unique `id`
(e.g. next free number for that letter, like `"a017"`). Save. Nothing else needs to change —
no other file references individual words by anything other than the loader.

```json
{
  "id": "a017",
  "word": "ambulance",
  "wordZh": "救护车",
  "pinyin": "jiùhùchē",
  "emoji": "🚑",
  "partOfSpeech": "noun",
  "sentenceEn": "The ambulance drives fast.",
  "sentenceZh": "救护车开得很快。"
}
```

**One rule that matters:** keep every emoji unique across the *entire* word bank (not just within
one letter). The Listen & Choose and Memory Match games show emoji-only tiles, so two different
words sharing an emoji would look identical and confuse the child. Run this check after adding
words:
```bash
python3 -c "
import json, glob, collections
seen = collections.defaultdict(list)
for fp in glob.glob('data/words/*.json'):
    if 'index' in fp: continue
    for w in json.load(open(fp, encoding='utf-8'))['words']:
        seen[w['emoji']].append(w['word'])
print({k:v for k,v in seen.items() if len(v)>1} or 'all unique')
"
```

## How to add a new game
1. Create `js/games/yourGame.js` following the pattern in the existing game files (they all export
   a `render(root, params)` function).
2. Add one line to `js/games/playRouter.js`'s `GAMES` map.
3. Add a script tag for it in `index.html` (before `playRouter.js`).
4. Link to it from `wordDetail.js` or `gamesHub.js` with `Router.navigate('play', { game: 'yourGame', word: id })`.

## Current content coverage (327 words)
Bigger letters (A, B, C, D, M, S) have 20-23 words each; T, F, G, H, P around 14-17; the rest have
a working starter set (Q, X, Y, Z are inherently small — there just aren't many kid-friendly X
words in English). Includes a run of number words (one-ten) mapped to their starting letters as a
bonus. Fill in more at your own pace — the structure above makes it a five-minute edit per word,
not a rebuild. `tools/add_words_example.py` shows the pattern used to batch-add words safely
(checks emoji uniqueness automatically) if you want to add a big batch again later.

## How the learning design works
Six activities, roughly in order of cognitive difficulty (easiest first) — a child can go through
all of them for one word without ever feeling stuck cold:

1. **Word Detail** = first exposure: huge emoji, huge word (Andika font), audio in English then
   Chinese, automatically on arrival.
2. **Listen & Choose** = recognition before recall (hear it, pick the matching picture).
3. **Fill the Gap** = most letters are already filled in, only 1-3 are blanked (never the first
   letter, so there's always a visual anchor). This is the missing rung between "recognise it" and
   "spell it from nothing" that makes Word Builder much less intimidating.
4. **Word Builder** = full spelling practice, with hints that fade as a word gets easier for that
   specific child (tracked per-word, not global) — see `HINT LEVEL` comments in
   `js/games/wordBuilder.js`.
5. **Make a Sentence** = reorders the example sentence — reinforces the word used in context, not
   just in isolation, and gives light exposure to word order in both languages.
6. **Trace It** = handwriting muscle memory, a separate skill from spelling.

Plus two review modes from the Games hub (not tied to one word):
- **Memory Match** = spaced-repetition review across previously-seen words.
- **Speed Quiz** = 5 rapid-fire rounds mixing several already-introduced words, with a results
  screen — good for "one more go" replay value and for spreading review across the whole garden.
- A word is "mastered" (🌟, plants a flower in the garden) once it's been answered correctly
  across **two different games**, 3 times total — see `MASTERY_STREAK` in `js/core/progress.js`.
  This stops "mastery" just meaning "got lucky at one multiple-choice game".

## Daily 5-word challenge + parent confirmation
`js/core/dailyChallenge.js` picks 5 words (new words walking the alphabet, plus up to 2 review
words) and keeps serving that *same* set of 5 until a parent explicitly confirms it via the maths-
question gate in `js/core/parentGate.js` — a new set isn't generated until then, so a child can't
tap through to "tomorrow's words" before today's are actually done.

## Parent Dashboard
Route `#parent`, gated by the same parent check. Shows words mastered, per-letter completion bars,
streak, a "needs more practice" list (seen 3+ times, still not mastered), and challenge-confirmation
history. There's a reset button (also gated) if you want to start a child's profile fresh.

## Multiple children
Currently one active profile at a time (`Storage.getRoot().activeProfileId`). All profile data
already lives in `root.profiles[profileId]`, so adding a profile-switcher UI later is additive —
the data model already supports multiple kids, there's just no switcher screen yet. Ask me to add
one if you need it.

## Sentence Builder: per-word Chinese + audio
Every tile in Make a Sentence (not just the target word) shows a Chinese gloss and speaks both
languages when tapped. Translation source, in priority order (`js/core/sentenceGloss.js`):
1. If the sentence word is itself one of the 327 vocabulary words, its existing `wordZh` is reused.
2. Otherwise a hand-translated dictionary of ~155 common connector/grammar words (the, is, my,
   wears, together, before...) covers the words that repeat across many sentences.
3. Common suffixes (-s, -es, -ing, -ed, -ies) are stripped before both lookups, so "eats" / "flies"
   / "grapes" still match their base word — this works well for Chinese specifically since Chinese
   verbs/nouns don't conjugate, so reusing the base translation is actually correct.
4. Articles (a/an/the) are intentionally left blank — Chinese has no direct equivalent, so no gloss
   is the linguistically correct behaviour, not a gap.

This currently covers about **75% of all sentence-tiles** across the whole word bank. The
remaining ~25% is mostly one-off content words (e.g. "toothbrush", "gallops") that only appear in
a single sentence — those tiles still work fine, they just show English only with English audio.
To close more of the gap later, add entries to `FILLER_DICT` in `js/core/sentenceGloss.js`.

## Letter Trace: long-word fix
Longer words (airplane, alligator, watermelon...) were being cropped by a fixed box size and font
size. The trace box now sizes itself to the word: it widens for words over 6 letters (up to the
viewport width) and computes a font size that fits the whole word with room to spare, instead of
using one fixed size for every word. See `fitTraceBox()` in `js/games/letterTrace.js`.

## Daily challenge word selection
Words are picked randomly from across the whole alphabet (not alphabetically from A), so day 1
isn't always "apple, ant, arm...". A word that's already been part of a **parent-confirmed**
challenge is never picked again as a "new" word — see `_confirmedWordIds()` in
`js/core/dailyChallenge.js`, which scans `profile.dailyLog` (every confirmed challenge ever) to
build the exclusion list. Words still being learned (introduced but not yet mastered) can
legitimately reappear as review slots — that repetition is intentional spaced practice, not a bug.

## Pet + Garden Shop (engagement features)
Two ways stars get spent, both purely positive-reinforcement — no hunger/decay/guilt mechanics,
because punishing a 4-5 year old for not opening the app isn't the goal:
- **Pet** (`js/ui/petView.js`, route `#pet`): feed a garden companion with stars (1 star per feed).
  It grows through 5 stages (🥚→🐣→🐥→🦋→✨🦋✨) and never regresses — growth is one-directional.
  Rename it anytime. Stage thresholds are in the `STAGES` array at the top of the file.
- **Garden Shop** (`js/ui/shopView.js`, route `#shop`): spend stars on decorations (fairy cottage,
  pond, fountain, etc.) that appear permanently in the home garden plot. Catalog lives in
  `js/core/shopCatalog.js` — add a new item by adding one line there.
- **Currency**: `profile.starBalance` is separate from the "words mastered" count shown to
  parents — it goes up by 1 the moment a word is newly mastered (`js/core/progress.js`) and goes
  down when spent. The parent dashboard's mastered-word count never decreases even if all stars
  get spent — that's the permanent learning record; stars are just spending money.

## Chinese-speaking-child support
- **Every instruction is now bilingual with sound.** Bindi's speech-bubble prompts in every game
  show English + Chinese text together, plus a 🔊 button that speaks both — see
  `GameShared.bindiBubble()` / `wireBubble()` in `js/games/shared.js`. A child who can't yet read
  English well can still follow what each game is asking them to do.
- **Language focus toggle** (Parent Dashboard → "Learning language focus"): switch between
  English-first and Chinese-first. This changes which language is the big hero text on the Word
  Detail screen, and which language is spoken first everywhere audio plays bilingually (see
  `_isZhFirst()` in `js/core/speech.js`). It's per-child (`profile.languageMode`), so siblings with
  different needs can each have their own setting.
- **Example sentences now have their own "Hear the sentence" button** on the Word Detail screen,
  speaking the English sentence then the Chinese translation (or reversed, per the language
  toggle) — previously only the single word had an audio button, the sentence was text-only.
  Sentence Builder also now displays the Chinese sentence as text once the child completes it, not
  just as audio.

## Sound effects & background music
All synthesised on-device with the Web Audio API (`js/core/sfx.js`) — no audio files to license,
host, or keep in sync as the word bank grows. Same idea as using emoji instead of custom art.
- Short chime/blip sound effects for correct/wrong answers and celebrations, used across all games.
- A quiet looping background melody (pentatonic, deliberately gentle — it's a backdrop, not a
  feature) that starts on the child's first tap anywhere in the app (iOS requires a user gesture
  before any audio can play, so it can't auto-start on load).
- Both are toggleable independently from the two icon buttons on the home screen (🔊/🔇 for sound
  effects, 🎵/🚫 for music) — the choice is saved and respected everywhere in the app.
- To change the tune: edit `MUSIC_SCALE` / `MUSIC_PATTERN` / `NOTE_DURATION` in `js/core/sfx.js` —
  it's just a list of note frequencies and a sequence of indices into that list.
- If you'd rather use a real licensed music loop later instead of the synthesised one: drop an
  .mp3 into `assets/audio/`, and swap `startMusic()` in `sfx.js` to play that file on loop instead
  of scheduling oscillator notes — everything else (the toggle, the saved preference) stays the same.

## Notes on the tech choices
- **Emoji instead of custom illustrations** — renders natively via iPad's Apple emoji font, zero
  images to generate/host for 216+ words. Only the app icon needs actual generated art.
- **Web Speech API (`SpeechSynthesisUtterance`)** for audio — no per-word audio files to manage;
  works fully offline once voices are cached by iOS (they are, natively).
- **localStorage, versioned** (`js/core/storage.js`) — all progress stored on-device, nothing sent
  anywhere. Schema has a version number so future feature additions won't corrupt existing saves.
