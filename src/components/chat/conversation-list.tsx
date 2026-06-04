'use client';

import { MessagesHub } from '@/components/chat/messages-hub';
import type { InboxTab } from '@/components/chat/messages-inbox-tabs';

/** @deprecated Use MessagesHub — kept for existing imports */
export function ConversationList({
  locale,
  initialTab,
}: {
  locale: string;
  initialTab?: InboxTab;
}) {
  return <MessagesHub locale={locale} initialTab={initialTab} />;
}
