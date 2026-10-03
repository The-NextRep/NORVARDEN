/**
 * Shared types for member profiles — used by both the edit page and the public profile page.
 */

export type MemberType = 'athlete' | 'coach' | 'veteran' | 'employer';

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'skillbridge';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time:   'Full-time',
  part_time:   'Part-time',
  contract:    'Contract',
  internship:  'Internship',
  skillbridge: 'SkillBridge',
};

export const INDUSTRIES = [
  'Technology',
  'Software & IT',
  'Data & Analytics',
  'Cybersecurity',
  'Customer Support',
  'Healthcare',
  'Finance & Insurance',
  'Education',
  'Government & Public Service',
  'Non-Profit',
  'Marketing & Media',
  'Operations & Logistics',
  'Sales',
  'Creative & Design',
  'Retail & Hospitality',
  'Other',
] as const;

export const BRANCH_LABELS: Record<string, string> = {
  army:         'Army',
  navy:         'Navy',
  air_force:    'Air Force',
  marines:      'Marines',
  coast_guard:  'Coast Guard',
  space_force:  'Space Force',
};

export const COACHING_LEVEL_LABELS: Record<string, string> = {
  youth:        'Youth',
  high_school:  'High School',
  college:      'College',
  professional: 'Professional',
  club:         'Club',
};

export interface MemberProfile {
  userId: string;
  memberType: MemberType;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  city: string | null;
  state: string | null;
  photoUrl: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  openTo: JobType[] | null;
  industriesOfInterest: string[] | null;
  skills: string[] | null;
  experienceSummary: string | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
  linkedinUrl: string | null;
  bio: string | null;
  // Athlete
  sport: string | null;
  league: string | null;
  yearsActive: string | null;
  // Coach
  coachingLevel: string | null;
  coachingSport: string | null;
  yearsCoaching: string | null;
  // Veteran
  branch: string | null;
  mos: string | null;
  yearsServed: string | null;
  isSkillbridgeEligible: boolean | null;
  veteranShowBranch: boolean | null;
  veteranShowYears: boolean | null;
  // Access
  accessTier: 'self' | 'admin' | 'connected' | 'restricted';
  name?: string | null;
}
