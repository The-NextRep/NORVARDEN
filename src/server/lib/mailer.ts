/**
 * Branded transactional emails for NORVARDEN.
 * All sends go through sendEmail (Resend). Functions THROW on failure so
 * callers can tell the user; non-critical callers should catch.
 *
 * From:     EMAIL_FROM  (default "NORVARDEN" <notifications@norvarden.com>)
 * Reply-To: EMAIL_REPLY_TO (default info@norvarden.com)
 */
import { sendEmail } from '@/server/email';
import { appBaseUrl, escapeHtml } from '@/server/lib/security';

const FROM_NAME = 'NORVARDEN';
const replyTo = () => process.env.EMAIL_REPLY_TO || 'info@norvarden.com';
const base = () => appBaseUrl();

/** First name for greetings, or "there" when the account has no name yet. */
const greet = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || 'there';

function button(href: string, label: string): string {
  return `<p style="margin:0 0 28px;text-align:center;">
      <a href="${escapeHtml(href)}"
         style="display:inline-block;background:#132032;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:3px;">
        ${escapeHtml(label)}
      </a>
    </p>`;
}

function codeBlock(code: string): string {
  return `<p style="margin:0 0 20px;text-align:center;">
      <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:0.3em;color:#071226;background:#f4f4f4;padding:12px 24px;border-radius:4px;display:inline-block;">${escapeHtml(code)}</span>
    </p>`;
}

/** Shared branded HTML wrapper — navy header, gold wordmark, white body, footer. */
function brandedEmail(bodyHtml: string, settingsLink = true): string {
  const footerLink = settingsLink
    ? `<p style="margin:0 0 6px;font-size:12px;color:#888888;">
                <a href="${escapeHtml(base())}/settings" style="color:#888888;text-decoration:underline;">Manage email settings</a>
              </p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NORVARDEN</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="background:#132032;padding:28px 40px;text-align:center;border-bottom:2px solid #c6ac86;">
              <p style="margin:0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:24px;font-weight:600;letter-spacing:0.32em;color:#f5f3ee;">NORVARDEN</p>
              <p style="margin:10px 0 0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:11px;font-weight:500;letter-spacing:0.34em;color:#c6ac86;">ANOTHER WAY FORWARD</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;color:#1a1a1a;font-size:16px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:20px 40px;text-align:center;">
              ${footerLink}
              <p style="margin:0;font-size:11px;color:#aaaaaa;">&copy; NORVARDEN &mdash; www.norvarden.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
  await sendEmail({ fromName: FROM_NAME, replyTo: replyTo(), to, subject, text, html });
}

export async function sendNewMessageEmail(
  to: string,
  recipientName: string,
  companyName: string,
  conversationId?: number,
): Promise<void> {
  const viewUrl = conversationId
    ? `${base()}/messages?conv=${conversationId}`
    : `${base()}/messages`;
  const safeCompany = escapeHtml(companyName);
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#071226;">
      You have a new message from ${safeCompany}
    </p>
    <p style="margin:0 0 28px;color:#444444;">Sign in to NORVARDEN to read and reply.</p>
    ${button(viewUrl, 'View message')}
  `;
  await send(
    to,
    `New message from ${companyName.replace(/[\r\n]/g, ' ')} — NORVARDEN`,
    `You have a new message from ${companyName} on NORVARDEN.\n\nView it here: ${viewUrl}\n\nTo stop these emails, visit: ${base()}/settings`,
    brandedEmail(bodyHtml),
  );
}

export async function sendTwoFactorCode(to: string, name: string, code: string): Promise<void> {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(name))},</p>
    <p style="margin:0 0 20px;">Your one-time sign-in code for NORVARDEN is:</p>
    ${codeBlock(code)}
    <p style="margin:0 0 8px;color:#666666;font-size:14px;">This code expires in 10 minutes.</p>
    <p style="margin:0;color:#666666;font-size:14px;">If you didn't try to sign in, change your password right away.</p>
  `;
  await send(
    to,
    `${code} is your sign-in code — NORVARDEN`,
    `Hi ${greet(name)},\n\nYour one-time sign-in code for NORVARDEN is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't try to sign in, change your password right away.`,
    brandedEmail(bodyHtml, false),
  );
}

