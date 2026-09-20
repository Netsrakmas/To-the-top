import { copyFile, lstat, mkdir, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const requiredEntries = ['index.html', 'styles.css', 'src', 'assets'];
const optionalEntries = ['manifest.webmanifest', 'manifest.json', 'sw.js', 'service-worker.js'];

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function copyEntry(source, destination) {
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Build inputs cannot be symbolic links: ${source}`);
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const name of (await readdir(source)).sort()) {
      if (name.startsWith('.')) continue;
      await copyEntry(join(source, name), join(destination, name));
    }
  } else if (info.isFile()) {
    await copyFile(source, destination);
  } else {
    throw new Error(`Unsupported build input: ${source}`);
  }
}

/** Build an allowlisted static artifact; docs, tests, and repository metadata never ship. */
export async function buildSite({ root = projectRoot } = {}) {
  const sourceRoot = await realpath(root);
  for (const entry of requiredEntries) {
    if (!(await exists(join(sourceRoot, entry)))) throw new Error(`Missing required game asset: ${entry}`);
  }

  // The only deletion target is this root's direct dist child, resolved and checked before removal.
  const output = resolve(sourceRoot, 'dist');
  if (output !== join(sourceRoot, 'dist')) throw new Error('Invalid build output path.');
  if (await exists(output)) {
    if ((await lstat(output)).isSymbolicLink() || await realpath(output) !== output) {
      throw new Error('Build output must be a regular directory within the project.');
    }
    await rm(output, { recursive: true, force: true });
  }
  await mkdir(output);

  for (const entry of requiredEntries) await copyEntry(join(sourceRoot, entry), join(output, entry));
  for (const entry of optionalEntries) {
    if (await exists(join(sourceRoot, entry))) await copyEntry(join(sourceRoot, entry), join(output, entry));
  }
  // Preserve old bookmarks while excluding the prototype's obsolete assets and documentation.
  if (await exists(join(sourceRoot, 'prototype', 'index.html'))) {
    await mkdir(join(output, 'prototype'));
    await copyEntry(join(sourceRoot, 'prototype', 'index.html'), join(output, 'prototype', 'index.html'));
  }
  await writeFile(join(output, '.nojekyll'), '');
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  buildSite().then(output => console.log(`Production game built in ${output}`)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
