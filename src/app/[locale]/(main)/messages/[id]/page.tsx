'use client';

import { useParams } from 'next/navigation';
import { ChatRoom } from '@/components/chat/chat-room';

export default function ChatPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  if (!id) return null;
  return <ChatRoom key={id} conversationId={id} locale={locale} />;
}