export async function sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(name))},</p>
    <p style="margin:0 0 20px;">We received a request to reset your password on NORVARDEN.</p>
    ${button(resetUrl, 'Reset password')}
    <p style="margin:0;color:#666666;font-size:14px;">This link expires in 1 hour. If you didn't request this, no action is needed.</p>
  `;
  await send(
    to,
    'Reset your password — NORVARDEN',
    `Hi ${greet(name)},\n\nWe received a request to reset your password on NORVARDEN.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, no action is needed.`,
    brandedEmail(bodyHtml, false),
  );
}

export async function sendVerificationCode(to: string, code: string): Promise<void> {
  const bodyHtml = `
    <p style="margin:0 0 20px;">Your company email verification code for NORVARDEN is:</p>
    ${codeBlock(code)}
    <p style="margin:0;color:#666666;font-size:14px;">This code expires in 15 minutes.</p>
  `;
  await send(
    to,
    `${code} is your verification code — NORVARDEN`,
    `Your company email verification code for NORVARDEN is: ${code}\n\nThis code expires in 15 minutes.`,
    brandedEmail(bodyHtml, false),
  );
}

export async function sendCompanyApproved(to: string, contactName: string, companyName: string): Promise<void> {
  const url = `${base()}/pricing`;
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(contactName))},</p>
    <p style="margin:0 0 20px;"><strong>${escapeHtml(companyName)}</strong> is now verified on NORVARDEN.</p>
    <p style="margin:0 0 28px;color:#444444;">Choose a plan to start posting jobs and connecting with people with disabilities.</p>
    ${button(url, 'Choose your plan')}
  `;
  await send(
    to,
    `${companyName.replace(/[\r\n]/g, ' ')} is verified — NORVARDEN`,
    `Hi ${greet(contactName)},\n\n${companyName} is now verified on NORVARDEN.\n\nChoose a plan to start posting jobs: ${url}`,
    brandedEmail(bodyHtml, false),
  );
}

export async function sendCompanyRejected(to: string, contactName: string, companyName: string, reason: string): Promise<void> {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(contactName))},</p>
    <p style="margin:0 0 20px;">We weren't able to verify <strong>${escapeHtml(companyName)}</strong> for NORVARDEN.</p>
    <p style="margin:0 0 20px;color:#444444;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    <p style="margin:0;color:#666666;font-size:14px;">Questions? Reply to this email.</p>
  `;
  await send(
    to,
    'Your company verification — NORVARDEN',
    `Hi ${greet(contactName)},\n\nWe weren't able to verify ${companyName} for NORVARDEN.\n\nReason: ${reason}\n\nQuestions? Reply to this email.`,
    brandedEmail(bodyHtml, false),
  );
}

