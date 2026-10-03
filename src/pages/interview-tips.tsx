import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CheckCircle2, ChevronRight, AlertTriangle, MessageSquare } from 'lucide-react';

const siteUrl = 'https://www.norvarden.com';

const navy   = 'hsl(var(--hero-navy))';
const gold   = 'hsl(var(--hero-gold))';
const white  = 'hsl(var(--hero-white))';
const faded  = 'hsl(var(--hero-ice) / 0.8)';
const panel  = 'hsl(var(--hero-panel-bg))';
const line   = '1px solid hsl(var(--hero-gold) / 0.28)';

type Track = 'story' | 'disclosure' | 'accommodations';

interface QA { q: string; a: string }
interface TrackContent {
  label: string;
  story: string[];
  questions: QA[];
  watchOuts: string[];
}

const TRACKS: Record<Track, TrackContent> = {
  story: {
    label: 'Your story',
    story: [
      'Lead with your skills and results. The interview is about what you can do for the team, so open with two or three strengths that match the job description, each backed by one specific example.',
      'Living with a disability often builds real workplace strengths: problem-solving, planning ahead, adaptability and persistence. If you choose to, you can name these as skills without explaining your diagnosis.',
      'Have a short, confident answer ready for gaps in your work history: "I took time to focus on my health, and I’m ready to get back to work. During that time I also [course, volunteering, project]." Then move on.',
      'Know the company. Research their products, customers and recent news, and look for signs of inclusion such as an accessibility statement, employee resource groups or accommodation language in the job post.',
    ],
    questions: [
      { q: 'Tell me about yourself.', a: 'Two minutes: what you do now, two achievements with numbers, and why this role fits. Your disability does not need to be part of this answer unless you want it to be.' },
      { q: 'Can you explain this gap in your résumé?', a: 'Keep it brief and honest without medical detail ("I was managing a health matter, which is resolved / well managed"). Mention anything you learned or did during that time, then pivot to why you are ready for this role.' },
      { q: 'Can you perform the essential functions of this job?', a: 'Employers may ask this. Answer yes if you can, with or without accommodation, and give an example of how you get similar work done. You do not need to name a diagnosis.' },
      { q: 'Tell me about a challenge you overcame.', a: 'Use STAR (see below). A work, school or personal challenge all count. Focus on your actions and the result; share only the personal detail you are comfortable with.' },
      { q: 'How do you stay organized and meet deadlines?', a: 'Describe your actual system: tools, apps, routines or assistive technology. Showing a reliable process is a strength, whatever tools you use.' },
      { q: 'Why do you want to work here?', a: 'Name something specific you admire about the company and connect it to your skills. If their inclusion work matters to you, say so; it shows you did your research.' },
    ],
    watchOuts: [
      'Apologizing for your disability or your résumé. You are there because your experience earned the interview.',
      'Over-explaining a gap or a medical history. Short and forward-looking beats long and detailed.',
      'Generic answers. Swap "I’m a hard worker" for a concrete example with a number in it.',
      'Forgetting to ask your own questions. Interviews are a two-way decision.',
    ],
  },
  disclosure: {
    label: 'Disclosure',
    story: [
      'Disclosure is your choice. You are not required to tell an employer about a disability, and on NORVARDEN anything you share is optional.',
      'Timing is up to you: on the application, when you schedule the interview (often the best time if you need an accommodation), at the offer stage, after you start, or never.',
      'If you disclose, keep it short and practical. Focus on what you need to do your best work, not on medical details: "I have a hearing impairment, so captions on video calls help me participate fully."',
      'In the U.S., the ADA generally bars employers with 15 or more employees from asking whether you have a disability before a job offer. They can ask whether you can do the essential functions of the job.',
    ],
    questions: [
      { q: 'Do you have any disabilities or health conditions?', a: 'Before an offer, this question generally isn’t allowed. Stay calm and redirect: "I’m confident I can do the essential functions of this role. Happy to walk you through how I’d approach them."' },
      { q: 'Is there anything we should know to make this process work for you?', a: 'This is an invitation, not a trap. Name any accommodation you need for the interview, or simply say "No, thank you, I’m all set."' },
      { q: 'Why did you leave your last job?', a: 'Keep it positive and brief. If health was a factor, you can say you left to focus on a personal matter that is now managed, without further detail.' },
      { q: 'How do you work best?', a: 'A natural place to share preferences (written instructions, quiet space, flexible hours) without labeling them, if you choose.' },
    ],
    watchOuts: [
      'Feeling pressured to share more than you want. "I’d prefer to keep that private" is a complete answer.',
      'Disclosing at the very end of the process when you needed an interview accommodation from the start. If you need it, ask early.',
      'Leading with diagnosis instead of solutions. Employers respond best to "here’s what helps me do great work."',
      'Assuming every interviewer knows the rules. If something feels off, note it and contact HR or the Job Accommodation Network (askjan.org).',
    ],
  },
  accommodations: {
    label: 'Accommodations',
    story: [
      'You can ask for accommodations for the interview itself: extra time, a sign-language interpreter, captions, an accessible location, a quiet room, questions in writing, or a different format such as phone, video or in person.',
      'Ask early and in writing, ideally when you schedule: "To participate fully, I’ll need [accommodation]. Can you confirm that’s available?" Keep a copy of the email.',
      'For video interviews, test your setup the day before: captions, screen reader, lighting, camera angle and any assistive tech. Have a phone number ready in case the link fails.',
      'Most workplace accommodations cost little or nothing. Employers on NORVARDEN have pledged to provide them, and many list theirs right in the job post.',
    ],
    questions: [
      { q: 'What accommodations would you need on the job?', a: 'If you choose to answer, be specific and practical: the tool or change, and how it helps you deliver. "Screen-reader software and documents in accessible formats" is clear and easy to act on.' },
      { q: 'How would you handle a fast-paced environment?', a: 'Describe the systems that keep you effective (prioritizing, breaks, written task lists, assistive tools) with an example of meeting a tight deadline.' },
      { q: 'Are you comfortable with the travel or on-site requirements?', a: 'Answer honestly. If you could do it with an adjustment (accessible transport, remote options), say so and frame it as a solution.' },
      { q: 'Do you have any questions for us?', a: 'A good place to ask how the team supports accommodations or flexible work: "How does the team handle flexible schedules or remote days?"' },
    ],
    watchOuts: [
      'Waiting until the interview day to mention an accommodation you need. Give the employer time to arrange it.',
      'Feeling like you are asking for a favor. Reasonable accommodations are a normal part of hiring.',
      'Skipping a tech check before a video interview, especially with captions or assistive software.',
      'Not getting confirmation in writing. A quick reply email avoids surprises on the day.',
    ],
  },
};

