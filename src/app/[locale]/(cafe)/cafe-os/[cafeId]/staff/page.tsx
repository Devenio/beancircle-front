'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi, type CafeRole } from '@/lib/api/cafe-os';
import { useAuthStore } from '@/stores/auth-store';
import { useIdentityStore } from '@/stores/identity-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, UserPlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const ROLES: CafeRole[] = ['OWNER', 'MANAGER', 'STAFF', 'MODERATOR'];

export default function StaffPage() {
  const t = useTranslations('cafeOs');
  const { cafeId } = useParams<{ cafeId: string }>();
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const myRole = useIdentityStore(
    (s) => s.cafes.find((c) => c.cafeId === cafeId)?.role,
  );

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<CafeRole>('STAFF');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cafe-staff', cafeId],
    queryFn: () => cafeOsApi.staff(cafeId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['cafe-staff', cafeId] });

  const invite = useMutation({
    mutationFn: () => cafeOsApi.inviteStaff(cafeId, { username, role }),
    onSuccess: () => {
      setUsername('');
      setError('');
      void refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const changeRole = useMutation({
    mutationFn: ({ staffId, role }: { staffId: string; role: CafeRole }) =>
      cafeOsApi.updateStaffRole(cafeId, staffId, role),
    onSuccess: () => void refresh(),
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (staffId: string) => cafeOsApi.removeStaff(cafeId, staffId),
    onSuccess: () => void refresh(),
    onError: (e: Error) => setError(e.message),
  });

  const cancelInvite = useMutation({
    mutationFn: (inviteId: string) => cafeOsApi.cancelInvite(cafeId, inviteId),
    onSuccess: () => void refresh(),
  });

  const canManage = myRole === 'OWNER' || myRole === 'MANAGER';
  const isOwner = myRole === 'OWNER';

  if (isLoading || !data) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">{t('staff.title')}</h1>

      {canManage && (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4" />
            {t('staff.invite')}
          </h2>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('staff.usernamePlaceholder')}
            dir="ltr"
          />
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as CafeRole)}
            >
              {ROLES.filter((r) => isOwner || r !== 'OWNER').map((r) => (
                <option key={r} value={r}>
                  {t(`role.${r}`)}
                </option>
              ))}
            </select>
            <Button
              disabled={!username.trim() || invite.isPending}
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('staff.send')
              )}
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t('staff.members', { count: data.staff.length })}
        </h2>
        {data.staff.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.user.avatarUrl ?? undefined} />
              <AvatarFallback>
                {(member.user.name ?? member.user.username ?? '?')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.user.name || member.user.username}
                {member.user.id === me?.id ? ` ${t('staff.you')}` : ''}
              </p>
              <p className="truncate text-xs text-muted-foreground" dir="ltr">
                @{member.user.username}
              </p>
            </div>
            {isOwner && member.user.id !== me?.id ? (
              <>
                <select
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  value={member.role}
                  onChange={(e) =>
                    changeRole.mutate({
                      staffId: member.id,
                      role: e.target.value as CafeRole,
                    })
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`role.${r}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => remove.mutate(member.id)}
                  className="rounded-full p-2 text-red-500 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Badge variant="secondary">{t(`role.${member.role}`)}</Badge>
            )}
          </div>
        ))}
      </section>

      {data.pendingInvites.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t('staff.pending')}
          </h2>
          {data.pendingInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={inv.invitee?.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {(inv.invitee?.username ?? '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" dir="ltr">
                  @{inv.invitee?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`role.${inv.role}`)}
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => cancelInvite.mutate(inv.id)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
