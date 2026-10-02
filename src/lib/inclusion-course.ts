/**
 * "Hiring & Working With Disabled Talent" — a short course for employer
 * teams. Pass the quiz (8 of 10) and the company earns the Inclusion
 * Certified badge for 12 months. The answer key lives on the server only
 * (src/server/lib/inclusion-course-key.ts).
 */

export interface CourseModule {
  title: string;
  minutes: number;
  points: string[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
}

export const PASS_SCORE = 8;
export const CERT_VALID_DAYS = 365;

export const COURSE_MODULES: CourseModule[] = [
  {
    title: 'Disability at work: the basics',
    minutes: 3,
    points: [
      'About 1 in 4 U.S. adults has a disability. Many disabilities, such as chronic illness, hearing loss, ADHD or PTSD, are not visible.',
      'Disability is a normal part of life. Barriers usually come from the environment (stairs, untimed tests, inaccessible software), not the person.',
      'Some people prefer person-first language ("a person with a disability"), others identity-first ("a disabled person" or "a Deaf person"). When in doubt, ask and follow their lead.',
      'Disabled employees bring problem-solving, adaptability and perspective. Treat them as the professionals they are.',
    ],
  },
  {
    title: 'Respectful etiquette',
    minutes: 2,
    points: [
      'Speak directly to the person, not to their interpreter, aide or companion.',
      'Offer help, then wait for an answer. Never take over or assume.',
      'A wheelchair, cane or service animal is part of the person\'s personal space. Do not touch, pet or distract it.',
      'Avoid phrases like "wheelchair-bound", "suffers from" or "special needs". Say "uses a wheelchair" or "has epilepsy".',
      'Never share someone\'s disability with others without their permission.',
    ],
  },
  {
    title: 'Accessible hiring',
    minutes: 3,
    points: [
      'Make your application work with screen readers and keyboards, and avoid timed tests without an alternative.',
      'List the essential functions of the job, not habits ("lift 25 lb" is a requirement; "must drive" may not be).',
      'Every interview invitation should say how to request an accommodation, and offer formats (video, phone, in person, written).',
      'Before a job offer, do not ask whether someone has a disability. You may ask whether they can perform the essential functions, with or without accommodation.',
      'Judge the outcome, not the method: how someone gets the work done matters less than that it gets done.',
    ],
  },
  {
    title: 'Accommodations',
    minutes: 3,
    points: [
      'Under the ADA (employers with 15+ employees), you must provide reasonable accommodations unless they cause undue hardship.',
      'Start with a conversation, the "interactive process": ask what would help, explore options together, and follow up.',
      'Most accommodations are cheap. The Job Accommodation Network finds about half cost nothing; most others are a one-time cost under $500.',
      'Common examples: flexible schedules, remote work, screen readers, captioning, ergonomic equipment, written instructions, a quieter workspace.',
      'Keep medical information confidential and stored separately from the personnel file. Share only what a manager needs to know.',
    ],
  },
  {
    title: 'Inclusive culture',
    minutes: 2,
    points: [
      'Make meetings accessible: turn on captions, share agendas and slides ahead of time, and describe visuals out loud.',
      'Use accessible documents: real headings, alt text on images, good color contrast.',
      'Support an employee resource group and invite feedback; then act on it.',
      'Promote and develop disabled employees the same way as everyone else.',
      'This course is general guidance, not legal advice. For specific situations, use askjan.org or your employment counsel.',
    ],
  },
];

export const QUIZ: QuizQuestion[] = [
  {
    q: 'Before making a job offer, what may you ask a candidate?',
    options: [
      'Whether they have any disabilities',
      'Whether they can perform the essential functions of the job, with or without accommodation',
      'What medications they take',
    ],
  },
  {
    q: 'A candidate arrives with a sign-language interpreter. Who do you look at and speak to?',
    options: ['The candidate', 'The interpreter', 'Whoever answers first'],
  },
  {
    q: 'About what share of workplace accommodations cost nothing, according to the Job Accommodation Network?',
    options: ['About half', 'Almost none', 'All of them'],
  },
  {
    q: 'Which phrase is most respectful?',
    options: ['Wheelchair-bound', 'Suffers from paralysis', 'Uses a wheelchair'],
  },
  {
    q: 'An employee asks for an accommodation. What is the best first step?',
    options: [
      'Ask for their full medical history',
      'Tell them to wait until their annual review',
      'Talk with them about what would help and explore options together',
    ],
  },
  {
    q: 'Where should medical information about an accommodation be kept?',
    options: [
      'Confidential and separate from the personnel file, shared only on a need-to-know basis',
      'In the team\'s shared drive so everyone understands',
      'In the employee\'s regular personnel file',
    ],
  },
  {
    q: 'A candidate brings a service dog to the interview. You should:',
    options: ['Ask them to leave it outside', 'Pet it to make them comfortable', 'Not touch or distract the dog'],
  },
  {
    q: 'What should every interview invitation include?',
    options: [
      'How to request an accommodation and the interview format options',
      'A request to disclose any disability',
      'Nothing extra; accommodations come up later',
    ],
  },
  {
    q: 'A team member privately tells you about their disability. You should:',
    options: [
      'Let the team know so they can help',
      'Keep it confidential unless they choose to share it',
      'Tell HR to move them to a different role',
    ],
  },
  {
    q: 'Which makes a team meeting more accessible?',
    options: [
      'Turning on captions and sharing the agenda and slides in advance',
      'Speaking faster to keep it short',
      'Sharing slides only as images',
    ],
  },
];

/** True when a certification date is within the last 12 months. */
export function isInclusionCertified(certifiedAt: string | Date | null | undefined): boolean {
  if (!certifiedAt) return false;
  const t = new Date(certifiedAt).getTime();
  return Number.isFinite(t) && Date.now() - t < CERT_VALID_DAYS * 86_400_000;
}
