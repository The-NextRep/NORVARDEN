/**
 * Permanently remove ONE account (and the company it applied with, its job
 * posts, subscriptions, messages, etc.). Admin accounts are never removed.
 *
 *   npm run remove-account -- someone@example.com
 *
 * Asks for no confirmation — double-check the email first. IRREVERSIBLE.
 */
import { closeConnection } from '../server/db/client';
import { exactEmailMatch, purgeAccounts } from '../server/lib/purge-accounts';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Usage: npm run remove-account -- someone@example.com');
    process.exit(1);
  }
  const counts = await purgeAccounts(exactEmailMatch(email));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) console.log(`Nothing found for ${email}.`);
  else console.log(`Removed for ${email}:`, Object.entries(counts).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(', '));
  await closeConnection();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
