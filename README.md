# To the Top — Roef's great escape

One small fish. Three big problems. Help Roef outswim the food chain in a portrait
arcade game for touch and keyboard. Slip through three nets, trap the hunters,
and reach the actual surface. Small is your superpower.

## Play locally

Requires **Node.js 22 or newer**. No dependencies or installation step.

```sh
npm run dev
```

Open **http://127.0.0.1:4173**. ES modules need an HTTP server; opening the HTML
directly from disk is not supported. The old `/prototype/` address redirects to
the finished game at the root.

## Controls

| Action | Touch / mouse | Keyboard |
| --- | --- | --- |
| Swim up | Hold in the water | Hold Space, ↑, or W |
| Steer | Drag left or right, relative to your starting point | ← → or A D |
| Slow down | Release | Release the swim key |
| Pause | Pause button | Esc or P |

The first run waits for your swim input. Pausing, switching tabs, losing focus,
or resizing stops play safely. Release and grab anywhere to reposition your
finger without moving Roef suddenly. Only the primary pointer controls Roef.

**Settings:** optional original synthesized sound, auto-swim, and reduced motion.
Preferences and personal records stay on the device. The game continues if
browser storage or audio is unavailable. There is no account, tracking, or server.

## The game

- **Classic:** a repeatable route to learn and master.
- **Daily dive:** a date-seeded course, the same for everyone on a UTC day.
  Scores are personal and local; there is no online leaderboard.
- **Easy tide:** five hearts and a slower hunter.
- Runs take approximately **45–65 seconds** with continuous progress.
- Bubble trails connect navigable passages. Creatures hurt; rocks block.
- Cyan shields absorb one creature hit; yellow boosts add a short burst of speed.
- Three progressively larger hunters, physical net captures, a surface escape,
  and one suspicious seagull.

## Check and package

```sh
npm test
npm run build
npm run preview
```

`dist/` is the deployable browser release. The preview uses port 4173 too; stop
the development server first, or set `PORT` to another value. Everything required
to play ships in the artifact, including artwork and audio code. No third-party
runtime requests, fonts, or asset services are required.

GitHub Actions tests and builds each push and PR. Merging into the repository's
default branch deploys the checked artifact to GitHub Pages. See
[release instructions](docs/RELEASE.md) and the [release review](docs/SHIP_REVIEW.md).

This is a **browser release**, not an iOS/Android store package. Native signing,
store listings, and physical-device acceptance are separate release steps.

## Development

| File | Responsibility |
| --- | --- |
| `src/game.js` | Seeded courses, movement, collision, hunters, scoring |
| `src/renderer.js` | Original Canvas artwork, scenery, animation, effects |
| `src/main.js` | Controls, menus, pause, DOM HUD, game loop |
| `src/audio.js` | Original Web Audio effects and ambient tones |
| `src/storage.js` | Validated, versioned local preferences and records |
| `tests/` | Simulation, persistence, server and packaging tests |

Logical playfield dimensions remain **420 × 760** on every screen. Rendering
scales to the available area without changing physics. Collision simulation uses
steps no larger than 1/120 second. Motion reduction disables decorative movement,
screen shake and flashing while preserving the gameplay information.

For visual development, `tests/replay.html` runs the real simulation and renderer
through complete seeded routes. It is excluded from release builds.

The original Dutch concept and historical prototype review remain in
[docs/DESIGN.md](docs/DESIGN.md) and [docs/REVIEW.md](docs/REVIEW.md). The ship review
documents the implemented browser version and supersedes their prototype status.

## Rights

No third-party art or audio is bundled. The project does not yet declare an
open-source license; publishing the source does not grant reuse rights.
