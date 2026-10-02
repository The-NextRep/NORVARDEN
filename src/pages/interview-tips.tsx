import { useEffect, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CheckCircle2, ChevronRight, AlertTriangle, MessageSquare } from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';

const siteUrl = 'https://www.norvarden.com';

const navy   = 'hsl(var(--hero-navy))';
const gold   = 'hsl(var(--hero-gold))';
const white  = 'hsl(var(--hero-white))';
const faded  = 'hsl(var(--hero-ice) / 0.8)';
const panel  = 'hsl(var(--hero-panel-bg))';
const line   = '1px solid hsl(var(--hero-gold) / 0.28)';

type Track = 'athlete' | 'coach' | 'veteran';

interface QA { q: string; a: string }
interface TrackContent {
  label: string;
  story: string[];
  questions: QA[];
  watchOuts: string[];
}

const TRACKS: Record<Track, TrackContent> = {
  athlete: {
    label: 'Athletes',
    story: [
      'Lead with the work, not the highlights. Interviewers care less about the championship than what it took: the 5 a.m. film sessions, the recovery plan, the way you adjusted after a bad game.',
      'Pick two or three transferable strengths and back each with one specific moment: performing under pressure, taking hard coaching, working inside a large organization toward one goal.',
      'Explain your transition in one confident sentence: "I spent eight years competing at the highest level; now I want to bring that same preparation to [their field]." Then stop talking about leaving the sport.',
      'Show you’ve done the homework on their business. Knowing their product, customers and competitors shows you prepare for this the way you prepared for an opponent.',
    ],
    questions: [
      { q: 'You’ve only ever played sports. Why should we hire you?', a: 'Don’t apologize. Name the skills they need (discipline, coachability, performing on deadline), give one example of each, then connect it to a specific part of the role.' },
      { q: 'How do you handle failure?', a: 'Use a real loss or setback. Describe what you reviewed afterward, what you changed, and the result the next time. Show the process, not just the attitude.' },
      { q: 'Tell me about working with a difficult teammate.', a: 'Pick a real conflict, stay generous about the other person, and focus on what you did to keep the team performing. End with what you learned about communication.' },
      { q: 'How do you take feedback?', a: 'Athletes are coached every day. Give an example of blunt feedback, how you applied it, and the measurable improvement that followed.' },
      { q: 'What do you know about our industry?', a: 'Have three facts ready: something about their customers, a recent company news item, and a challenge in their market. Ask a smart follow-up.' },
      { q: 'Where do you see yourself in five years?', a: 'Show commitment to growing in this field. Mention a skill or certification you plan to build, and tie it to how you’d contribute more over time.' },
    ],
    watchOuts: [
      'Spending the whole interview on your playing career. Aim for no more than 25% sport stories.',
      'Underselling yourself with "I just played ball." Your daily routine involved real skills, so name them.',
      'Assuming name recognition will carry the interview. Prepare as if they have never heard of you.',
      'Vague answers. Swap "I’m a hard worker" for a concrete example with a number in it.',
    ],
  },
  coach: {
    label: 'Coaches',
    story: [
      'Translate coaching into business language: you recruited talent, developed people, built game plans from data, managed budgets and travel, and reported results to leadership.',
      'Quantify your program: roster size, staff you managed, budget, win/loss turnaround, graduation or placement rates, dollars raised.',
      'Frame your move as a choice: "I want to apply the way I build and develop teams to [their mission]." Avoid sounding like you are escaping burnout.',
      'Bring one example of a system you built, such as a practice plan, scouting process or development tracker, and explain how it improved outcomes.',
    ],
    questions: [
      { q: 'How does coaching prepare you for this role?', a: 'Map three coaching duties directly onto the job description (e.g. recruiting = talent acquisition, game planning = strategy, player development = people management) with one example each.' },
      { q: 'Tell me about a time you managed a budget or resources.', a: 'Give the budget size, the trade-offs you made, and the result: travel savings, equipment upgrades, fundraising totals.' },
      { q: 'How do you motivate people who are underperforming?', a: 'Walk through a real player or assistant: the conversation, the plan you set together, how you tracked progress, and the outcome.' },
      { q: 'Describe a time you used data to make a decision.', a: 'Scouting reports, stats or film analysis count. Explain what the data showed, the decision you made, and the result.' },
      { q: 'How do you handle pressure from leadership or parents?', a: 'Show calm stakeholder management: listening, setting expectations, communicating clearly, and keeping the focus on shared goals.' },
      { q: 'Why leave coaching now?', a: 'Keep it positive and forward-looking. Focus on what draws you to this role, not what you are leaving behind.' },
    ],
    watchOuts: [
      'Using coaching jargon ("we ran a 4-3 under") without translating it into what it shows about you.',
      'Saying "we won" without explaining your specific part in it.',
      'Sounding negative about athletic departments, administrators or parents.',
      'Forgetting the admin side of the job: scheduling, compliance, budgets and reporting are real business skills.',
    ],
  },
  veteran: {
    label: 'Veterans',
    story: [
      'Drop the acronyms. Replace ranks and jargon with civilian terms: "I supervised a 12-person maintenance team," not "I was the NCOIC of the motor pool."',
      'Say "I" when describing your actions. Military culture trains you to say "we," but interviewers need to know what you personally did.',
      'Quantify scope: people led, equipment value you were accountable for, budgets, mission success rates, safety records.',
      'Explain why this company and this role. Connect the mission-focused work you did to their mission and their customers.',
    ],
    questions: [
      { q: 'Tell me about yourself.', a: 'Give a two-minute arc: your military role in plain language, two achievements with numbers, what you’re looking for next, and why this company fits.' },
      { q: 'How will you adjust to a less structured environment?', a: 'Give an example of a time you adapted when the plan changed or orders were unclear, and how you created structure for your team.' },
      { q: 'Describe a time you led a team through a difficult situation.', a: 'Use STAR (see below). Keep classified or sensitive details out; focus on your decisions, how you communicated, and the outcome.' },
      { q: 'Tell me about a disagreement with a superior.', a: 'Show respectful candor: how you raised the concern through the right channels, then committed to the decision. Avoid any story that sounds like insubordination.' },
      { q: 'What are your salary expectations?', a: 'Research the civilian range for the role (not your military pay). Give a researched range and say you are flexible on the total package.' },
      { q: 'Why are you interested in this industry?', a: 'Link specific duties or training (logistics, communications, maintenance, intelligence) to the industry’s problems and show you have studied the company.' },
    ],
    watchOuts: [
      'Acronyms and ranks the interviewer won’t understand.',
      'Underselling leadership. Leading 20 people at age 24 is rare in civilian life, so say so with numbers.',
      'Sharing classified, sensitive or graphic combat details. Keep stories professional and outcome-focused.',
      'Being overly formal or stiff. A warm handshake, eye contact and a little personality help you build rapport.',
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

const TRACK_ORDER: Track[] = ['athlete', 'coach', 'veteran'];

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
  const { user } = useCurrentUser();
  const [track, setTrack] = useState<Track>('athlete');

  useEffect(() => {
    const t = user?.memberType;
    if (t === 'athlete' || t === 'coach' || t === 'veteran') setTrack(t);
  }, [user?.memberType]);

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
        <meta name="description" content="Interview preparation for former people with disabilities: how to tell your story, common questions, the STAR method, and a day-of checklist." />
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
            You already know how to prepare, perform under pressure and take coaching. This guide shows you how to turn that into a strong interview, whatever your background.
          </p>
        </section>

        {/* Tracks */}
        <section className="px-5 md:px-12 pb-16 mx-auto" style={{ maxWidth: '1100px' }} aria-labelledby="your-background">
          <H2 id="your-background">Tell your story</H2>
          <div role="tablist" aria-label="Your background" className="inline-flex flex-wrap gap-1 p-1 mb-8" style={{ border: line, borderRadius: '3px' }}>
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
              <Eyebrow>How to tell your story</Eyebrow>
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
