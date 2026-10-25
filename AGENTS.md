# Agent notes

## What this project is
Pixel Dungeon is a **pure static site**: `index.html` + `style.css` + `script.js`
plus two `.aac` audio files. There is no package manager manifest, no build
step, no backend, no database and no external service. State is kept in
`localStorage`.

## Running it (Base44 sandbox)
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Service `web` runs `node:22`, bind-mounts the repo at `/app` and serves it on
  host port 3000 with `live-server` (auto-injects browser live reload).
- `live-server` is installed into the named volume `devserver` (`/deps`) on
  first start, so `node_modules` never appears in the working tree and nothing
  needs to be committed.
- Bind mounts here do not deliver inotify events, so the watcher polls
  (`CHOKIDAR_USEPOLLING`). Audio files are served with HTTP range support, which
  matters for `<audio>` playback/seeking.
- No `--entry-file` fallback is configured on purpose: a missing asset must
  answer 404 instead of silently returning the HTML page.

## How to verify it works
`curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → `200`.
In the browser: the main menu renders, clicking **SOLITARIO** hides the menu and
starts an animating canvas with a live HUD (HP bar, biome, enemy power, timer).
Any change to the static files is picked up by the live reload; `reload_preview`
is not normally needed.

## Known quirks (pre-existing, not setup issues)
- Five audio files referenced by `script.js` are **not in the repository** and
  were never in its git history, so they answer 404 (the browser logs them on
  load because `bgm.src` is set from `MUSIC_PLAYLIST[0]`):
  `menu.aac`, `ytmp3free.cc_ashnikko-worms-lyrics-youtubemp3free.org.mp3`,
  `ytmp3free.cc_coldplay-hymn-for-the-weekend-official-video-youtubemp3free.org.mp3`,
  `ytmp3free.cc_alan-walker-faded-youtubemp3free.org.mp3`,
  `ytmp3free.cc_john-newman-love-me-again-youtubemp3free.org (1).mp3`.
  Only `boss.aac` and `boss2.aac` exist, and every other local asset the app
  references returns 200. Gameplay is unaffected apart from missing background
  music.
- `style.css` forces landscape in portrait via
  `body { transform: rotate(90deg); transform-origin: left top; top: 100%; }`.
  In a portrait viewport (375x812) this translates the whole body to
  x = -375..0, y = 812..1624, i.e. completely off-screen, so a phone held in
  portrait shows a black page. Landscape and desktop render fine.
