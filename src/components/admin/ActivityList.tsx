/**
 * Renders admin activity-log entries (used by Overview and Activity pages).
 */
import { adminTheme as t } from './theme';
import { Eyebrow, Pill, type PillTone } from './AdminUi';
import { formatDate, relativeTime } from './admin-utils';

export interface ActivityEntry {
  id: number;
  adminUserId: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  application_approve: 'Approved application',
  application_reject: 'Rejected application',
  application_ask_info: 'Requested more info',
  company_suspend: 'Suspended company',
  company_reinstate: 'Reinstated company',
  company_access_update: 'Updated company access',
  member_suspend: 'Suspended member',
  member_reinstate: 'Reinstated member',
  company_report_reviewed: 'Marked report reviewed',
  company_report_dismissed: 'Dismissed report',
  conversation_report_dismiss: 'Dismissed reported conversation',
  delete_test_data: 'Deleted test data',
  send_password_reset: 'Sent password reset',
};

function actionTone(action: string): PillTone {
  if (/suspend|reject|delete/.test(action)) return 'danger';
  if (/approve|reinstate/.test(action)) return 'success';
  if (/report|dismiss/.test(action)) return 'info';
  return 'gold';
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export default function ActivityList({ entries, compact = false }: { entries: ActivityEntry[]; compact?: boolean }) {
  return (
    <ol className="flex flex-col">
      {entries.map((e, i) => (
        <li
          key={e.id}
          className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 py-4"
          style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.line}` }}
        >
          <div className="sm:w-36 shrink-0" title={formatDate(e.createdAt, true)}>
            <Eyebrow>{compact ? relativeTime(e.createdAt) : formatDate(e.createdAt, true)}</Eyebrow>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Pill tone={actionTone(e.action)}>{actionLabel(e.action)}</Pill>
              {e.targetType && (
                <span className="font-barlow" style={{ fontSize: '12px', color: t.ice60 }}>
                  {e.targetType.replace(/_/g, ' ')}{e.targetId ? ` #${e.targetId.length > 12 ? e.targetId.slice(0, 8) + '…' : e.targetId}` : ''}
                </span>
              )}
            </div>
            {e.details && (
              <p
                className={`font-barlow ${compact ? 'truncate' : ''}`}
                style={{ fontSize: '14px', fontWeight: 300, color: t.white, lineHeight: 1.5, wordBreak: 'break-word' }}
              >
                {e.details}
              </p>
            )}
            <p className="font-barlow mt-1" style={{ fontSize: '12px', fontWeight: 300, color: t.ice40 }}>
              by {e.adminEmail ?? 'unknown admin'}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
