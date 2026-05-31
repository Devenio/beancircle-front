'use client';

import { useParams } from 'next/navigation';
import { ChatRoom } from '@/components/chat/chat-room';

export default function ChatPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  return <ChatRoom conversationId={id} locale={locale} />;
}
