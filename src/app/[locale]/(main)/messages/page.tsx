'use client';

import { useParams } from 'next/navigation';
import { ConversationList } from '@/components/chat/conversation-list';

export default function MessagesPage() {
  const { locale } = useParams<{ locale: string }>();
  return <ConversationList locale={locale} />;
}
