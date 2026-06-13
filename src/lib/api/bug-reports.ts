import { api } from './client';

export type BugCategory =
  | 'BUG'
  | 'PERFORMANCE'
  | 'UI_UX'
  | 'CHAT'
  | 'NOTIFICATIONS'
  | 'PAYMENTS'
  | 'ACCOUNT'
  | 'FEATURE_REQUEST'
  | 'OTHER';

export type BugSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugStatus = 'OPEN' | 'INVESTIGATING' | 'FIXED' | 'CLOSED';

export type BugAttachmentKind =
  | 'SCREENSHOT'
  | 'ANNOTATION'
  | 'REPLAY'
  | 'LOG'
  | 'VIDEO'
  | 'OTHER';

export type BugAttachmentInput = {
  kind: BugAttachmentKind;
  url: string;
  mimeType?: string;
  meta?: Record<string, unknown>;
};

export type CreateBugReportInput = {
  title: string;
  description: string;
  category: BugCategory;
  route?: string;
  screenshotUrl?: string;
  replayUrl?: string;
  deviceInfo?: Record<string, unknown>;
  appInfo?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  logs?: unknown[];
  attachments?: BugAttachmentInput[];
  /** Idempotency key so offline-queue retries don't create duplicate tickets. */
  clientToken?: string;
};

export type CreateBugReportResponse = {
  id: string;
  ticketNumber: string;
  status: BugStatus;
  createdAt: string;
};

export type MyBugReport = {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: BugCategory;
  status: BugStatus;
  severity: BugSeverity;
  route: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export function createBugReport(input: CreateBugReportInput) {
  return api<CreateBugReportResponse>('/bug-reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listMyBugReports(cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return api<{ data: MyBugReport[]; nextCursor: string | null }>(
    `/bug-reports/mine${qs}`,
  );
}

export const BUG_CATEGORIES: BugCategory[] = [
  'BUG',
  'PERFORMANCE',
  'UI_UX',
  'CHAT',
  'NOTIFICATIONS',
  'PAYMENTS',
  'ACCOUNT',
  'FEATURE_REQUEST',
  'OTHER',
];
