/**
 * Give an EXISTING account admin rights.
 *
 *   npm run create-admin -- you@example.com
 *
 * Sign up on the site first (so the account has a proper password), then run
 * this once against the production database (DATABASE_URL must be set).
 */
import { eq } from 'drizzle-orm';
import { db, closeConnection } from '../server/db/client';
import { user } from '../server/db/schema';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run create-admin -- you@example.com');
    process.exit(1);
  }
  const [found] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!found) {
    console.error(`No account found for ${email}. Sign up on the site first, then run this again.`);
    process.exit(1);
  }
  await db.update(user).set({ isAdmin: true, suspended: false }).where(eq(user.id, found.id));
  console.log(`${email} is now an admin.`);
  await closeConnection();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
