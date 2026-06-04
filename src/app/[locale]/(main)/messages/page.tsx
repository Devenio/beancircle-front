'use client';

import { useParams } from 'next/navigation';
import { MessagesHub } from '@/components/chat/messages-hub';

export default function MessagesPage() {
  const { locale } = useParams<{ locale: string }>();
  return <MessagesHub locale={locale} initialTab="chats" />;
}