const UNIVERSAL: QA[] = [
  { q: 'Tell me about yourself.', a: 'Two minutes: present (what you do now or just finished), past (two proud achievements with numbers), future (why this role, why now). Practice it out loud.' },
  { q: 'Why this role? Why our company?', a: 'Name one thing about the company you genuinely admire and one part of the role that fits your strengths. Be specific; generic praise sounds rehearsed.' },
  { q: 'What’s your biggest weakness?', a: 'Choose a real but manageable weakness, explain what you are doing to improve it, and show progress. Avoid fake weaknesses like "I work too hard."' },
  { q: 'Tell me about a conflict at work.', a: 'Use STAR. Stay fair to the other person, focus on how you listened and solved the problem, and end with the result.' },
  { q: 'Tell me about a time you failed.', a: 'Own it without excuses, explain what you learned, and show what you did differently the next time.' },
  { q: 'What are your salary expectations?', a: 'Research the market range first (Glassdoor, LinkedIn, Levels). Offer a range based on research and say the full package matters to you.' },
  { q: 'Do you have any questions for us?', a: 'Always say yes. Ask two or three of the questions below. Asking nothing signals low interest.' },
];

const ASK_THEM = [
  'What does success look like in this role after 90 days? After a year?',
  'What are the biggest challenges the team is facing right now?',
  'How do you onboard and train new team members?',
  'What do the best people on your team have in common?',
  'How is performance measured and feedback given?',
  'What do you enjoy most about working here?',
  'How does this role contribute to the company’s goals this year?',
  'What are the next steps in the process, and when can I expect to hear back?',
];

const CHECKLIST = [
  {
    title: 'The week before',
    items: [
      'Research the company: products, customers, recent news, competitors.',
      'Re-read the job description and match three of your stories to its requirements.',
      'Write and rehearse your two-minute "tell me about yourself."',
      'Prepare five STAR stories you can adapt to different questions.',
      'Look up your interviewers on LinkedIn.',
      'Do a mock interview with a friend, mentor or teammate.',
      'Request any interview accommodations in writing and get confirmation.',
    ],
  },
  {
    title: 'The day of',
    items: [
      'Arrive 10 minutes early (or log on to video 5 minutes early and test audio/camera).',
      'Dress one step above the company’s everyday dress code.',
      'Bring printed copies of your résumé and a notebook with your questions.',
      'Silence your phone and keep a bottle of water nearby.',
      'Smile, make eye contact, and give a firm handshake (or a clear "hello" on video).',
      'Close by restating your interest and asking about next steps.',
    ],
  },
  {
    title: 'The day after',
    items: [
      'Send a thank-you email to each interviewer within 24 hours.',
      'Note what went well and what to tighten for next time.',
      'Follow up politely if you haven’t heard back by the date they gave you.',
    ],
  },
];

