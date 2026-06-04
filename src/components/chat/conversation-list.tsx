'use client';

import { MessagesHub } from '@/components/chat/messages-hub';

/** @deprecated Use MessagesHub — kept for existing imports */
export function ConversationList({ locale }: { locale: string }) {
  return <MessagesHub locale={locale} />;
}
