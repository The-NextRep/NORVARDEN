/** Shared résumé-builder data shape (client + server). */
export interface ResumeExperience {
  id: string;
  title: string;
  organization: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}
export interface ResumeEducation { id: string; school: string; credential: string; field: string; year: string }
export interface ResumeCertification { id: string; name: string; issuer: string; year: string }

export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  skills: string[];
  template: 'classic' | 'modern';
}

export const RESUME_LIMITS = {
  text: 300,
  summary: 2000,
  bullet: 400,
  experience: 15,
  bullets: 8,
  education: 10,
  certifications: 15,
  skills: 40,
  skill: 60,
} as const;

export function emptyResume(): ResumeData {
  return {
    fullName: '', headline: '', email: '', phone: '', location: '', linkedinUrl: '', summary: '',
    experience: [], education: [], certifications: [], skills: [], template: 'classic',
  };
}
