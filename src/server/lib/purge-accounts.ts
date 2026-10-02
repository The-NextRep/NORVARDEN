/**
 * Permanently removes accounts and/or companies, with everything that hangs
 * off them (profile, connections, conversations, messages, reports, saved jobs,
 * job posts, subscriptions, admin notes). Admin accounts are never removed.
 *
 * Used by the admin "delete test data" button (@theboard.test) and by
 * src/scripts/remove-account.ts (one exact email).
 * IRREVERSIBLE.
 */
import { eq, inArray, like, or, type SQL } from 'drizzle-orm';
import { db } from '../db/client';
import {
  user as userTable,
  memberProfiles,
  memberConnections,
  conversations,
  messages,
  verifiedCompanies,
  companyApplications,
  companyReports,
  companySubscriptions,
  adminNotes,
  jobPosts,
  savedJobs,
  messageNotificationPrefs,
} from '../db/schema';

export interface PurgeMatch {
  /** SQL that narrows candidate users; isUserEmail makes the exact decision. */
  userWhere: SQL;
  isUserEmail: (email: string | null | undefined) => boolean;
  /** SQL that narrows candidate company applications; isApplication decides. */
  applicationWhere: SQL;
  isApplication: (contactEmail: string | null | undefined, emailDomain: string | null | undefined) => boolean;
}

export type PurgeCounts = {
  users: number; profiles: number; connections: number; conversations: number; messages: number;
  companies: number; applications: number; jobs: number; reports: number;
};

function affected(result: unknown): number {
  const r = result as [{ affectedRows?: number }] | undefined;
  return r?.[0]?.affectedRows ?? 0;
}

/** Everything belonging to the theboard.test test domain. */
export function testDomainMatch(): PurgeMatch {
  const domain = 'theboard.test';
  const suffix = '@' + domain;
  const isTest = (e: string | null | undefined) => !!e && e.trim().toLowerCase().endsWith(suffix);
  return {
    userWhere: like(userTable.email, '%' + suffix),
    isUserEmail: isTest,
    applicationWhere: or(like(companyApplications.contactEmail, '%' + suffix), eq(companyApplications.emailDomain, domain))!,
    isApplication: (c, d) => isTest(c) || (d ?? '').toLowerCase() === domain,
  };
}

/** One exact email: that account, plus any company application it submitted. */
export function exactEmailMatch(email: string): PurgeMatch {
  const target = email.trim().toLowerCase();
  const same = (e: string | null | undefined) => !!e && e.trim().toLowerCase() === target;
  return {
    userWhere: eq(userTable.email, target),
    isUserEmail: same,
    applicationWhere: eq(companyApplications.contactEmail, target),
    isApplication: (c) => same(c),
  };
}

