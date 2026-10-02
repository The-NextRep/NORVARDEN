/**
 * Résumé builder — members draft a résumé on the site.
 *
 *   GET /api/resume-builder   { resume | null, updatedAt, prefill }
 *   PUT /api/resume-builder   body { resume } → { ok, updatedAt }
 *
 * Everything is validated and trimmed server-side; unknown fields are dropped.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { memberProfiles, memberResumes } from '@/server/db/schema';
import { requireMember } from '@/server/lib/member';
import { emptyResume, RESUME_LIMITS as L, type ResumeData } from '@/lib/resume-types';

function str(v: unknown, max: number = L.text): string {
  return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '';
}
function arr(v: unknown, max: number): unknown[] {
  return Array.isArray(v) ? v.slice(0, max) : [];
}
function id(v: unknown, i: number): string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : `i${i}`;
}

export function sanitizeResume(input: unknown): ResumeData {
  const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out = emptyResume();
  out.fullName = str(r.fullName);
  out.headline = str(r.headline);
  out.email = str(r.email);
  out.phone = str(r.phone, 50);
  out.location = str(r.location);
  out.linkedinUrl = str(r.linkedinUrl);
  out.summary = str(r.summary, L.summary);
  out.template = r.template === 'modern' ? 'modern' : 'classic';
  out.experience = arr(r.experience, L.experience).map((e, i) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return {
      id: id(x.id, i),
      title: str(x.title),
      organization: str(x.organization),
      location: str(x.location),
      start: str(x.start, 40),
      end: str(x.end, 40),
      current: x.current === true,
      bullets: arr(x.bullets, L.bullets).map((b) => str(b, L.bullet)).filter(Boolean),
    };
  });
  out.education = arr(r.education, L.education).map((e, i) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return { id: id(x.id, i), school: str(x.school), credential: str(x.credential), field: str(x.field), year: str(x.year, 40) };
  });
  out.certifications = arr(r.certifications, L.certifications).map((e, i) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return { id: id(x.id, i), name: str(x.name), issuer: str(x.issuer), year: str(x.year, 40) };
  });
  const seen = new Set<string>();
  out.skills = arr(r.skills, L.skills)
    .map((s) => str(s, L.skill))
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
  return out;
}

export async function getMyResume(_req: Request, res: Response) {
  const user = await requireMember(res);
  if (!user) return;
  try {
    const [saved] = await db
      .select({ data: memberResumes.data, updatedAt: memberResumes.updatedAt })
      .from(memberResumes)
      .where(eq(memberResumes.userId, user.id))
      .limit(1);

    const [p] = await db.select().from(memberProfiles).where(eq(memberProfiles.userId, user.id)).limit(1);
    const prefill = {
      fullName: [p?.firstName, p?.lastName].filter(Boolean).join(' '),
      headline: p?.headline ?? '',
      email: user.email,
      phone: p?.phone ?? '',
      location: [p?.city, p?.state].filter(Boolean).join(', '),
      linkedinUrl: p?.linkedinUrl ?? '',
      summary: p?.experienceSummary ?? p?.bio ?? '',
      skills: Array.isArray(p?.skills) ? p.skills : [],
      memberType: p?.memberType ?? null,
      sport: p?.sport ?? null,
      league: p?.league ?? null,
      yearsActive: p?.yearsActive ?? null,
      coachingSport: p?.coachingSport ?? null,
      coachingLevel: p?.coachingLevel ?? null,
      yearsCoaching: p?.yearsCoaching ?? null,
      branch: p?.branch ?? null,
      mos: p?.mos ?? null,
      yearsServed: p?.yearsServed ?? null,
    };
    res.json({ resume: saved ? sanitizeResume(saved.data) : null, updatedAt: saved?.updatedAt ?? null, prefill });
  } catch (err) {
    console.error('[resume-builder] get failed', err);
    res.status(500).json({ error: 'Could not load your résumé.' });
  }
}

export async function saveMyResume(req: Request, res: Response) {
  const user = await requireMember(res);
  if (!user) return;
  const body = (req.body ?? {}) as { resume?: unknown };
  if (!body.resume || typeof body.resume !== 'object') return res.status(400).json({ error: 'Nothing to save.' });
  const data = sanitizeResume(body.resume);
  try {
    const [existing] = await db
      .select({ id: memberResumes.id })
      .from(memberResumes)
      .where(eq(memberResumes.userId, user.id))
      .limit(1);
    if (existing) {
      await db.update(memberResumes).set({ data }).where(eq(memberResumes.id, existing.id));
    } else {
      await db.insert(memberResumes).values({ userId: user.id, data });
    }
    res.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[resume-builder] save failed', err);
    res.status(500).json({ error: 'Could not save your résumé.' });
  }
}
