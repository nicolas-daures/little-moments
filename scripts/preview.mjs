import { access } from 'node:fs/promises';
import path from 'node:path';
import { outputDirectory } from './project.mjs';
import { startServer } from './server.mjs';

try {
  await access(path.join(outputDirectory, 'index.html'));
} catch {
  throw new Error('Run npm run build before npm run preview.');
}

const server = startServer({ defaultPort: 4173 });
const shutdown = () => server.close(() => process.exit());
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
