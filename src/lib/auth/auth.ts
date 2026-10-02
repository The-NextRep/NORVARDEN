/**
 * BetterAuth Server Configuration
 *
 * Supports both Email/Password and OAuth authentication.
 * Enable/disable methods by uncommenting the relevant sections.
 *
 * Secrets (via getSecret from #airo/secrets):
 * - BETTER_AUTH_SECRET: Session encryption key (auto-generated during install)
 * - OAuth credentials (GOOGLE_CLIENT_ID, etc.) for social login
 *
 * CORS/Trusted Origins:
 * - Only trusts origins matching the server's hostname
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/server/db/client';
import { user, session, account, verification } from '@/server/db/schema';
import { getSecret } from '#airo/secrets';

// Lazy singleton — betterAuth() must NOT run at module init time.
//
// The BETTER_AUTH_SECRET is loaded from the alloc config at runtime, so the
// auth instance must be constructed after the secrets are available (i.e. on
// the first HTTP request, not at import time).
//
// Pattern mirrors how db/client.ts defers the actual MySQL connection — the
// pool object is safe to create at init, but anything that reads schema state
// or secrets must be deferred to request time.
let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (_auth) return _auth;

  const authSecret = getSecret('BETTER_AUTH_SECRET');
  if (!authSecret || typeof authSecret !== 'string') {
    throw new Error('BETTER_AUTH_SECRET is not set or invalid — run requestSecrets() first');
  }

  if (!db) {
    throw new Error('Database not configured. Install the database skill first, then configure auth.');
  }

  const auth = betterAuth({
    // Schema passed explicitly — avoids BetterAuth's runtime schema inference.
    database: drizzleAdapter(db, {
      provider: 'mysql',
      schema: { user, session, account, verification },
    }),

    secret: authSecret,

    // Protect admin status field from user input
    user: {
      additionalFields: {
        isAdmin: {
          type: 'boolean',
          defaultValue: false,
          input: false,  // Prevent clients from writing this field
          returned: true,
        },
        suspended: {
          type: 'boolean',
          defaultValue: false,
          input: false,
          returned: true,
        },
      },
    },

    // Public site URL (e.g. https://www.norvarden.com). Set BETTER_AUTH_URL
    // in production so the base URL never depends on the incoming Host header.
    // Falls back to Railway's own public domain when neither is set.
    ...(process.env.BETTER_AUTH_URL || process.env.APP_BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN
      ? {
          baseURL:
            process.env.BETTER_AUTH_URL ||
            process.env.APP_BASE_URL ||
            `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
        }
      : {}),

    // Origins allowed to call auth endpoints from a browser.
    trustedOrigins: (request?: Request) => {
      const configured = [
        process.env.BETTER_AUTH_URL,
        process.env.APP_BASE_URL,
        process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined,
        ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '').split(','),
      ]
        .map((o) => o?.trim().replace(/\/+$/, ''))
        .filter((o): o is string => !!o);

      const origin = request?.headers.get('origin');
      if (origin) {
        try {
          const hostname = new URL(origin).hostname;
          if (
            process.env.NODE_ENV !== 'production' &&
            (hostname === 'localhost' || hostname === '127.0.0.1')
          ) {
            return [...configured, origin];
          }
        } catch {
          /* ignore malformed origin */
        }
      }
      return configured;
    },

    emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128 },

    // socialProviders: {
    //   google: {
    //     clientId: getSecret('GOOGLE_CLIENT_ID') as string,
    //     clientSecret: getSecret('GOOGLE_CLIENT_SECRET') as string,
    //   },
    //   github: {
    //     clientId: getSecret('GITHUB_CLIENT_ID') as string,
    //     clientSecret: getSecret('GITHUB_CLIENT_SECRET') as string,
    //   },
    // },
  });

  _auth = auth as unknown as ReturnType<typeof betterAuth>;
  return auth;
}

export type Session = ReturnType<typeof getAuth>['$Infer']['Session'];
export type User = ReturnType<typeof getAuth>['$Infer']['Session']['user'];
