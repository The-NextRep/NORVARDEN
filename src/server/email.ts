/**
 * Send transactional email through Resend (https://resend.com).
 *
 * Env:
 *   RESEND_API_KEY  – required to send
 *   EMAIL_FROM      – e.g.  NORVARDEN <notifications@norvarden.com>
 *                     (the domain must be verified in Resend)
 *   EMAIL_REPLY_TO  – optional default Reply-To (e.g. info@norvarden.com)
 *
 * Without RESEND_API_KEY (local development) messages are printed to the
 * server log instead of sent, so sign-in codes and links stay testable.
 */

const RESEND_URL = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 30_000;

export type EmailAttachment = {
  filename: string;
  content: Buffer | Uint8Array;
  contentType?: string;
};

export type SendEmailInput = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  /** Full From header, e.g. "Name <addr@domain>". Defaults to EMAIL_FROM. */
  from?: string;
  /** Display name; combined with the EMAIL_FROM address. */
  fromName?: string;
  /** Accepted for compatibility with older callers; ignored. */
  sameDomainFallback?: boolean;
  attachments?: EmailAttachment[];
};

export type SendEmailResult = { messageId: string };

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveFrom(input: SendEmailInput): string {
  if (input.from) return input.from;
  const configured = process.env.EMAIL_FROM || 'NORVARDEN <notifications@norvarden.com>';
  if (!input.fromName) return configured;
  const addr = configured.match(/<([^>]+)>/)?.[1] ?? configured;
  const safeName = input.fromName.replace(/["<>\r\n]/g, '');
  return `${safeName} <${addr}>`;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = toArray(input.to);
  if (to.length === 0) throw new Error('email send failed: no recipient');
  if (!input.text && !input.html) throw new Error('email send failed: empty body');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('email send failed: RESEND_API_KEY is not set');
    }
    console.log(
      `[email:dev] To: ${to.join(', ')}\n[email:dev] Subject: ${input.subject}\n[email:dev] ${input.text ?? input.html}`,
    );
    return { messageId: `dev-${Date.now()}` };
  }

  const payload: Record<string, unknown> = {
    from: resolveFrom(input),
    to,
    subject: input.subject,
  };
  const cc = toArray(input.cc);
  if (cc.length) payload.cc = cc;
  const bcc = toArray(input.bcc);
  if (bcc.length) payload.bcc = bcc;
  if (input.text) payload.text = input.text;
  if (input.html) payload.html = input.html;
  const replyTo = input.replyTo || process.env.EMAIL_REPLY_TO;
  if (replyTo) payload.reply_to = replyTo;
  if (input.attachments?.length) {
    payload.attachments = input.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content).toString('base64'),
      ...(a.contentType ? { content_type: a.contentType } : {}),
    }));
  }

  let response: Response;
  let body: { id?: string; message?: string; name?: string };
  try {
    response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    body = (await response.json().catch(() => ({}))) as typeof body;
  } catch (err) {
    throw new Error(`email service unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok || !body.id) {
    throw new Error(`email send failed: ${body.message ?? body.name ?? `HTTP ${response.status}`}`);
  }
  return { messageId: body.id };
}