export async function purgeAccounts(match: PurgeMatch): Promise<PurgeCounts> {
  return db.transaction(async (tx) => {
    // 1. Test users — LIKE narrows, then an exact suffix check in JS so
    //    nothing else can match (e.g. "x@nottheboard.test").
    const candidates = await tx
      .select({ id: userTable.id, email: userTable.email, isAdmin: userTable.isAdmin })
      .from(userTable)
      .where(match.userWhere);
    const testUserIds = candidates.filter((u) => match.isUserEmail(u.email) && !u.isAdmin).map((u) => u.id);

    // 2. Test company applications (contact email or domain exactly theboard.test)
    const appCandidates = await tx
      .select({ id: companyApplications.id, contactEmail: companyApplications.contactEmail, emailDomain: companyApplications.emailDomain })
      .from(companyApplications)
      .where(match.applicationWhere);
    const testAppIds = appCandidates
      .filter((a) => match.isApplication(a.contactEmail, a.emailDomain))
      .map((a) => a.id);

    const testVcIds = testAppIds.length
      ? (await tx.select({ id: verifiedCompanies.id }).from(verifiedCompanies)
          .where(inArray(verifiedCompanies.applicationId, testAppIds))).map((v) => v.id)
      : [];

    const testProfileIds = testUserIds.length
      ? (await tx.select({ id: memberProfiles.id }).from(memberProfiles)
          .where(inArray(memberProfiles.userId, testUserIds))).map((p) => p.id)
      : [];

    // 3. Connections involving test users or test companies
    const connConds = [];
    if (testUserIds.length) {
      connConds.push(inArray(memberConnections.requesterId, testUserIds), inArray(memberConnections.recipientId, testUserIds));
    }
    if (testVcIds.length) connConds.push(inArray(memberConnections.verifiedCompanyId, testVcIds));
    const testConnIds = connConds.length
      ? (await tx.select({ id: memberConnections.id }).from(memberConnections).where(or(...connConds))).map((c) => c.id)
      : [];

    // 4. Conversations involving test users or those connections
    const convConds = [];
    if (testUserIds.length) {
      convConds.push(inArray(conversations.companyUserId, testUserIds), inArray(conversations.memberUserId, testUserIds));
    }
    if (testConnIds.length) convConds.push(inArray(conversations.connectionId, testConnIds));
    const testConvIds = convConds.length
      ? (await tx.select({ id: conversations.id }).from(conversations).where(or(...convConds))).map((c) => c.id)
      : [];

    let deletedMessages = 0;
    let deletedConversations = 0;
    let deletedConnections = 0;
    let deletedProfiles = 0;
    let deletedCompanies = 0;
    let deletedApplications = 0;
    let deletedJobs = 0;
    let deletedReports = 0;
    let deletedUsers = 0;

    if (testConvIds.length) {
      deletedMessages = affected(await tx.delete(messages).where(inArray(messages.conversationId, testConvIds)));
      deletedConversations = affected(await tx.delete(conversations).where(inArray(conversations.id, testConvIds)));
    }
    if (testConnIds.length) {
      deletedConnections = affected(await tx.delete(memberConnections).where(inArray(memberConnections.id, testConnIds)));
    }

    // 5. Reports filed by test members or against test companies
    const reportConds = [];
    if (testProfileIds.length) reportConds.push(inArray(companyReports.reporterMemberId, testProfileIds));
    if (testVcIds.length) reportConds.push(inArray(companyReports.companyId, testVcIds));
    if (reportConds.length) {
      deletedReports = affected(await tx.delete(companyReports).where(or(...reportConds)));
    }

    // 6. Test companies: saved jobs → jobs → subscriptions → company
    if (testVcIds.length) {
      const jobIds = (await tx.select({ id: jobPosts.id }).from(jobPosts)
        .where(inArray(jobPosts.companyId, testVcIds))).map((j) => j.id);
      if (jobIds.length) {
        await tx.delete(savedJobs).where(inArray(savedJobs.jobId, jobIds));
        deletedJobs = affected(await tx.delete(jobPosts).where(inArray(jobPosts.id, jobIds)));
      }
      await tx.delete(companySubscriptions).where(inArray(companySubscriptions.companyId, testVcIds));
      deletedCompanies = affected(await tx.delete(verifiedCompanies).where(inArray(verifiedCompanies.id, testVcIds)));
    }
    if (testAppIds.length) {
      await tx.delete(adminNotes).where(inArray(adminNotes.applicationId, testAppIds));
      deletedApplications = affected(await tx.delete(companyApplications).where(inArray(companyApplications.id, testAppIds)));
    }

    // 7. Test users' own rows, then the users (FK cascade handles session/account/reset tokens)
    if (testUserIds.length) {
      await tx.delete(savedJobs).where(inArray(savedJobs.userId, testUserIds));
      await tx.delete(messageNotificationPrefs).where(inArray(messageNotificationPrefs.userId, testUserIds));
      deletedProfiles = affected(await tx.delete(memberProfiles).where(inArray(memberProfiles.userId, testUserIds)));
      deletedUsers = affected(await tx.delete(userTable).where(inArray(userTable.id, testUserIds)));
    }

    return {
      users: deletedUsers,
      profiles: deletedProfiles,
      connections: deletedConnections,
      conversations: deletedConversations,
      messages: deletedMessages,
      companies: deletedCompanies,
      applications: deletedApplications,
      jobs: deletedJobs,
      reports: deletedReports,
    };
  });
}
