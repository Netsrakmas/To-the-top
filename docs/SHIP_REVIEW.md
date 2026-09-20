# Browser release review

## Intended release

To the Top is a self-contained portrait browser arcade game. This pass turns the
existing Roef prototype into a complete short-session experience, preserving
the three-hunter / net-escape premise. Touch and keyboard are supported. The
original native-app concept remains a possible future packaging target.

## Findings and fixes

| Original finding | Implemented behavior |
| --- | --- |
| No keyboard or pause flow | Keyboard, pointer capture, real pause, safe focus/visibility handling |
| Two fingers produced a large false impulse | Primary pointer ownership; secondary fingers ignored |
| Hunter could pass Roef forever | Depth-aware pursuit; lateral avoidance cannot abandon the hunter |
| Victory occurred while still underwater | Final net catch and actual surface arrival required |
| Random overlapping obstacles could block a run | Authored seeded corridors with bubble guidance |
| Wall-hugging bypassed the route | Visible edge rocks close trivial shortcuts |
| Screen resize changed game geometry | Fixed logical dimensions, responsive rendering |
| Centered rock overlap could trap the player | Robust collision normals and edge separation |
| Collection could continue after fatal contact | Terminal states freeze simulation and score |
| Platform emoji, text-only title, generic failure text | Original vector art, consistent icons, distinct outcomes |
| No replay records, sound or assistance | Quick retry, validated records, sound, easy mode, auto-swim, reduced motion |
| Pages published repository contents | Tests followed by an allowlisted static artifact |

## Art direction

Orange Roef is the visual anchor against ink-blue water. Geological silhouettes,
three depth palettes, small distant fish, and restrained light shafts convey
the ascent. Crisp creature silhouettes and bright collectible rings communicate
the route. Interface elements remain outside the central swimming corridor.

References studied before implementation:

- [Downwell](https://downwellgame.com/): vertical arcade readability and replay rhythm.
- [Alto's Odyssey press kit](https://altosodyssey.com/press/): layered scenery and biome changes.
- [ABZÛ](https://giantsquidstudios.com/ABZU): underwater light and scale.
- [Ridiculous Fishing EX](https://apps.apple.com/us/app/ridiculous-fishing-ex/id1610164691): expressive fish in a portrait loop.

All shipped artwork is original Canvas/SVG geometry; reference assets are not used.

## Verification

The automated suite covers simulation at 30/60/120 Hz, complete seeded routes,
net order and physical capture, surface completion, idle failure, collision
edge cases, power-ups, result freezing, safe persistence, server paths and build
packaging. Additional balance sweeps checked 365 daily seeds, route-following
with 200ms reactions and steering error, and center/edge autoplay shortcuts.

Browser verification uses the actual title, play, pause, settings and result
screens, plus a development-only replay fixture for all depth zones and the
surface ending. The fixture advances the real simulation with movement inputs;
it does not teleport actors or skip collision rules. It is excluded from `dist/`.

Tested layouts: 1280 × 720 desktop, 390 × 844 and 320 × 568 portrait. A
844 × 390 landscape window shows a portrait prompt and pauses the run. The title
and results have no page overflow at those portrait sizes. Settings, daily mode,
pointer dragging, keyboard pause, the first-input wait, and persistence after
reload were exercised in the actual interface. The complete renderer replay
reached 100% in 45.22 seconds with three hearts, 95 bubbles and three captured
hunters, without browser console errors.

`tests/ui.html` additionally drives the real production UI in a same-origin frame
with ordinary menu clicks and keyboard events. Its independent route predictor
cannot mutate the app's game state, and it accepts only the actual visible win
result. Retry and saved-record checks use the same real controls.

The full UI run passed: **100% ascent, 95 bubbles, three hearts, 45.2 seconds**.
Retry restored the opening zone, three hearts, zero bubbles and zero progress;
the winning record remained visible after returning to the menu and reloading.
The release build loaded without console warnings/errors in the standalone
browser preview. All **32 automated tests** passed.

Physical iOS/Android hardware, native stores, and cross-browser device audio are
not certified by desktop browser emulation. Run the device checks in
[RELEASE.md](RELEASE.md) before advertising those targets as validated.
