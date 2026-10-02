/**
 * /inclusion-course — short course for employer teams on hiring and working
 * with disabled talent. Anyone can read the lessons; a signed-in verified
 * employer takes the quiz (graded on the server). Passing gives the person a
 * certificate and the company the Inclusion Certified badge for 12 months.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Award, CheckCircle2, Clock, HeartHandshake, Printer, XCircle } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import { COURSE_MODULES, PASS_SCORE, QUIZ, isInclusionCertified } from '@/lib/inclusion-course';

const siteUrl = 'https://www.norvarden.com';
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const border  = '1px solid hsl(var(--hero-gold) / 0.2)';
const eyebrow = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', color: gold } as const;
const totalMinutes = COURSE_MODULES.reduce((n, m) => n + m.minutes, 0);

interface Certificate { id: number; participantName: string; score: number; passedAt: string; companyName?: string }
type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; companyName: string; certifiedAt: string | null; certificates: Certificate[] }
  | { kind: 'signed_out' }
  | { kind: 'blocked'; message: string };
interface Result { passed: boolean; score: number; total: number; wrong: number[]; certificate?: Certificate & { companyName: string } }

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const expires = (d: string | Date) => { const x = new Date(d); x.setFullYear(x.getFullYear() + 1); return fmtDate(x); };

function CertificateCard({ cert, companyName }: { cert: Certificate; companyName: string }) {
  return (
    <div id="certificate" className="flex flex-col items-center text-center gap-4 p-8 md:p-10 rounded-md" style={{ background: navyMid, border: `1px solid ${gold}` }}>
      <BrandMark size={20} tagline />
      <p className="font-barlow-condensed uppercase mt-2" style={eyebrow}>Certificate of completion</p>
      <p className="font-bodoni" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: white, lineHeight: 1.15 }}>{cert.participantName}</p>
      <p className="font-barlow max-w-md" style={{ fontSize: '16px', lineHeight: 1.6, color: ice60 }}>
        of <strong style={{ color: white }}>{companyName}</strong> completed NORVARDEN's course
        <em> Hiring &amp; Working With Disabled Talent</em> with a score of {cert.score}/{QUIZ.length}.
      </p>
      <p className="font-barlow inline-flex items-center gap-2" style={{ fontSize: '14px', color: gold }}>
        <HeartHandshake size={16} aria-hidden="true" /> Inclusion Certified · {fmtDate(cert.passedAt)} · valid until {expires(cert.passedAt)}
      </p>
      <p className="font-barlow" style={{ fontSize: '12px', color: ice60 }}>Certificate no. NV-{String(cert.id).padStart(5, '0')}</p>
    </div>
  );
}

export default function InclusionCoursePage() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUIZ.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const loadStatus = () =>
    fetch('/api/inclusion-course/status', { credentials: 'include' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.status === 401) return setStatus({ kind: 'signed_out' });
        if (!r.ok) return setStatus({ kind: 'blocked', message: d.error ?? 'The quiz is available to verified employers.' });
        setStatus({ kind: 'ready', ...d });
      })
      .catch(() => setStatus({ kind: 'blocked', message: 'Could not load the quiz. Please refresh.' }));

  useEffect(() => { void loadStatus(); }, []);

  const submit = async () => {
    setError('');
    if (name.trim().length < 2) return setError('Enter the full name of the person taking the course.');
    if (answers.some((a) => a === null)) return setError('Answer every question before submitting.');
    setSubmitting(true);
    try {
      const r = await fetch('/api/inclusion-course/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: name.trim(), answers }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? 'Could not submit the quiz.');
      setResult(d as Result);
      if (d.passed) void loadStatus();
      document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setResult(null); setAnswers(QUIZ.map(() => null)); };
  const btn = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.24em', padding: '14px 28px', borderRadius: '6px', color: navy } as const;

  return (
    <>
      <Helmet>
        <title>Inclusion Course for Employers — NORVARDEN</title>
        <meta name="description" content={`A ${totalMinutes}-minute course for hiring teams on working with disabled talent. Pass the quiz to earn the Inclusion Certified badge.`} />
        <link rel="canonical" href={`${siteUrl}/inclusion-course`} />
        <meta property="og:title" content="Inclusion Course for Employers — NORVARDEN" />
        <meta property="og:url" content={`${siteUrl}/inclusion-course`} />
        <style>{`@media print { body * { visibility: hidden } #certificate, #certificate * { visibility: visible } #certificate { position: absolute; inset: 0; margin: auto; height: fit-content; } }`}</style>
      </Helmet>

      <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
        <div className="max-w-3xl mx-auto flex flex-col gap-14">
          <header className="flex flex-col gap-5">
            <p className="font-barlow-condensed uppercase" style={eyebrow}>For employers · Inclusion course</p>
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', lineHeight: 1.1, color: white }}>
              Hiring &amp; working with <em className="gold-shimmer">disabled talent.</em>
            </h1>
            <p className="font-barlow" style={{ fontSize: '18px', lineHeight: 1.7, color: ice60 }}>
              Five short lessons and a 10-question quiz. Any member of your team can take it. When someone passes,
              they get a certificate and your company earns the <strong style={{ color: gold }}>Inclusion Certified</strong> badge
              on every job you post, for 12 months.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-barlow" style={{ fontSize: '15px', color: white }}>
              <li className="inline-flex items-center gap-2"><Clock size={16} style={{ color: gold }} aria-hidden="true" /> About {totalMinutes} minutes</li>
              <li className="inline-flex items-center gap-2"><CheckCircle2 size={16} style={{ color: gold }} aria-hidden="true" /> Pass with {PASS_SCORE} of {QUIZ.length}</li>
              <li className="inline-flex items-center gap-2"><Award size={16} style={{ color: gold }} aria-hidden="true" /> Free for verified employers</li>
            </ul>
          </header>

          {/* Lessons */}
          <section className="flex flex-col gap-5" aria-labelledby="lessons">
            <h2 id="lessons" className="font-barlow-condensed uppercase" style={eyebrow}>The lessons</h2>
            {COURSE_MODULES.map((m, i) => (
              <article key={m.title} className="p-6 md:p-7 rounded-md flex flex-col gap-4" style={{ background: navyMid, border }}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-bodoni" style={{ fontSize: '21px', color: white, lineHeight: 1.3 }}>
                    <span style={{ color: gold }}>{i + 1}.</span> {m.title}
                  </h3>
                  <span className="font-barlow shrink-0" style={{ fontSize: '13px', color: ice60 }}>{m.minutes} min</span>
                </div>
                <ul className="flex flex-col gap-3 list-disc pl-5 font-barlow" style={{ fontSize: '16px', lineHeight: 1.65, color: 'hsl(var(--hero-ice) / 0.88)' }}>
                  {m.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </article>
            ))}
          </section>

          {/* Quiz */}
          <section id="quiz" className="flex flex-col gap-6 scroll-mt-28" aria-labelledby="quiz-h">
            <h2 id="quiz-h" className="font-barlow-condensed uppercase" style={eyebrow}>Quiz &amp; badge</h2>

            {status.kind === 'ready' && isInclusionCertified(status.certifiedAt) && !result && (
              <p className="font-barlow p-4 rounded-md inline-flex items-center gap-3" style={{ fontSize: '15px', color: white, border: `1px solid ${gold}` }}>
                <HeartHandshake size={18} style={{ color: gold }} aria-hidden="true" />
                {status.companyName} is Inclusion Certified until {expires(status.certifiedAt!)}. More team members can still take the quiz.
              </p>
            )}

            {status.kind === 'loading' && <p className="font-barlow" style={{ color: ice60 }}>Loading…</p>}

            {status.kind === 'signed_out' && (
              <div className="p-6 rounded-md flex flex-col gap-4" style={{ background: navyMid, border }}>
                <p className="font-barlow" style={{ fontSize: '16px', color: white }}>Sign in with your verified employer account to take the quiz and earn the badge.</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <Link to="/login?next=/inclusion-course%23quiz" className="gold-shimmer-bg font-barlow-condensed uppercase" style={btn}>Employer sign in</Link>
                  <Link to="/verify-company" className="font-barlow underline underline-offset-4" style={{ fontSize: '15px', color: ice60 }}>Not verified yet? Get verified</Link>
                </div>
              </div>
            )}

            {status.kind === 'blocked' && (
              <div className="p-6 rounded-md flex flex-col gap-3" style={{ background: navyMid, border }}>
                <p className="font-barlow" style={{ fontSize: '16px', color: white }}>{status.message}</p>
                <Link to="/verify-company" className="font-barlow underline underline-offset-4" style={{ fontSize: '15px', color: gold }}>Verify your company</Link>
              </div>
            )}

            {status.kind === 'ready' && result && (
              result.passed && result.certificate ? (
                <div className="flex flex-col gap-5">
                  <p className="font-barlow" role="status" style={{ fontSize: '17px', color: white }}>
                    You passed with {result.score}/{result.total}. {status.companyName} now shows the Inclusion Certified badge on its jobs.
                  </p>
                  <CertificateCard cert={result.certificate} companyName={result.certificate.companyName} />
                  <div className="flex flex-wrap gap-4">
                    <button type="button" onClick={() => window.print()} className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2" style={btn}>
                      <Printer size={14} aria-hidden="true" /> Print or save PDF
                    </button>
                    <button type="button" onClick={() => { retry(); setName(''); }} className="font-barlow underline underline-offset-4" style={{ fontSize: '15px', color: ice60 }}>
                      Another team member? Take it again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-md flex flex-col gap-4" role="status" style={{ background: navyMid, border }}>
                  <p className="font-barlow inline-flex items-center gap-2" style={{ fontSize: '17px', color: white }}>
                    <XCircle size={18} style={{ color: gold }} aria-hidden="true" /> You scored {result.score}/{result.total}. You need {PASS_SCORE} to pass.
                  </p>
                  <p className="font-barlow" style={{ fontSize: '15px', color: ice60 }}>
                    Review these questions and the lessons above, then try again: {result.wrong.map((i) => `#${i + 1}`).join(', ')}.
                  </p>
                  <button type="button" onClick={retry} className="gold-shimmer-bg font-barlow-condensed uppercase self-start" style={btn}>Try again</button>
                </div>
              )
            )}

            {status.kind === 'ready' && !result && (
              <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
                <label className="flex flex-col gap-2 font-barlow" style={{ fontSize: '15px', color: white }}>
                  Full name of the person taking the course (printed on the certificate)
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    autoComplete="name"
                    className="px-4 py-3 rounded-md"
                    style={{ background: navyMid, border, color: white, fontSize: '16px' }}
                  />
                </label>

                {QUIZ.map((q, qi) => (
                  <fieldset key={q.q} className="p-5 rounded-md flex flex-col gap-3" style={{ background: navyMid, border }}>
                    <legend className="font-barlow px-1" style={{ fontSize: '16px', color: white, fontWeight: 600 }}>
                      {qi + 1}. {q.q}
                    </legend>
                    {q.options.map((opt, oi) => (
                      <label key={opt} className="flex items-start gap-3 font-barlow cursor-pointer" style={{ fontSize: '15px', lineHeight: 1.5, color: 'hsl(var(--hero-ice) / 0.88)' }}>
                        <input
                          type="radio"
                          name={`q${qi}`}
                          checked={answers[qi] === oi}
                          onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                          className="mt-1 shrink-0"
                          style={{ accentColor: '#C6AC86', width: 18, height: 18 }}
                        />
                        {opt}
                      </label>
                    ))}
                  </fieldset>
                ))}

                {error && <p className="font-barlow" role="alert" style={{ fontSize: '15px', color: '#F2B8B5' }}>{error}</p>}
                <button type="submit" disabled={submitting} className="gold-shimmer-bg font-barlow-condensed uppercase self-start disabled:opacity-60" style={btn}>
                  {submitting ? 'Checking…' : 'Submit quiz'}
                </button>
              </form>
            )}

            {status.kind === 'ready' && status.certificates.length > 0 && (
              <div className="flex flex-col gap-3 pt-4">
                <h3 className="font-barlow-condensed uppercase" style={eyebrow}>Your team's certificates</h3>
                <ul className="flex flex-col gap-2 font-barlow" style={{ fontSize: '15px', color: white }}>
                  {status.certificates.map((c) => (
                    <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2" style={{ borderBottom: border }}>
                      <span>{c.participantName}</span>
                      <span style={{ color: ice60 }}>{fmtDate(c.passedAt)} · {c.score}/{QUIZ.length} · NV-{String(c.id).padStart(5, '0')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
