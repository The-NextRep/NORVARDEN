/**
 * Drizzle Kit configuration.
 *
 *   npm run db:push   – create/update tables to match src/server/db/schema.ts
 *
 * Uses the same env vars as the app (DATABASE_URL or DB_*; DB_SSL=true for TLS).
 */
import { defineConfig } from 'drizzle-kit';
import { getDatabaseCredentials } from './src/server/db/config';

const credentials = getDatabaseCredentials();

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password,
    database: credentials.database,
    ...(credentials.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  },
  verbose: true,
  strict: false,
});