export async function sendCompanyNeedsInfo(to: string, contactName: string, companyName: string, message: string): Promise<void> {
  // Step 1 re-confirms the email (the details step needs a fresh code); the
  // resubmitted details then update this application instead of a new one.
  const url = `${base()}/verify-company`;
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(contactName))},</p>
    <p style="margin:0 0 20px;">We need a little more information to verify <strong>${escapeHtml(companyName)}</strong>:</p>
    <p style="margin:0 0 28px;color:#444444;white-space:pre-line;">${escapeHtml(message)}</p>
    ${button(url, 'Update your application')}
  `;
  await send(
    to,
    'More information needed — NORVARDEN',
    `Hi ${greet(contactName)},\n\nWe need a little more information to verify ${companyName}:\n\n${message}\n\nUpdate your application: ${url}`,
    brandedEmail(bodyHtml, false),
  );
}

// ─── Events ──────────────────────────────────────────────────────────────────

const adminInbox = () => process.env.ADMIN_NOTIFY_EMAIL || 'info@norvarden.com';
const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Tell the admin inbox a company event is waiting for review. */
export async function sendEventSubmittedToAdmin(eventTitle: string, companyName: string, tier: string, amountCents: number | null): Promise<void> {
  const url = `${base()}/admin/events`;
  const paid = amountCents ? `Paid ${money(amountCents)}` : 'Included with their plan';
  const bodyHtml = `
    <p style="margin:0 0 16px;"><strong>${escapeHtml(companyName)}</strong> submitted an event for review.</p>
    <p style="margin:0 0 6px;"><strong>${escapeHtml(eventTitle)}</strong></p>
    <p style="margin:0 0 28px;color:#666666;">${escapeHtml(tier === 'featured' ? 'Featured listing' : 'Standard listing')} · ${escapeHtml(paid)}</p>
    ${button(url, 'Review event')}
  `;
  await send(
    adminInbox(),
    `Event to review: ${eventTitle}`,
    `${companyName} submitted an event for review.\n\n${eventTitle}\n${tier === 'featured' ? 'Featured' : 'Standard'} listing · ${paid}\n\nReview it: ${url}`,
    brandedEmail(bodyHtml, false),
  );
}

/** Approved / not approved notice to the company that submitted the event. */
export async function sendEventDecision(
  to: string,
  name: string,
  eventTitle: string,
  approved: boolean,
  opts: { reason?: string | null; refundedCents?: number | null } = {},
): Promise<void> {
  const url = approved ? `${base()}/events` : `${base()}/company/events`;
  const refund = opts.refundedCents ? `A full refund of ${money(opts.refundedCents)} is on its way to your card (5–10 business days).` : '';
  const bodyHtml = approved
    ? `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(name))},</p>
    <p style="margin:0 0 28px;">Your event <strong>${escapeHtml(eventTitle)}</strong> is approved and now live on NORVARDEN.</p>
    ${button(url, 'View events')}`
    : `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(name))},</p>
    <p style="margin:0 0 16px;">We weren't able to approve <strong>${escapeHtml(eventTitle)}</strong>.</p>
    ${opts.reason ? `<p style="margin:0 0 16px;color:#444444;"><strong>Reason:</strong> ${escapeHtml(opts.reason)}</p>` : ''}
    ${refund ? `<p style="margin:0 0 16px;">${escapeHtml(refund)}</p>` : ''}
    <p style="margin:0;color:#666666;font-size:14px;">Questions? Reply to this email.</p>`;
  const text = approved
    ? `Hi ${greet(name)},\n\nYour event "${eventTitle}" is approved and now live on NORVARDEN.\n\n${url}`
    : `Hi ${greet(name)},\n\nWe weren't able to approve "${eventTitle}".${opts.reason ? `\n\nReason: ${opts.reason}` : ''}${refund ? `\n\n${refund}` : ''}\n\nQuestions? Reply to this email.`;
  await send(to, approved ? `Your event is live — ${eventTitle}` : `About your event — ${eventTitle}`, text, brandedEmail(bodyHtml, false));
}

/** Featured-event announcement to a member. */
export async function sendFeaturedEventEmail(
  to: string,
  name: string,
  ev: { title: string; when: string; where: string; hostName: string | null; description: string | null; registrationUrl: string | null },
): Promise<void> {
  const url = ev.registrationUrl || `${base()}/events`;
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greet(name))},</p>
    <p style="margin:0 0 8px;color:#666666;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">Featured event${ev.hostName ? ` · Hosted by ${escapeHtml(ev.hostName)}` : ''}</p>
    <p style="margin:0 0 12px;font-size:20px;font-weight:600;color:#071226;">${escapeHtml(ev.title)}</p>
    <p style="margin:0 0 4px;">${escapeHtml(ev.when)}</p>
    <p style="margin:0 0 20px;color:#444444;">${escapeHtml(ev.where)}</p>
    ${ev.description ? `<p style="margin:0 0 28px;color:#444444;white-space:pre-line;">${escapeHtml(ev.description)}</p>` : ''}
    ${button(url, ev.registrationUrl ? 'Register' : 'See details')}
    <p style="margin:0;color:#888888;font-size:12px;">You're getting this because you're a NORVARDEN member. Turn off event emails in Settings.</p>
  `;
  await send(
    to,
    `Featured event: ${ev.title}`,
    `Hi ${greet(name)},\n\nFeatured event${ev.hostName ? ` hosted by ${ev.hostName}` : ''}:\n\n${ev.title}\n${ev.when}\n${ev.where}\n\n${ev.description ?? ''}\n\n${url}\n\nTurn off event emails in Settings: ${base()}/settings`,
    brandedEmail(bodyHtml, true),
  );
}
