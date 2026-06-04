'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, Crown, Send, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket } from '@/lib/realtime/socket';
import { UserAvatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  getSquad,
  getSquadLeaderboard,
  getSquadMembers,
  getSquadMessages,
  joinSquad,
  leaveSquad,
  sendSquadMessage,
  type SquadMessage,
} from '@/lib/api/squads';

type Tab = 'chat' | 'members' | 'leaderboard';

export default function SquadDetailPage() {
  const t = useTranslations('squads');
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('chat');

  const { data: squad, isLoading } = useQuery({
    queryKey: ['squad', id, locale],
    queryFn: () => getSquad(id, locale),
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      squad?.isMember ? leaveSquad(id, locale) : joinSquad(id, locale),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squad', id] }),
  });

  if (isLoading || !squad) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="size-5 rtl:rotate-180" />
          </Button>
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-xl">
            {squad.emoji ?? '☕'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold leading-none">{squad.name}</p>
            <p className="text-xs text-muted-foreground">
              {t(`categories.${squad.category}`)} ·{' '}
              {t('members', { count: squad.memberCount })}
            </p>
          </div>
          <Button
            size="sm"
            variant={squad.isMember ? 'outline' : 'default'}
            disabled={joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
          >
            {squad.isMember ? t('leave') : t('join')}
          </Button>
        </div>
        <div className="mt-3 flex gap-1 rounded-full bg-muted p-1">
          {(['chat', 'members', 'leaderboard'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 rounded-full px-2 py-1.5 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </header>

      {tab === 'chat' ? (
        <SquadChat
          squadId={id}
          locale={locale}
          isMember={squad.isMember}
          meId={me?.id}
        />
      ) : tab === 'members' ? (
        <MembersTab squadId={id} locale={locale} />
      ) : (
        <LeaderboardTab squadId={id} locale={locale} />
      )}
    </div>
  );
}

function SquadChat({
  squadId,
  locale,
  isMember,
  meId,
}: {
  squadId: string;
  locale: string;
  isMember: boolean;
  meId?: string;
}) {
  const t = useTranslations('squads');
  const [live, setLive] = useState<SquadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['squad-messages', squadId, locale],
    queryFn: () => getSquadMessages(squadId, locale),
    enabled: isMember,
  });

  const messages = useMemo(() => {
    const merged = [...(data?.data ?? []), ...live];
    const seen = new Set<string>();
    return merged.filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
  }, [data, live]);

  function append(msg: SquadMessage) {
    setLive((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }

  useEffect(() => {
    if (!isMember) return;
    const socket = getSocket();
    if (!socket) return;
    const onMessage = (msg: SquadMessage) => append(msg);
    socket.emit('squad:join', squadId);
    socket.on('squad:message', onMessage);
    return () => {
      socket.emit('squad:leave', squadId);
      socket.off('squad:message', onMessage);
    };
  }, [squadId, isMember]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    const msg = await sendSquadMessage(squadId, body, locale);
    append(msg);
  }

  if (!isMember) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        {t('joinToChat')}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4 pb-2">
        {messages.map((m) => {
          const mine = m.sender.id === meId;
          return (
            <div
              key={m.id}
              className={cn('flex gap-2', mine && 'flex-row-reverse')}
            >
              {!mine ? (
                <UserAvatar
                  src={m.sender.avatarUrl}
                  name={m.sender.name}
                  size="sm"
                />
              ) : null}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                  mine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                {!mine ? (
                  <p className="mb-0.5 text-xs font-medium opacity-70">
                    {m.sender.name || m.sender.username}
                  </p>
                ) : null}
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="sticky bottom-20 flex gap-2 border-t border-border bg-background p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('chatPlaceholder')}
          className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <Button size="icon" onClick={send} disabled={!draft.trim()}>
          <Send className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

function MembersTab({ squadId, locale }: { squadId: string; locale: string }) {
  const { data } = useQuery({
    queryKey: ['squad-members', squadId, locale],
    queryFn: () => getSquadMembers(squadId, locale),
  });
  if (!data) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  return (
    <div className="divide-y divide-border p-2">
      {data.map((m) => (
        <div key={m.id} className="flex items-center gap-3 px-2 py-2.5">
          <UserAvatar src={m.user.avatarUrl} name={m.user.name} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {m.user.name || m.user.username}
            </p>
            <p className="text-xs text-muted-foreground">@{m.user.username}</p>
          </div>
          {m.role !== 'MEMBER' ? (
            <Crown className="size-4 text-yellow-500" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LeaderboardTab({
  squadId,
  locale,
}: {
  squadId: string;
  locale: string;
}) {
  const t = useTranslations('squads');
  const { data } = useQuery({
    queryKey: ['squad-leaderboard', squadId, locale],
    queryFn: () => getSquadLeaderboard(squadId, locale),
  });
  if (!data) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  return (
    <div className="divide-y divide-border p-2">
      {data.map((m, i) => (
        <div key={m.id} className="flex items-center gap-3 px-2 py-2.5">
          <span
            className={cn(
              'w-6 text-center text-sm font-bold',
              i === 0 && 'text-yellow-500',
              i === 1 && 'text-zinc-400',
              i === 2 && 'text-amber-700',
            )}
          >
            {i < 3 ? <Trophy className="mx-auto size-4" /> : i + 1}
          </span>
          <UserAvatar src={m.user.avatarUrl} name={m.user.name} size="sm" />
          <p className="flex-1 text-sm font-medium">
            {m.user.name || m.user.username}
          </p>
          <span className="text-sm text-muted-foreground">
            {t('points', { count: m.points })}
          </span>
        </div>
      ))}
    </div>
  );
}
