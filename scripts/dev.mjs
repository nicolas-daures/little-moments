import { watch } from 'node:fs';
import path from 'node:path';
import { buildSite } from './build.mjs';
import { projectRoot } from './project.mjs';
import { startServer } from './server.mjs';

await buildSite();
const server = startServer({ development: true, defaultPort: 5173 });
let timer;
let building = false;
let pending = false;

async function rebuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  do {
    pending = false;
    try {
      await buildSite();
      console.log('Sources updated. Refresh your browser.');
    } catch (error) {
      console.error(error);
    }
  } while (pending);
  building = false;
}

const watchers = ['src', 'public'].map((directory) =>
  watch(path.join(projectRoot, directory), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 100);
  }),
);

function shutdown() {
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
  server.close(() => process.exit());
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
