/**
 * Database configuration loader.
 *
 * Reads credentials from environment variables:
 *   - DATABASE_URL (or MYSQL_URL), e.g. mysql://user:pass@host:3306/dbname
 *   - or DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
 * Set DB_SSL=true when the database requires TLS (most hosted providers on
 * public networks). Railway's private network does not.
 */
import { env } from 'node:process';

export interface DatabaseCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

export function getDatabaseCredentials(): DatabaseCredentials {
  const ssl = /^(1|true|yes)$/i.test(env.DB_SSL ?? '');
  const url = env.DATABASE_URL || env.MYSQL_URL;

  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      ssl,
    };
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error(
      'Database not configured: set DATABASE_URL, or DB_HOST, DB_USER, DB_PASSWORD and DB_NAME.',
    );
  }
  return {
    host: DB_HOST,
    port: DB_PORT ? parseInt(DB_PORT, 10) : 3306,
    user: DB_USER,
    password: DB_PASSWORD ?? '',
    database: DB_NAME,
    ssl,
  };
}
