import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const outputDirectory = path.join(projectRoot, 'dist');

// Source folders are organised for editing; output URLs stay stable.
export const sourceFolders = [
  { source: 'public', output: '' },
  { source: 'src/pages', output: '' },
  { source: 'src/styles', output: '' },
  { source: 'src/scripts', output: '' },
  { source: 'src/data', output: 'data' },
  { source: 'src/config', output: '' },
];

export async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported in site sources: ${absolute}`);
    }
    if (entry.isDirectory()) files.push(...(await listFiles(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files.sort();
}

export function webPath(filename) {
  return filename.split(path.sep).join('/');
}

export async function sourceEntries() {
  const entries = [];
  const destinations = new Set();
  for (const folder of sourceFolders) {
    const directory = path.join(projectRoot, folder.source);
    for (const source of await listFiles(directory)) {
      const output = webPath(path.join(folder.output, path.relative(directory, source)));
      if (destinations.has(output)) throw new Error(`Duplicate output file: ${output}`);
      if (output === 'sw.js') throw new Error('sw.js is generated from src/service-worker.js.');
      destinations.add(output);
      entries.push({ source, output });
    }
  }
  return entries.sort((left, right) => (left.output < right.output ? -1 : 1));
}
