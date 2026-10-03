import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { verify_company_apply } from 'virtual:content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

type OrgType = 'company' | 'staffing_agency' | 'high_school' | 'college_university' | 'club_academy' | 'nonprofit' | 'military_affiliated';

interface FormState {
  legalName: string;
  website: string;
  linkedinPage: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  mainPhone: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactLinkedin: string;
  orgType: OrgType | '';
  // proof fields
  registrationNumber: string;
  registrationState: string;
  uei: string;
  staffingClientNames: string;
  ncesId: string;
  ein: string;
  governingBodyUrl: string;
  militaryDescription: string;
  skillbridgePartnerName: string;
  authorizationConfirmed: boolean;
  pledgeAccepted: boolean;
}

const INITIAL: FormState = {
  legalName: '', website: '', linkedinPage: '', addressLine1: '', city: '',
  state: '', postalCode: '', mainPhone: '', contactName: '', contactTitle: '',
  contactPhone: '', contactLinkedin: '', orgType: '',
  registrationNumber: '', registrationState: '', uei: '', staffingClientNames: '',
  ncesId: '', ein: '', governingBodyUrl: '', militaryDescription: '',
  skillbridgePartnerName: '', authorizationConfirmed: false, pledgeAccepted: false,
};

export default function VerifyStep2Page() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem('verifiedEmail');
    if (!email) { navigate('/verify-company'); return; }
    setVerifiedEmail(email);
  }, [navigate]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function buildProofData() {
    const p: Record<string, string> = {};
    if (form.registrationNumber) p['registrationNumber'] = form.registrationNumber;
    if (form.registrationState) p['registrationState'] = form.registrationState;
    if (form.uei) p['uei'] = form.uei;
    if (form.ncesId) p['ncesId'] = form.ncesId;
    if (form.ein) p['ein'] = form.ein;
    if (form.governingBodyUrl) p['governingBodyUrl'] = form.governingBodyUrl;
    if (form.militaryDescription) p['militaryDescription'] = form.militaryDescription;
    return p;
  }

  async function submit() {
    setError('');
    if (!form.orgType) { setError('Please select an organization type.'); return; }
    if (!form.authorizationConfirmed) { setError('Please confirm the authorization statement.'); return; }
    if (!form.pledgeAccepted) { setError('Please accept the accessible-hiring pledge.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/company-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactEmail: verifiedEmail,
          legalName: form.legalName,
          website: form.website,
          linkedinPage: form.linkedinPage,
          addressLine1: form.addressLine1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          mainPhone: form.mainPhone,
          contactName: form.contactName,
          contactTitle: form.contactTitle,
          contactPhone: form.contactPhone,
          contactLinkedin: form.contactLinkedin,
          orgType: form.orgType,
          proofData: buildProofData(),
          staffingClientNames: form.staffingClientNames || undefined,
          skillbridgePartnerName: form.skillbridgePartnerName || undefined,
          authorizationConfirmed: true,
          accessibleHiringPledge: true,
        }),
      });
      const data = await res.json() as { applicationId?: number; error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? 'Submission failed. Please try again.');
      } else {
        setSubmitted(true);
        sessionStorage.removeItem('verifiedEmail');
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Helmet><title>Application Submitted — NORVARDEN</title><meta name="robots" content="noindex" /></Helmet>
        <main>
          <section className="py-xxxl bg-background">
            <div className="container mx-auto px-4 max-w-content">
              <div className="max-w-md mx-auto text-center">
                <CheckCircle size={48} className="text-primary mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-foreground mb-3">Application submitted</h1>
                <p className="text-muted-foreground text-sm">
                  <span>{verify_company_apply.step2.underReviewMessage}</span>
                </p>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  const orgType = form.orgType;

  return (
    <>
      <Helmet>
        <title>Company Details — NORVARDEN</title>
        <meta name="description" content="Complete your company details and submit your verification application to NORVARDEN." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <main>
        <section className="py-xxl bg-background">
          <div className="container mx-auto px-4 max-w-content">
            <div className="max-w-2xl mx-auto">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-bold">1</span>
                <span className="text-sm text-muted-foreground">Work email</span>
                <span className="flex-1 h-px bg-border mx-2" />
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span className="text-sm font-medium text-foreground">Company details</span>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                <span>{verify_company_apply.step2.heading}</span>
              </h1>
              <p className="text-muted-foreground mb-8 text-sm">
                <span>{verify_company_apply.step2.subheading}</span>
              </p>

              <div className="flex flex-col gap-6">
                {/* Company info */}
                <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                  <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Company</legend>
                  <Field label="Legal company name" required><Input value={form.legalName} onChange={(e) => set('legalName', e.target.value)} placeholder="Acme Corp" /></Field>
                  <Field label="Website" required><Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://acme.com" /></Field>
                  <Field label="Company LinkedIn page"><Input value={form.linkedinPage} onChange={(e) => set('linkedinPage', e.target.value)} placeholder="https://linkedin.com/company/acme" /></Field>
                  <Field label="Business address"><Input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="123 Main St" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City"><Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Austin" /></Field>
                    <Field label="State"><Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="TX" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ZIP / Postal code"><Input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="78701" /></Field>
                    <Field label="Main phone"><Input value={form.mainPhone} onChange={(e) => set('mainPhone', e.target.value)} placeholder="+1 (512) 000-0000" /></Field>
                  </div>
                </fieldset>

                {/* Contact person */}
                <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                  <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Contact person</legend>
                  <p className="text-xs text-muted-foreground -mt-2">Applying as: <strong>{verifiedEmail}</strong></p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full name" required><Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Jane Smith" /></Field>
                    <Field label="Job title" required><Input value={form.contactTitle} onChange={(e) => set('contactTitle', e.target.value)} placeholder="Head of Recruiting" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Work phone"><Input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+1 (512) 000-0000" /></Field>
                    <Field label="Personal LinkedIn"><Input value={form.contactLinkedin} onChange={(e) => set('contactLinkedin', e.target.value)} placeholder="https://linkedin.com/in/jane" /></Field>
                  </div>
                </fieldset>

                {/* Organization type */}
                <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-3">
                  <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Organization type</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {verify_company_apply.step2.orgTypes.map((ot) => (
                      <label key={ot.id} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${form.orgType === ot.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                        <input
                          type="radio"
                          name="orgType"
                          value={ot.id}
                          checked={form.orgType === ot.id}
                          onChange={() => set('orgType', ot.id)}
                          className="accent-primary"
                        />
                        <span className="text-sm text-foreground"><span>{ot.label}</span></span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Proof fields — conditional by org type */}
                {(orgType === 'company' || orgType === 'staffing_agency') && (
                  <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                    <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Verification</legend>
                    <p className="text-xs text-muted-foreground">Provide your state business registration number <strong>or</strong> SAM.gov UEI (federal contractors). <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" className="underline">sam.gov</a></p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Registration number"><Input value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} placeholder="e.g. 1234567" /></Field>
                      <Field label="State"><Input value={form.registrationState} onChange={(e) => set('registrationState', e.target.value)} placeholder="e.g. TX" /></Field>
                    </div>
                    <Field label="SAM.gov UEI (optional)"><Input value={form.uei} onChange={(e) => set('uei', e.target.value)} placeholder="e.g. ABC123DEF456" /></Field>
                    {orgType === 'staffing_agency' && (
                      <Field label="Client companies you hire for (at least one)" required>
                        <Input value={form.staffingClientNames} onChange={(e) => set('staffingClientNames', e.target.value)} placeholder="e.g. Nike, Under Armour" />
                        <p className="text-xs text-muted-foreground mt-1">Your job posts will display "Posted by a staffing agency."</p>
                      </Field>
                    )}
                  </fieldset>
                )}

                {orgType === 'high_school' && (
                  <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                    <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Verification</legend>
                    <p className="text-xs text-muted-foreground">Provide your NCES school ID or a link to a school page listing you as a contact. <a href="https://nces.ed.gov/ccd/schoolsearch/" target="_blank" rel="noopener noreferrer" className="underline">NCES school search</a></p>
                    <Field label="NCES School ID"><Input value={form.ncesId} onChange={(e) => set('ncesId', e.target.value)} placeholder="e.g. 480001" /></Field>
                  </fieldset>
                )}

                {orgType === 'college_university' && (
                  <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                    <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Verification</legend>
                    <p className="text-xs text-muted-foreground">Your work email must be on a .edu domain. That's all we need.</p>
                  </fieldset>
                )}

                {orgType === 'club_academy' && (
                  <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                    <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Verification</legend>
                    <Field label="Link to governing body or league listing" required>
                      <Input value={form.governingBodyUrl} onChange={(e) => set('governingBodyUrl', e.target.value)} placeholder="https://usasoccer.com/clubs/..." />
                    </Field>
                  </fieldset>
                )}

                {orgType === 'nonprofit' && (
                  <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                    <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Verification</legend>
                    <p className="text-xs text-muted-foreground">We'll check your EIN on the <a href="https://apps.irs.gov/app/eos/" target="_blank" rel="noopener noreferrer" className="underline">IRS Tax Exempt Organization Search</a>. The 30% mission discount unlocks after this check passes.</p>
                    <Field label="EIN" required><Input value={form.ein} onChange={(e) => set('ein', e.target.value)} placeholder="e.g. 12-3456789" /></Field>
                  </fieldset>
                )}

                {orgType === 'military_affiliated' && (
                  <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4">
                    <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Verification</legend>
                    <p className="text-xs text-muted-foreground">Briefly describe your military connection. The 30% mission discount unlocks after admin approval.</p>
                    <Field label="Military connection description" required>
                      <textarea
                        value={form.militaryDescription}
                        onChange={(e) => set('militaryDescription', e.target.value)}
                        rows={3}
                        placeholder="e.g. We are a veteran-owned business that primarily hires transitioning service members..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </Field>
                  </fieldset>
                )}

                {/* SkillBridge optional */}
                {/* Accessible-hiring pledge */}
                <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-3">
                  <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Accessible-hiring pledge</legend>
                  <p className="text-sm text-foreground">Every employer on NORVARDEN commits to:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground flex flex-col gap-1.5">
                    <li>Provide reasonable accommodations during interviews and on the job.</li>
                    <li>Never ask candidates to disclose or prove a disability.</li>
                    <li>Keep any health or accommodation information confidential.</li>
                    <li>Make application steps and interviews accessible, with alternatives on request.</li>
                    <li>Evaluate candidates on their skills and ability to do the essential functions of the job.</li>
                  </ul>
                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={form.pledgeAccepted}
                      onChange={(e) => set('pledgeAccepted', e.target.checked)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="text-sm text-foreground">We accept the NORVARDEN accessible-hiring pledge.</span>
                  </label>
                </fieldset>

                {/* Authorization */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.authorizationConfirmed}
                    onChange={(e) => set('authorizationConfirmed', e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    <span>{verify_company_apply.step2.authCheckbox}</span>
                  </span>
                </label>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={submit} disabled={loading || !form.authorizationConfirmed || !form.pledgeAccepted || !form.orgType} size="lg">
                  {loading ? 'Submitting…' : <span>{verify_company_apply.step2.submitCta}</span>}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
