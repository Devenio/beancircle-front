'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { useFriendActions } from './hooks/use-friend-actions';
import type { DiscoverPerson } from './types';

type Props = {
  person: DiscoverPerson;
  requestId?: string;
  compact?: boolean;
};

export function FriendActionButton({ person, requestId, compact }: Props) {
  const t = useTranslations('discover.people');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend } =
    useFriendActions();

  async function message() {
    const conv = await api<{ id: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId: person.id }),
      locale,
    });
    router.push(`/messages/${conv.id}`);
  }

  if (person.relationship === 'friends') {
    return (
      <div className={compact ? 'flex gap-2' : 'mt-3 flex gap-2'}>
        <Button size="sm" className="flex-1" variant="outline" onClick={() => void message()}>
          {t('message')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => removeFriend.mutate(person.id)}>
          {t('remove')}
        </Button>
      </div>
    );
  }

  if (person.relationship === 'pending_out') {
    return (
      <Button
        size="sm"
        variant="outline"
        className={compact ? '' : 'mt-3 w-full'}
        onClick={() => cancelRequest.mutate(person.id)}
      >
        {t('cancelRequest')}
      </Button>
    );
  }

  if (person.relationship === 'pending_in' && requestId) {
    return (
      <div className={compact ? 'flex gap-2' : 'mt-3 flex gap-2'}>
        <Button size="sm" className="flex-1" onClick={() => acceptRequest.mutate(requestId)}>
          {t('accept')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => rejectRequest.mutate(requestId)}
        >
          {t('decline')}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      className={compact ? '' : 'mt-3 w-full'}
      onClick={() => sendRequest.mutate(person.id)}
      disabled={sendRequest.isPending}
    >
      {t('addFriend')}
    </Button>
  );
}
