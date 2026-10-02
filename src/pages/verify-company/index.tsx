import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { verify_company_apply } from 'virtual:content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Mail } from 'lucide-react';

type Stage = 'email' | 'code' | 'done';

export default function VerifyStep1Page() {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendCode() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { sent?: boolean; error?: string; code?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
      } else {
        setStage('code');
      }
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify/confirm-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json() as { verified?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Incorrect code.');
      } else {
        setStage('done');
        // Store verified email in sessionStorage for Step 2
        sessionStorage.setItem('verifiedEmail', email);
        setTimeout(() => navigate('/verify-company/details'), 1200);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Verify Your Company — NORVARDEN</title>
        <meta name="description" content="Verify your work email to start your company application on NORVARDEN." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <main>
        <section className="py-xxxl bg-background">
          <div className="container mx-auto px-4 max-w-content">
            <div className="max-w-md mx-auto">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <span className="text-sm font-medium text-foreground">Work email</span>
                <span className="flex-1 h-px bg-border mx-2" />
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</span>
                <span className="text-sm text-muted-foreground">Company details</span>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                <span>{verify_company_apply.step1.heading}</span>
              </h1>
              <p className="text-muted-foreground mb-8 text-sm">
                <span>{verify_company_apply.step1.subheading}</span>
              </p>

              {stage === 'done' ? (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <CheckCircle size={20} className="text-primary shrink-0" />
                  <p className="text-sm text-foreground">
                    <span>{verify_company_apply.step1.successMessage}</span>
                  </p>
                </div>
              ) : stage === 'email' ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="email" className="mb-1.5 block text-sm">
                      <span>{verify_company_apply.step1.emailLabel}</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourcompany.com"
                      onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button onClick={sendCode} disabled={loading || !email.includes('@')}>
                    <Mail size={15} className="mr-2" />
                    {loading ? 'Sending…' : <span>{verify_company_apply.step1.sendCodeCta}</span>}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Code sent to <strong>{email}</strong>
                  </p>
                  <div>
                    <Label htmlFor="code" className="mb-1.5 block text-sm">
                      <span>{verify_company_apply.step1.codeLabel}</span>
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      onKeyDown={(e) => e.key === 'Enter' && confirmCode()}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button onClick={confirmCode} disabled={loading || code.length !== 6}>
                    {loading ? 'Verifying…' : <span>{verify_company_apply.step1.confirmCta}</span>}
                  </Button>
                  <button
                    onClick={() => { setStage('email'); setCode(''); setError(''); }}
                    className="text-sm text-muted-foreground hover:text-foreground underline self-start"
                  >
                    <span>{verify_company_apply.step1.resendCta}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
