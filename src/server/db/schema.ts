import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  json,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import type { ResumeData } from '@/lib/resume-types';

export type { ResumeData };

// ─── Free email domain blocklist ────────────────────────────────────────────
export const blockedEmailDomains = mysqlTable('blocked_email_domains', {
  id: int('id').primaryKey().autoincrement(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  reason: varchar('reason', { length: 255 }).default('free_provider'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Email verification codes (Step 1) ──────────────────────────────────────
export const emailVerifications = mysqlTable('email_verifications', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  verified: boolean('verified').default(false),
  attempts: int('attempts').default(0),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Company applications (Steps 2–3) ───────────────────────────────────────
export const companyApplications = mysqlTable('company_applications', {
  id: int('id').primaryKey().autoincrement(),

  // Step 1 — verified email
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false),

  // Step 2 — company details
  legalName: varchar('legal_name', { length: 255 }),
  website: varchar('website', { length: 512 }),
  linkedinPage: varchar('linkedin_page', { length: 512 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('US'),
  mainPhone: varchar('main_phone', { length: 50 }),

  // Contact person
  contactName: varchar('contact_name', { length: 255 }),
  contactTitle: varchar('contact_title', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactLinkedin: varchar('contact_linkedin', { length: 512 }),

  // Organization type
  orgType: mysqlEnum('org_type', [
    'company',
    'staffing_agency',
    'high_school',
    'college_university',
    'club_academy',
    'nonprofit',
    'military_affiliated',
  ]),

  // Step 3 — proof fields (stored as JSON for flexibility per org type)
  proofData: json('proof_data'),

  // Staffing agency extra
  staffingClientNames: text('staffing_client_names'),

  // SkillBridge optional
  skillbridgePartnerName: varchar('skillbridge_partner_name', { length: 255 }),
  skillbridgeConfirmed: boolean('skillbridge_confirmed').default(false),

  // Authorization checkbox
  authorizationConfirmed: boolean('authorization_confirmed').default(false),

  // Domain check
  emailDomain: varchar('email_domain', { length: 255 }),
  websiteDomain: varchar('website_domain', { length: 255 }),
  domainMatch: boolean('domain_match'),
  domainMismatchFlag: boolean('domain_mismatch_flag').default(false),

  // Review status
  status: mysqlEnum('status', [
    'draft',
    'pending_email',
    'pending_review',
    'needs_info',
    'approved',
    'rejected',
  ]).default('draft'),

  rejectionReason: text('rejection_reason'),
  needsInfoMessage: text('needs_info_message'),

  // Mission discount eligibility (nonprofit / military)
  missionDiscountUnlocked: boolean('mission_discount_unlocked').default(false),

  // Timestamps
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Admin notes (visible to admins only) ───────────────────────────────────
export const adminNotes = mysqlTable('admin_notes', {
  id: int('id').primaryKey().autoincrement(),
  applicationId: int('application_id').notNull().references(() => companyApplications.id),
  adminEmail: varchar('admin_email', { length: 255 }).notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Verified companies (post-approval) ─────────────────────────────────────
export const verifiedCompanies = mysqlTable('verified_companies', {
  id: int('id').primaryKey().autoincrement(),
  applicationId: int('application_id').notNull().references(() => companyApplications.id),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  website: varchar('website', { length: 512 }).notNull(),
  emailDomain: varchar('email_domain', { length: 255 }).notNull(),
  orgType: mysqlEnum('org_type', [
    'company',
    'staffing_agency',
    'high_school',
    'college_university',
    'club_academy',
    'nonprofit',
    'military_affiliated',
  ]).notNull(),
  isStaffingAgency: boolean('is_staffing_agency').default(false),
  missionDiscountUnlocked: boolean('mission_discount_unlocked').default(false),
  skillbridgePartner: boolean('skillbridge_partner').default(false),
  // Renewal check state
  lastRenewalCheck: timestamp('last_renewal_check'),
  renewalCheckPassed: boolean('renewal_check_passed').default(true),
  renewalCheckPaused: boolean('renewal_check_paused').default(false),
  // Scam / report state
  reportCount: int('report_count').default(0),
  postsPaused: boolean('posts_paused').default(false),
  postsPausedReason: varchar('posts_paused_reason', { length: 255 }),
  // Block state
  blocked: boolean('blocked').default(false),
  blockedAt: timestamp('blocked_at'),
  // Access granted by an admin outside Stripe (e.g. Founding partners on invoice)
  manualAccessUntil: timestamp('manual_access_until'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Company subscriptions (written by the Stripe webhook) ──────────────────
export const companySubscriptions = mysqlTable('company_subscriptions', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull().references(() => verifiedCompanies.id, { onDelete: 'cascade' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
  priceId: varchar('price_id', { length: 255 }),
  plan: mysqlEnum('plan', ['scout', 'partner', 'founding', 'unknown']).default('unknown'),
  billingCycle: mysqlEnum('billing_cycle', ['quarterly', 'annual']),
  status: varchar('status', { length: 32 }).notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  couponCode: varchar('coupon_code', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Admin activity log ─────────────────────────────────────────────────────
export const adminActivityLog = mysqlTable('admin_activity_log', {
  id: int('id').primaryKey().autoincrement(),
  adminUserId: varchar('admin_user_id', { length: 36 }),
  adminEmail: varchar('admin_email', { length: 255 }),
  action: varchar('action', { length: 64 }).notNull(),
  targetType: varchar('target_type', { length: 32 }),
  targetId: varchar('target_id', { length: 64 }),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Company reports (member-submitted) ─────────────────────────────────────
export const companyReports = mysqlTable('company_reports', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull().references(() => verifiedCompanies.id),
  reporterMemberId: int('reporter_member_id').notNull(),
  reason: mysqlEnum('reason', [
    'fee_for_training',
    'fee_for_equipment',
    'fee_for_background_check',
    'gift_card_request',
    'wire_transfer',
    'crypto',
    'check_deposit',
    'off_platform_chat',
    'other',
  ]).notNull(),
  details: text('details'),
  jobPostId: int('job_post_id'),
  messageId: int('message_id'),
  status: mysqlEnum('status', ['pending', 'reviewed', 'dismissed']).default('pending'),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Scam flag rules ─────────────────────────────────────────────────────────
export const scamFlagRules = mysqlTable('scam_flag_rules', {
  id: int('id').primaryKey().autoincrement(),
  keyword: varchar('keyword', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 100 }).notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Job posts ───────────────────────────────────────────────────────────────
export const jobPosts = mysqlTable('job_posts', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull().references(() => verifiedCompanies.id),

  // Core fields
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }),
  jobType: mysqlEnum('job_type', [
    'full_time',
    'part_time',
    'contract',
    'internship',
    'skillbridge',
  ]).notNull(),
  industry: varchar('industry', { length: 100 }),
  isRemote: boolean('is_remote').default(false),

  // Pay range (optional)
  payRangeMin: int('pay_range_min'),
  payRangeMax: int('pay_range_max'),
  payCurrency: varchar('pay_currency', { length: 10 }).default('USD'),

  // Required skills (JSON array of strings)
  requiredSkills: json('required_skills').$type<string[]>(),

  // Application deadline (optional)
  applicationDeadline: timestamp('application_deadline'),

  // Veteran-ready flag
  isVeteranReady: boolean('is_veteran_ready').default(false),

  // Moderation
  status: mysqlEnum('status', ['active', 'paused', 'closed', 'removed']).default('active'),

  // Timestamps
  postedAt: timestamp('posted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── BetterAuth tables ──────────────────────────────────────────────────────
export const user = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  isAdmin: boolean('is_admin').default(false),
  // Lockout tracking
  loginAttempts: int('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  // Two-factor auth (email OTP for companies + admins)
  twoFactorCode: varchar('two_factor_code', { length: 8 }),
  twoFactorExpiry: timestamp('two_factor_expiry'),
  otpResendCount: int('otp_resend_count').default(0),
  otpResendWindowStart: timestamp('otp_resend_window_start'),
  // Holds the BetterAuth Set-Cookie string after password validation for 2FA users.
  // Cleared and forwarded to the browser only after the OTP is verified.
  pendingSessionCookie: text('pending_session_cookie'),
  // Random challenge id handed to the browser during 2FA (SHA-256 hash stored)
  twoFactorChallenge: varchar('two_factor_challenge', { length: 64 }),
  twoFactorAttempts: int('two_factor_attempts').default(0),
  // Admin suspension
  suspended: boolean('suspended').default(false),
  suspendedAt: timestamp('suspended_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Password reset tokens ────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const session = mysqlTable('session', {
  id: varchar('id', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const account = mysqlTable('account', {
  id: varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const verification = mysqlTable('verification', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Member profiles ──────────────────────────────────────────────────────────
export const memberProfiles = mysqlTable('member_profiles', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Member type
  memberType: mysqlEnum('member_type', ['athlete', 'coach', 'veteran', 'employer']).notNull(),

  // Shared fields
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  linkedinUrl: varchar('linkedin_url', { length: 512 }),
  // Shared with a company only after the member accepts its connection request
  phone: varchar('phone', { length: 50 }),
  bio: text('bio'),

  // Athlete-specific
  sport: varchar('sport', { length: 100 }),
  league: varchar('league', { length: 100 }),
  yearsActive: varchar('years_active', { length: 50 }),

  // Coach-specific
  coachingLevel: mysqlEnum('coaching_level', ['youth', 'high_school', 'college', 'professional', 'club']),
  coachingSport: varchar('coaching_sport', { length: 100 }),
  yearsCoaching: varchar('years_coaching', { length: 50 }),

  // Veteran-specific
  branch: mysqlEnum('branch', ['army', 'navy', 'air_force', 'marines', 'coast_guard', 'space_force']),
  mos: varchar('mos', { length: 50 }),
  yearsServed: varchar('years_served', { length: 50 }),
  isSkillbridgeEligible: boolean('is_skillbridge_eligible').default(false),

  // Employer-specific
  companyName: varchar('company_name', { length: 255 }),
  companyRole: varchar('company_role', { length: 255 }),

  // ── Extended profile fields ─────────────────────────────────────────────
  headline: varchar('headline', { length: 255 }),
  photoUrl: varchar('photo_url', { length: 512 }),

  // Job preferences
  openTo: json('open_to').$type<string[]>(),
  industriesOfInterest: json('industries_of_interest').$type<string[]>(),
  skills: json('skills').$type<string[]>(),
  experienceSummary: text('experience_summary'),

  // Resume (uploaded file URL)
  resumeUrl: varchar('resume_url', { length: 512 }),
  resumeFileName: varchar('resume_file_name', { length: 255 }),

  // Veteran privacy controls (default: badge only, no details shown)
  veteranShowBranch: boolean('veteran_show_branch').default(false),
  veteranShowYears: boolean('veteran_show_years').default(false),

  // Verification
  verificationStatus: mysqlEnum('verification_status', ['pending', 'verified', 'rejected']).default('pending'),
  verificationNote: text('verification_note'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Member connections ───────────────────────────────────────────────────────
// A company (employer member) requests to connect with an athlete/coach/veteran.
// Until accepted, the company sees only name + badge + headline (locked view).
export const memberConnections = mysqlTable('member_connections', {
  id: int('id').primaryKey().autoincrement(),
  // The company/employer user who sent the request
  requesterId: varchar('requester_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // The verified company record linked to the requester
  verifiedCompanyId: int('verified_company_id')
    .references(() => verifiedCompanies.id, { onDelete: 'cascade' }),
  // The athlete/coach/veteran who received it
  recipientId: varchar('recipient_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Optional note from the company (max 300 chars)
  note: varchar('note', { length: 300 }),
  status: mysqlEnum('status', ['pending', 'accepted', 'declined']).default('pending'),
  requestedAt: timestamp('requested_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  // Tracks when a decline happened for the 30-day cooldown
  declinedAt: timestamp('declined_at'),
});

// ─── Message notification preferences ───────────────────────────────────────
// Members can opt out of new-message email notifications.
export const messageNotificationPrefs = mysqlTable('message_notification_prefs', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  emailEnabled: boolean('email_enabled').default(true),
  // Featured event announcements (separate opt-out from message emails)
  eventEmailsEnabled: boolean('event_emails_enabled').default(true),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Conversations ────────────────────────────────────────────────────────────
// One conversation per accepted connection (companyUserId ↔ memberUserId).
// Created lazily on first message send.
export const conversations = mysqlTable('conversations', {
  id: int('id').primaryKey().autoincrement(),
  connectionId: int('connection_id')
    .notNull()
    .references(() => memberConnections.id, { onDelete: 'cascade' }),
  // Denormalised for fast lookups
  companyUserId: varchar('company_user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  memberUserId: varchar('member_user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Safety notice shown once per conversation per member
  memberSafetyNoticeSeen: boolean('member_safety_notice_seen').default(false),
  companySafetyNoticeSeen: boolean('company_safety_notice_seen').default(false),
  // Report state
  reportedAt: timestamp('reported_at'),
  reportedBy: varchar('reported_by', { length: 36 }),
  reportReason: varchar('report_reason', { length: 255 }),
  reportStatus: mysqlEnum('report_status', ['pending', 'reviewed', 'dismissed']),
  // Block state (member blocks company — ends connection, freezes thread)
  blockedAt: timestamp('blocked_at'),
  blockedBy: varchar('blocked_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable('messages', {
  id: int('id').primaryKey().autoincrement(),
  conversationId: int('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  // Per-recipient read tracking (simple: just track member read + company read)
  readByMember: boolean('read_by_member').default(false),
  readByCompany: boolean('read_by_company').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Blocked company domains ─────────────────────────────────────────────────
export const blockedCompanyDomains = mysqlTable('blocked_company_domains', {
  id: int('id').primaryKey().autoincrement(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  reason: mysqlEnum('reason', ['rejected', 'removed', 'scam']).notNull(),
  companyId: int('company_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Saved jobs ──────────────────────────────────────────────────────────────
export const savedJobs = mysqlTable('saved_jobs', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  jobId: int('job_id')
    .notNull()
    .references(() => jobPosts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Résumé builder ──────────────────────────────────────────────────────────
// One structured résumé per member (athlete / coach / veteran).
export const memberResumes = mysqlTable('member_resumes', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  data: json('data').$type<ResumeData>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ─── Events ──────────────────────────────────────────────────────────────────
// Managed by admins (/admin/events); listed publicly on /events.
export const events = mysqlTable('events', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  format: mysqlEnum('format', ['in_person', 'virtual', 'hybrid']).notNull().default('in_person'),
  location: varchar('location', { length: 255 }),
  registrationUrl: varchar('registration_url', { length: 512 }),
  // Shown as "Hosted by …"; hostCompanyId links company-hosted events.
  hostName: varchar('host_name', { length: 200 }),
  hostCompanyId: int('host_company_id').references(() => verifiedCompanies.id, { onDelete: 'set null' }),
  published: boolean('published').notNull().default(true),
  // Company-submitted events: pay (if a fee applies) → admin review → live.
  // Admin-created events start 'approved' with coverage 'admin'.
  status: mysqlEnum('status', ['pending_payment', 'pending_review', 'approved', 'rejected']).notNull().default('approved'),
  tier: mysqlEnum('tier', ['standard', 'featured']).notNull().default('standard'),
  coverage: mysqlEnum('coverage', ['admin', 'included', 'paid']).notNull().default('admin'),
  submittedByUserId: varchar('submitted_by_user_id', { length: 36 }),
  amountCents: int('amount_cents'),
  paymentStatus: mysqlEnum('payment_status', ['not_required', 'unpaid', 'paid', 'refunded']).notNull().default('not_required'),
  stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  reviewNote: text('review_note'),
  featuredEmailSentAt: timestamp('featured_email_sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
