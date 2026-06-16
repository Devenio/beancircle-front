'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { getCurrentSessionId } from '@/lib/settings-session';
import type { VisibilityOption } from '@/stores/settings-store';

export type SettingsApiData = {
  lastSeenVisibility: VisibilityOption;
  onlineStatusVisibility: VisibilityOption;
  readReceipts: boolean;
  profileVisibility: VisibilityOption;
  showLastSeen: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  mentionNotifications: boolean;
  groupNotifications: boolean;
  marketingNotifications: boolean;
  emailNotifications: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  messageDensity: 'compact' | 'comfortable' | 'spacious';
  chatWallpaper: string;
  autoDownloadMedia: 'wifi' | 'always' | 'never';
  mediaQuality: 'standard' | 'high';
  saveDrafts: boolean;
  linkPreviews: boolean;
  typingIndicators: boolean;
  autoCleanupDays: number;
  locationVisibility: 'exact' | 'approximate' | 'city' | 'hidden';
  discoveryVisibility: 'everyone' | 'friends_of_friends' | 'hidden';
  showOnlineStatus: boolean;
  updatedAt: string;
};

type AppearanceFields = Pick<
  SettingsApiData,
  'accentColor' | 'fontSize' | 'messageDensity' | 'chatWallpaper'
>;

function applyAppearance(s: AppearanceFields) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.style.setProperty('--settings-accent', s.accentColor);
  // Drive the live theme color so the accent picker actually recolors the app.
  el.style.setProperty('--primary', s.accentColor);
  el.dataset.fontSize = s.fontSize;
  el.dataset.messageDensity = s.messageDensity;
  el.dataset.chatWallpaper = s.chatWallpaper;
}

const appearanceChanged = (body: Partial<SettingsApiData>) =>
  body.accentColor !== undefined ||
  body.fontSize !== undefined ||
  body.messageDensity !== undefined ||
  body.chatWallpaper !== undefined;

export function useSettingsApi() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['settings', locale],
    queryFn: async () => {
      const data = await api<SettingsApiData>('/settings', { locale });
      applyAppearance(data);
      return data;
    },
  });

  const patchMutation = useMutation({
    mutationFn: (body: Partial<SettingsApiData>) =>
      api<SettingsApiData>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
        locale,
      }),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: ['settings', locale] });
      const prev = qc.getQueryData<SettingsApiData>(['settings', locale]);
      if (prev) {
        const next = { ...prev, ...body };
        qc.setQueryData(['settings', locale], next);
        if (appearanceChanged(body)) {
          applyAppearance(next);
        }
      }
      return { prev };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(['settings', locale], ctx.prev);
    },
    onSuccess: (data) => {
      qc.setQueryData(['settings', locale], data);
      applyAppearance(data);
    },
  });

  function update(patch: Partial<SettingsApiData>) {
    patchMutation.mutate(patch);
  }

  return { settings: query.data, isLoading: query.isLoading, update, isSaving: patchMutation.isPending };
}

export function useBlockedUsers() {
  const { locale } = useParams<{ locale: string }>();
  return useQuery({
    queryKey: ['settings-blocked', locale],
    queryFn: () =>
      api<
        {
          id: string;
          username?: string | null;
          name?: string | null;
          avatarUrl?: string | null;
          blockedAt: string;
        }[]
      >('/settings/blocked', { locale }),
  });
}

export function useMutedUsers() {
  const { locale } = useParams<{ locale: string }>();
  return useQuery({
    queryKey: ['settings-muted', locale],
    queryFn: () =>
      api<
        {
          id: string;
          username?: string | null;
          name?: string | null;
          avatarUrl?: string | null;
          conversationId: string;
        }[]
      >('/settings/muted', { locale }),
  });
}

export function useSessions() {
  const { locale } = useParams<{ locale: string }>();
  const sessionId = getCurrentSessionId();
  return useQuery({
    queryKey: ['settings-sessions', locale, sessionId],
    queryFn: () =>
      api<
        {
          id: string;
          deviceName: string;
          browser: string;
          os: string;
          location?: string;
          loginAt: string;
          lastUsedAt: string;
          current?: boolean;
        }[]
      >(`/settings/sessions${sessionId ? `?currentSessionId=${sessionId}` : ''}`, { locale }),
  });
}

export function useRevokeSession() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/settings/sessions/${id}`, { method: 'DELETE', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-sessions'] }),
  });
}
