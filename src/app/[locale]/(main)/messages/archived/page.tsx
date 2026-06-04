'use client';

import { useParams } from 'next/navigation';
import { MessagesHub } from '@/components/chat/messages-hub';

/** Deep link: full archived conversations list. */
export default function ArchivedMessagesPage() {
  const { locale } = useParams<{ locale: string }>();
  return <MessagesHub locale={locale} />;
}
