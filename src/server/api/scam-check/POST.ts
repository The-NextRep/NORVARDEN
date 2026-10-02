import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { scamFlagRules } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

let cachedRules: { keyword: string; category: string }[] | null = null;
let cacheTime = 0;

async function getRules() {
  if (cachedRules && Date.now() - cacheTime < 60_000) return cachedRules;
  const rows = await db.select({ keyword: scamFlagRules.keyword, category: scamFlagRules.category })
    .from(scamFlagRules)
    .where(eq(scamFlagRules.active, true));
  cachedRules = rows;
  cacheTime = Date.now();
  return rows;
}

export default async function handler(req: Request, res: Response) {
  const { text } = req.body as { text?: string };
  if (!text) { res.status(400).json({ error: 'text required' }); return; }

  const rules = await getRules();
  const lower = text.toLowerCase();
  const matches = rules.filter((r: { keyword: string; category: string }) => lower.includes(r.keyword.toLowerCase()));

  res.json({
    flagged: matches.length > 0,
    matches: matches.map((m: { keyword: string; category: string }) => ({ keyword: m.keyword, category: m.category })),
  });
}
