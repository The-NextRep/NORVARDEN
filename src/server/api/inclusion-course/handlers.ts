/**
 * Inclusion course for employer teams.
 *
 *   GET  /api/inclusion-course/status   the company's badge date + certificates
 *   POST /api/inclusion-course/submit   { participantName, answers[] } → graded
 *
 * Grading happens here so the answer key never reaches the browser. Passing
 * records a certificate and (re)starts the company's 12-month badge.
 */
import type { Request, Response } from 'express';
import { desc, eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { inclusionCourseCompletions, verifiedCompanies } from '@/server/db/schema';
import { resolveEmployerForUser } from '@/server/lib/company-access';
import { QUIZ_ANSWERS } from '@/server/lib/inclusion-course-key';
import { PASS_SCORE, QUIZ } from '@/lib/inclusion-course';

const REASON_MESSAGES: Record<string, string> = {
  not_employer: 'Sign in with your verified employer account to earn the badge.',
  email_unverified: 'Confirm your work email first, then try again.',
  not_approved: 'Your company needs to be verified before it can earn the badge.',
  suspended: 'This company account is suspended.',
};

async function employerFor(req: Request, res: Response) {
  const session = await getAuth().api.getSession({ headers: req.headers as unknown as Headers });
  if (!session?.user) {
    res.status(401).json({ error: 'Sign in with your employer account to take the quiz.' });
    return null;
  }
  const r = await resolveEmployerForUser(session.user.id);
  if (!r.ok) {
    res.status(403).json({ error: REASON_MESSAGES[r.reason] ?? 'Employer account required.', reason: r.reason });
    return null;
  }
  return { userId: session.user.id, company: r.company };
}

export async function inclusionCourseStatus(req: Request, res: Response) {
  try {
    const emp = await employerFor(req, res);
    if (!emp) return;
    const [vc] = await db
      .select({ certifiedAt: verifiedCompanies.inclusionCertifiedAt })
      .from(verifiedCompanies)
      .where(eq(verifiedCompanies.id, emp.company.id))
      .limit(1);
    const certificates = await db
      .select({
        id: inclusionCourseCompletions.id,
        participantName: inclusionCourseCompletions.participantName,
        score: inclusionCourseCompletions.score,
        passedAt: inclusionCourseCompletions.passedAt,
      })
      .from(inclusionCourseCompletions)
      .where(eq(inclusionCourseCompletions.companyId, emp.company.id))
      .orderBy(desc(inclusionCourseCompletions.passedAt))
      .limit(100);
    return res.json({ companyName: emp.company.legalName, certifiedAt: vc?.certifiedAt ?? null, certificates });
  } catch (err) {
    console.error('GET /api/inclusion-course/status', err);
    return res.status(500).json({ error: 'Could not load your course status.' });
  }
}

export async function inclusionCourseSubmit(req: Request, res: Response) {
  try {
    const emp = await employerFor(req, res);
    if (!emp) return;

    const body = (req.body ?? {}) as { participantName?: unknown; answers?: unknown };
    const name = typeof body.participantName === 'string' ? body.participantName.trim().slice(0, 120) : '';
    if (name.length < 2) return res.status(400).json({ error: 'Enter the full name of the person taking the course.' });
    const answers = body.answers;
    if (!Array.isArray(answers) || answers.length !== QUIZ.length || answers.some((a) => !Number.isInteger(a))) {
      return res.status(400).json({ error: 'Answer every question before submitting.' });
    }

    const wrong: number[] = [];
    answers.forEach((a, i) => { if (a !== QUIZ_ANSWERS[i]) wrong.push(i); });
    const score = QUIZ.length - wrong.length;
    const passed = score >= PASS_SCORE;

    if (!passed) return res.json({ passed, score, total: QUIZ.length, wrong });

    const now = new Date();
    const result = await db.insert(inclusionCourseCompletions).values({
      companyId: emp.company.id,
      userId: emp.userId,
      participantName: name,
      score,
      passedAt: now,
    });
    await db.update(verifiedCompanies).set({ inclusionCertifiedAt: now }).where(eq(verifiedCompanies.id, emp.company.id));

    return res.json({
      passed,
      score,
      total: QUIZ.length,
      wrong,
      certificate: { id: Number(result[0].insertId), participantName: name, score, companyName: emp.company.legalName, passedAt: now },
    });
  } catch (err) {
    console.error('POST /api/inclusion-course/submit', err);
    return res.status(500).json({ error: 'Could not submit the quiz. Please try again.' });
  }
}