const THANK_YOU = `Subject: Thank you, [Role] interview

Hi [Name],

Thank you for taking the time to speak with me today about the [Role] position. I especially enjoyed learning about [specific topic you discussed], and it reinforced how much I’d like to contribute to [team/company goal].

My experience [one sentence connecting your background to their need] has prepared me to hit the ground running.

Please let me know if I can provide anything else. I look forward to hearing about next steps.

Best regards,
[Your name]
[Phone] | [LinkedIn]`;

const TRACK_ORDER: Track[] = ['story', 'disclosure', 'accommodations'];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.34em', color: gold }}>
      {children}
    </p>
  );
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-bodoni mb-6" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 400, lineHeight: 1.1, color: white }}>
      {children}
    </h2>
  );
}

function QACard({ item }: { item: QA }) {
  return (
    <div className="p-5" style={{ background: panel, border: line, borderRadius: '3px' }}>
      <p className="font-bodoni mb-2 flex gap-2" style={{ fontSize: '19px', fontWeight: 400, lineHeight: 1.3, color: white }}>
        <MessageSquare size={16} className="shrink-0" style={{ color: gold, marginTop: '5px' }} aria-hidden="true" />
        <span>&ldquo;{item.q}&rdquo;</span>
      </p>
      <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.65, color: faded }}>{item.a}</p>
    </div>
  );
}

