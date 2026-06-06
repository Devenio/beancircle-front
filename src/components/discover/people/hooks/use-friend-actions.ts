'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { DiscoverPerson } from '../types';

export function useFriendActions() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['discover'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
  };

  const sendRequest = useMutation({
    mutationFn: (userId: string) =>
      api('/friends/request', { method: 'POST', body: JSON.stringify({ userId }), locale }),
    onSuccess: invalidate,
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId: string) =>
      api('/friends/accept', { method: 'POST', body: JSON.stringify({ requestId }), locale }),
    onSuccess: invalidate,
  });

  const rejectRequest = useMutation({
    mutationFn: (requestId: string) =>
      api('/friends/reject', { method: 'POST', body: JSON.stringify({ requestId }), locale }),
    onSuccess: invalidate,
  });

  const cancelRequest = useMutation({
    mutationFn: (userId: string) =>
      api(`/friends/request?userId=${encodeURIComponent(userId)}`, { method: 'DELETE', locale }),
    onSuccess: invalidate,
  });

  const removeFriend = useMutation({
    mutationFn: (userId: string) =>
      api(`/friends/remove?userId=${encodeURIComponent(userId)}`, { method: 'DELETE', locale }),
    onSuccess: invalidate,
  });

  return { sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend };
}

export function optimisticRelationship(
  person: DiscoverPerson,
  action: 'request' | 'accept' | 'cancel',
): DiscoverPerson['relationship'] {
  if (action === 'request') return 'pending_out';
  if (action === 'accept') return 'friends';
  if (action === 'cancel') return 'none';
  return person.relationship;
}
