# Releasing To the Top

Requires Node.js 22 or later. There are no npm dependencies to install.

```sh
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173` to inspect the exact release artifact. `npm run dev`
serves the source game at the same address. Set `HOST` and `PORT` in your shell
to override the address, for example for testing on another device on your local
network. Stop the server with Ctrl+C.

The build recreates `dist/` from `index.html`, `styles.css`, `src/`, and `assets/`,
plus a manifest or service worker if present. It adds `.nojekyll` for GitHub Pages.
Repository metadata, tests, documentation, and obsolete prototype assets are excluded.
The small `prototype/index.html` redirect remains to preserve existing bookmarks.
Deploy the contents of `dist/` together; ES modules require an HTTP server.

GitHub Actions runs tests and builds on every push and pull request. Successful
pushes to `claude/roef-de-vis-game-specs-ejein7` publish `dist/` to GitHub Pages.
The repository's Pages source must be set to **GitHub Actions**. Other branches
and pull requests are checked without publishing.

Before a public release, play the production preview using both keyboard and
touch, finish a full run, check pause/resume and replay, and confirm audio and
saved preferences after a reload. GitHub Actions verifies code and packaging;
device playtesting remains part of the release check.

For repeatable browser verification while the source server is running:

- Open `/tests/replay.html` for the real renderer and valid-input checkpoints.
- Open `/tests/ui.html` and choose **Run full UI playthrough**. Keep the tab
  visible; it checks menus, pause, keyboard swimming and the actual winning
  screen. Then choose **Verify retry and saved record**. The test records a
  real local Classic score, which stays in that browser's test origin.

Both fixtures are excluded from the production artifact. Current visual checks
and the limits of device coverage are recorded in [SHIP_REVIEW.md](SHIP_REVIEW.md).
