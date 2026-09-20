import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createStaticServer } from '../scripts/serve.mjs';
import { buildSite } from '../scripts/build.mjs';

async function fixture(t) {
  const prefix = join(tmpdir(), 'to-the-top-test-');
  const root = await mkdtemp(prefix);
  t.after(async () => {
    assert.ok(resolve(root).startsWith(resolve(prefix)), 'cleanup must stay in the generated fixture');
    await rm(root, { recursive: true, force: true });
  });
  return root;
}

async function write(root, name, content = '') {
  const target = join(root, name);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content);
}

async function serve(t, root) {
  const server = await createStaticServer({ root });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  t.after(() => new Promise(resolveClose => server.close(resolveClose)));
  return { host: '127.0.0.1', port: server.address().port };
}

// http.request preserves malicious raw paths that fetch/URL would normalize before sending.
function request(address, path, method = 'GET') {
  return new Promise((resolveRequest, rejectRequest) => {
    const req = http.request({ ...address, path, method }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolveRequest({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', rejectRequest);
    req.end();
  });
}

test('server serves HTML, JavaScript, CSS, SVG, and manifest with correct MIME types', async t => {
  const root = await fixture(t);
  const files = [
    ['index.html', '<h1>Roef</h1>', 'text/html; charset=utf-8'],
    ['src/main.js', 'export const ready = true;', 'text/javascript; charset=utf-8'],
    ['styles.css', 'body{color:white}', 'text/css; charset=utf-8'],
    ['assets/fish.svg', '<svg/>', 'image/svg+xml'],
    ['manifest.webmanifest', '{}', 'application/manifest+json; charset=utf-8'],
  ];
  for (const [name, body] of files) await write(root, name, body);
  const address = await serve(t, root);
  for (const [name, body, type] of files) {
    const response = await request(address, `/${name}?v=1`);
    assert.equal(response.status, 200, name);
    assert.equal(response.headers['content-type'], type, name);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.body, body, name);
  }
  assert.equal((await request(address, '/')).body, '<h1>Roef</h1>');
});

test('server returns correct HEAD, missing-file, invalid-encoding and method responses', async t => {
  const root = await fixture(t);
  await write(root, 'index.html', 'Roef');
  const address = await serve(t, root);
  const head = await request(address, '/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.headers['content-length'], '4');
  assert.equal(head.body, '');
  assert.equal((await request(address, '/missing.js')).status, 404);
  assert.equal((await request(address, '/bad%ZZ')).status, 400);
  const post = await request(address, '/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('server rejects raw, encoded, Windows, and hidden-file traversal paths', async t => {
  const root = await fixture(t);
  await write(root, 'public/index.html', 'game');
  await write(root, 'private.txt', 'secret');
  await write(root, 'public/.git/config', 'private repository config');
  const address = await serve(t, join(root, 'public'));
  const paths = [
    '/../private.txt',
    '/%2e%2e/private.txt',
    '/%2e%2e%2fprivate.txt',
    '/%2e%2e%5cprivate.txt',
    '/safe/../../private.txt',
    '/.git/config',
    '/%2egit/config',
    '/C:/private.txt',
    '/index.html%00',
  ];
  for (const path of paths) {
    const response = await request(address, path);
    assert.equal(response.status, 403, path);
    assert.ok(!response.body.includes('secret'), path);
  }
});

test('server blocks directory symlinks outside the public root', async t => {
  const root = await fixture(t);
  await write(root, 'public/index.html', 'game');
  await write(root, 'private/index.html', 'secret');
  await symlink(join(root, 'private'), join(root, 'public', 'escape'), 'junction');
  const address = await serve(t, join(root, 'public'));
  const response = await request(address, '/escape/');
  assert.equal(response.status, 403);
  assert.ok(!response.body.includes('secret'));
});

async function gameFixture(t) {
  const root = await fixture(t);
  await write(root, 'index.html', '<link rel="stylesheet" href="./styles.css"><img src="./assets/fish.svg"><script type="module" src="./src/main.js"></script>');
  await write(root, 'styles.css', 'body{background:#001525}');
  await write(root, 'src/main.js', "import { game } from './game.js'; game();");
  await write(root, 'src/game.js', 'export function game() {}');
  await write(root, 'assets/fish.svg', '<svg/>');
  return root;
}

test('build ships only approved game files and cleans stale output on rebuild', async t => {
  const root = await gameFixture(t);
  await write(root, 'README.md', 'private release notes');
  await write(root, '.git/config', 'repository internals');
  await write(root, 'tests/game.test.mjs', 'development tests');
  await write(root, 'prototype/index.html', '<meta http-equiv="refresh" content="0;url=../">');
  await write(root, 'prototype/README.md', 'obsolete documentation');
  await write(root, 'assets/.draft.svg', 'unpublished draft');
  await write(root, 'manifest.webmanifest', '{}');
  await write(root, 'sw.js', '// optional worker');
  const output = await buildSite({ root });
  assert.deepEqual((await readdir(output)).sort(), [
    '.nojekyll', 'assets', 'index.html', 'manifest.webmanifest', 'prototype', 'src', 'styles.css', 'sw.js',
  ]);
  assert.deepEqual(await readdir(join(output, 'assets')), ['fish.svg']);
  assert.deepEqual(await readdir(join(output, 'prototype')), ['index.html']);
  assert.equal(await readFile(join(output, 'src/game.js'), 'utf8'), 'export function game() {}');
  await write(output, 'old-release.js', 'stale');
  await buildSite({ root });
  assert.ok(!(await readdir(output)).includes('old-release.js'));
  assert.equal(await readFile(join(root, 'README.md'), 'utf8'), 'private release notes');
});

test('built HTML links and module imports resolve on the production server', async t => {
  const root = await gameFixture(t);
  const output = await buildSite({ root });
  const address = await serve(t, output);
  const page = await request(address, '/');
  assert.equal(page.status, 200);
  for (const match of page.body.matchAll(/(?:src|href)="\.([^\"]+)"/g)) {
    assert.equal((await request(address, match[1])).status, 200, match[1]);
  }
  const module = await request(address, '/src/main.js');
  const dependency = module.body.match(/from '\.([^']+)'/)[1];
  assert.equal((await request(address, `/src${dependency}`)).status, 200);
});

test('build fails clearly when required game inputs are absent', async t => {
  const root = await fixture(t);
  await assert.rejects(buildSite({ root }), /Missing required game asset: index.html/);
  await assert.rejects(readFile(join(root, 'dist/index.html')), { code: 'ENOENT' });
});

test('build refuses a linked output directory without modifying its target', async t => {
  const root = await gameFixture(t);
  await write(root, 'unrelated/keep.txt', 'keep me');
  await symlink(join(root, 'unrelated'), join(root, 'dist'), 'junction');
  await assert.rejects(buildSite({ root }), /Build output must be a regular directory/);
  assert.equal(await readFile(join(root, 'unrelated/keep.txt'), 'utf8'), 'keep me');
});
