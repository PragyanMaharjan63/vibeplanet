import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Imported first (as a side effect) so process.env is populated before any
// other module reads it at import time (e.g. src/config/redis.js). Resolved
// relative to this file, not cwd, so it finds the root .env regardless of
// which directory `npm run dev` is invoked from. In Docker, the root .env
// isn't even in the backend image's build context, so this is a silent
// no-op there — env vars already come from Compose's env_file instead.
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });
