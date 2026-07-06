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

## Notes on the tech choices
- **Emoji instead of custom illustrations** — renders natively via iPad's Apple emoji font, zero
  images to generate/host for 216+ words. Only the app icon needs actual generated art.
- **Web Speech API (`SpeechSynthesisUtterance`)** for audio — no per-word audio files to manage;
  works fully offline once voices are cached by iOS (they are, natively).
- **localStorage, versioned** (`js/core/storage.js`) — all progress stored on-device, nothing sent
  anywhere. Schema has a version number so future feature additions won't corrupt existing saves.
