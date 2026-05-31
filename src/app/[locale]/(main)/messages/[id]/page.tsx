'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { io } from 'socket.io-client';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('messages');
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [liveMessages, setLiveMessages] = useState<unknown[]>([]);

  const { data } = useQuery({
    queryKey: ['messages', id, locale],
    queryFn: () =>
      api<{ data: { id: string; body?: string; sender: { id: string; username?: string }; createdAt: string }[] }>(
        `/conversations/${id}/messages`,
        { locale },
      ),
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { token },
    });
    socket.emit('conversation:join', id);
    socket.on('message:new', (msg) => {
      setLiveMessages((prev) => [...prev, msg]);
      qc.invalidateQueries({ queryKey: ['messages', id] });
    });
    return () => {
      socket.disconnect();
    };
  }, [id, qc]);

  const sendMutation = useMutation({
    mutationFn: () =>
      api(`/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
        locale,
      }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['messages', id] });
    },
  });

  const messages = [...(data?.data ?? []), ...liveMessages];

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => {
          const msg = m as { id?: string; body?: string; sender?: { username?: string } };
          return (
            <div key={msg.id ?? i} className="rounded-lg bg-neutral-100 px-3 py-2 text-sm">
              <span className="font-medium">{msg.sender?.username}: </span>
              {msg.body}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('typeMessage')}
          onKeyDown={(e) => e.key === 'Enter' && body && sendMutation.mutate()}
        />
        <Button onClick={() => sendMutation.mutate()} disabled={!body}>
          {t('send')}
        </Button>
      </div>
    </div>
  );
}