export default function InterviewTipsPage() {
  const [track, setTrack] = useState<Track>('story');

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = TRACK_ORDER.indexOf(track);
    const next = TRACK_ORDER[(i + (e.key === 'ArrowRight' ? 1 : TRACK_ORDER.length - 1)) % TRACK_ORDER.length];
    setTrack(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  const content = TRACKS[track];

  return (
    <>
      <Helmet>
        <title>Interview Tips — NORVARDEN</title>
        <meta name="description" content="Interview prep for people with disabilities: telling your story, disclosure, requesting accommodations, common questions, the STAR method and a day-of checklist." />
        <link rel="canonical" href={`${siteUrl}/interview-tips`} />
        <meta property="og:title" content="Interview Tips — NORVARDEN" />
        <meta property="og:url" content={`${siteUrl}/interview-tips`} />
      </Helmet>

      <main style={{ background: navy, color: white }}>
        {/* Hero */}
        <section className="px-5 md:px-12 pt-20 pb-14 mx-auto" style={{ maxWidth: '1100px' }}>
          <Eyebrow>Interview prep</Eyebrow>
          <h1 className="font-bodoni mb-5" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 400, lineHeight: 1.03, letterSpacing: '-0.01em' }}>
            Walk in <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>ready.</em>
          </h1>
          <div className="mb-6" style={{ width: '64px', height: '1px', background: 'hsl(var(--hero-gold) / 0.6)' }} />
          <p className="font-barlow" style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.7, color: faded, maxWidth: '62ch' }}>
            You bring skills, resilience and problem-solving to the table. This guide helps you tell your story, decide what to share, ask for the accommodations you need, and walk in confident.
          </p>
        </section>

        {/* Tracks */}
        <section className="px-5 md:px-12 pb-16 mx-auto" style={{ maxWidth: '1100px' }} aria-labelledby="your-background">
          <H2 id="your-background">Prepare your way</H2>
          <div role="tablist" aria-label="Interview topics" className="inline-flex flex-wrap gap-1 p-1 mb-8" style={{ border: line, borderRadius: '3px' }}>
            {TRACK_ORDER.map((t) => {
              const active = t === track;
              return (
                <button
                  key={t}
                  id={`tab-${t}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`panel-${t}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTrack(t)}
                  onKeyDown={onTabKey}
                  className={`font-barlow-condensed uppercase ${active ? 'gold-shimmer-bg' : ''}`}
                  style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.22em', padding: '10px 20px', borderRadius: '2px', color: active ? navy : faded, outlineColor: gold }}
                >
                  {TRACKS[t].label}
                </button>
              );
            })}
          </div>

          <div id={`panel-${track}`} role="tabpanel" aria-labelledby={`tab-${track}`} className="flex flex-col gap-12">
            <div>
              <Eyebrow>Key points</Eyebrow>
              <ul className="grid gap-4 md:grid-cols-2">
                {content.story.map((s) => (
                  <li key={s} className="flex gap-3 p-5" style={{ background: panel, border: line, borderRadius: '3px' }}>
                    <CheckCircle2 size={18} className="shrink-0" style={{ color: gold, marginTop: '2px' }} aria-hidden="true" />
                    <span className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.65, color: white }}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow>Questions you’ll likely get</Eyebrow>
              <div className="grid gap-4 md:grid-cols-2">
                {content.questions.map((item) => <QACard key={item.q} item={item} />)}
              </div>
            </div>

            <div>
              <Eyebrow>Watch out for</Eyebrow>
              <ul className="flex flex-col gap-3">
                {content.watchOuts.map((w) => (
                  <li key={w} className="flex gap-3 font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.65, color: white }}>
                    <AlertTriangle size={16} className="shrink-0" style={{ color: gold, marginTop: '4px' }} aria-hidden="true" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* STAR */}
        <section className="px-5 md:px-12 py-16" style={{ background: panel, borderTop: line, borderBottom: line }}>
          <div className="mx-auto" style={{ maxWidth: '1100px' }}>
            <Eyebrow>The STAR method</Eyebrow>
            <H2>Answer any &ldquo;tell me about a time&rdquo; question</H2>
            <p className="font-barlow mb-8" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.7, color: faded, maxWidth: '65ch' }}>
              Structure every story in four parts and keep it to about two minutes. Spend most of your time on the Action and Result.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { k: 'S', t: 'Situation', d: 'Our team was three weeks from a product launch and two key people left unexpectedly.' },
                { k: 'T', t: 'Task', d: 'I was asked to keep the launch on schedule without lowering quality.' },
                { k: 'A', t: 'Action', d: 'I re-split the workload by strengths, set a 10-minute daily check-in, and cross-trained two teammates on the gaps.' },
                { k: 'R', t: 'Result', d: 'We launched on time, hit 112% of the first-month target, and both teammates were promoted that year.' },
              ].map((x) => (
                <div key={x.k} className="p-5" style={{ background: navy, border: line, borderRadius: '3px' }}>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="font-bodoni gold-shimmer" style={{ fontSize: '2.4rem', lineHeight: 1 }}>{x.k}</span>
                    <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.26em', color: gold }}>{x.t}</span>
                  </div>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.6, color: white }}>{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Universal questions */}
        <section className="px-5 md:px-12 py-16 mx-auto" style={{ maxWidth: '1100px' }}>
          <Eyebrow>Every interview</Eyebrow>
          <H2>Questions everyone gets</H2>
          <div className="grid gap-4 md:grid-cols-2">
            {UNIVERSAL.map((item) => <QACard key={item.q} item={item} />)}
          </div>
        </section>

        {/* Ask them */}
        <section className="px-5 md:px-12 pb-16 mx-auto" style={{ maxWidth: '1100px' }}>
          <Eyebrow>Your turn</Eyebrow>
          <H2>Great questions to ask them</H2>
          <ol className="grid gap-3 md:grid-cols-2">
            {ASK_THEM.map((q, i) => (
              <li key={q} className="flex gap-3 p-4" style={{ border: line, borderRadius: '3px' }}>
                <span className="font-bodoni shrink-0" style={{ fontSize: '20px', color: gold, width: '24px' }}>{i + 1}</span>
                <span className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.6, color: white }}>{q}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Checklist */}
        <section className="px-5 md:px-12 py-16" style={{ background: panel, borderTop: line, borderBottom: line }}>
          <div className="mx-auto" style={{ maxWidth: '1100px' }}>
            <Eyebrow>Checklist</Eyebrow>
            <H2>Before, during and after</H2>
            <div className="grid gap-6 md:grid-cols-3">
              {CHECKLIST.map((c) => (
                <div key={c.title}>
                  <p className="font-barlow-condensed uppercase mb-4" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.24em', color: gold }}>{c.title}</p>
                  <ul className="flex flex-col gap-3">
                    {c.items.map((it) => (
                      <li key={it} className="flex gap-2.5 font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.6, color: white }}>
                        <CheckCircle2 size={16} className="shrink-0" style={{ color: gold, marginTop: '4px' }} aria-hidden="true" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <p className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.24em', color: gold }}>Thank-you email template</p>
              <pre className="font-barlow p-5 overflow-x-auto" style={{ whiteSpace: 'pre-wrap', fontSize: '15px', fontWeight: 300, lineHeight: 1.65, color: white, background: navy, border: line, borderRadius: '3px' }}>
                {THANK_YOU}
              </pre>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 md:px-12 py-20 text-center">
          <h2 className="font-bodoni mb-4" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', fontWeight: 400, lineHeight: 1.1 }}>
            Ready for the next step?
          </h2>
          <p className="font-barlow mb-8 mx-auto" style={{ fontSize: '16px', fontWeight: 300, color: faded, maxWidth: '52ch' }}>
            Put your experience on paper, then find the roles that fit it.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/resume-builder" className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', padding: '16px 32px', borderRadius: '3px', color: navy }}>
              Build your résumé <ChevronRight size={13} />
            </Link>
            <Link to="/jobs" className="font-barlow-condensed uppercase inline-flex items-center gap-2"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', padding: '15px 32px', borderRadius: '3px', color: gold, border: '1px solid hsl(var(--hero-gold) / 0.7)' }}>
              Browse open roles <ChevronRight size={13} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
