'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Coffee,
  Flag,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Repeat2,
  Trash2,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { UserAvatar } from '@/components/chat/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  deleteBean,
  rebean,
  unrebean,
  type Bean,
  type BeanType,
} from '@/lib/api/beans';
import { ReportDialog } from '@/components/report/report-dialog';
import { BeanBody } from './bean-body';
import { BeanPollView } from './bean-poll';
import { BeanReactionsBar } from './bean-reactions';

const TYPE_EMOJI: Record<BeanType, string> = {
  QUICK: '☕',
  PHOTO: '📷',
  VIDEO: '🎥',
  LOCAL: '📍',
  CAFE: '☕',
  EVENT: '🎉',
  COMMUNITY: '🏘️',
};

function timeAgo(iso: string, locale: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const mins = Math.round(diff / 60000);
  if (mins < 1) return rtf.format(0, 'minute');
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

function BeanMediaGrid({ media }: { media: Bean['media'] }) {
  if (!media?.length) return null;
  return (
    <div
      className={cn(
        'grid gap-1 overflow-hidden rounded-xl',
        media.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
      )}
    >
      {media.map((m) =>
        m.type === 'VIDEO' ? (
          <video
            key={m.id}
            src={m.url}
            controls
            playsInline
            preload="metadata"
            className="max-h-96 w-full bg-black object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={m.url}
            alt=""
            className={cn(
              'w-full object-cover',
              media.length > 1 ? 'aspect-square' : 'max-h-96',
            )}
          />
        ),
      )}
    </div>
  );
}

function ContextChips({ bean }: { bean: Bean }) {
  const chips: React.ReactNode[] = [];
  if (bean.cafe) {
    chips.push(
      <Link
        key="cafe"
        href={`/cafe/${bean.cafe.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600"
      >
        <Coffee className="size-3" />
        {bean.cafe.name}
      </Link>,
    );
  }
  if (bean.event) {
    chips.push(
      <Link
        key="event"
        href={`/events/${bean.event.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600"
      >
        <CalendarDays className="size-3" />
        {bean.event.title}
      </Link>,
    );
  }
  if (bean.squad) {
    chips.push(
      <Link
        key="squad"
        href={`/squads/${bean.squad.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600"
      >
        <Users className="size-3" />
        {bean.squad.emoji ? `${bean.squad.emoji} ` : ''}
        {bean.squad.name}
      </Link>,
    );
  }
  if (bean.locationLabel) {
    chips.push(
      <span
        key="location"
        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600"
      >
        <MapPin className="size-3" />
        {bean.locationLabel}
      </span>,
    );
  }
  if (!chips.length) return null;
  return <div className="flex flex-wrap gap-1.5">{chips}</div>;
}

function QuotedBeanCard({ bean, locale }: { bean: Bean; locale: string }) {
  const router = useRouter();
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/bean/${bean.id}`);
      }}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/bean/${bean.id}`)}
      className="cursor-pointer space-y-2 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-2">
        <UserAvatar src={bean.author.avatarUrl} name={bean.author.name} size="sm" />
        <span className="text-xs font-semibold">
          {bean.author.name || bean.author.username}
        </span>
        <span className="text-xs text-muted-foreground">
          {timeAgo(bean.createdAt, locale)}
        </span>
      </div>
      <BeanBody
        body={bean.body}
        className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed"
      />
      <BeanMediaGrid media={bean.media?.slice(0, 1)} />
    </div>
  );
}

export function BeanCard({
  bean,
  locale,
  onQuote,
  detail = false,
}: {
  bean: Bean;
  locale: string;
  onQuote?: (bean: Bean) => void;
  detail?: boolean;
}) {
  const t = useTranslations('beans');
  const qc = useQueryClient();
  const router = useRouter();
  const me = useAuthStore((s) => s.user);

  // A pure ReBean renders the original Bean with a banner on top;
  // all interactions target the original.
  const isRebean = !!bean.rebeanOf;
  const content = bean.rebeanOf ?? bean;
  const mine = me?.id === bean.author.id;
  const contentMine = me?.id === content.author.id;
  const [reportOpen, setReportOpen] = useState(false);

  const rebeanMutation = useMutation({
    mutationFn: (): Promise<unknown> =>
      content.rebeaned
        ? unrebean(content.id, locale)
        : rebean(content.id, locale),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beans'] });
      qc.invalidateQueries({ queryKey: ['bean', content.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBean(bean.id, locale),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beans'] });
    },
  });

  const counts = {
    replies: content._count?.replies ?? content.replyCount,
    rebeans: content._count?.rebeans ?? content.rebeanCount,
    reactions: content._count?.reactions ?? content.reactionCount,
  };

  return (
    <article
      className={cn(
        'space-y-2 border-b border-border px-4 py-3',
        !detail && 'cursor-pointer transition-colors hover:bg-muted/30',
      )}
      onClick={
        detail ? undefined : () => router.push(`/bean/${content.id}`)
      }
    >
      {isRebean ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Repeat2 className="size-3.5" />
          {t('rebeanedBy', {
            name: bean.author.name || bean.author.username || '',
          })}
        </p>
      ) : null}

      {content.parent && !detail ? (
        <p className="text-xs text-muted-foreground">
          {t('replyingTo', {
            name:
              content.parent.author.name ||
              content.parent.author.username ||
              '',
          })}
        </p>
      ) : null}

      <div className="flex items-start gap-2.5">
        <Link
          href={
            content.author.username ? `/profile/${content.author.username}` : '#'
          }
          onClick={(e) => e.stopPropagation()}
        >
          <UserAvatar src={content.author.avatarUrl} name={content.author.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={
                content.author.username
                  ? `/profile/${content.author.username}`
                  : '#'
              }
              onClick={(e) => e.stopPropagation()}
              className="truncate text-sm font-semibold"
            >
              {content.author.name || content.author.username}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground">
              {timeAgo(content.createdAt, locale)}
            </span>
            <span className="ms-auto shrink-0 text-sm" title={content.type}>
              {TYPE_EMOJI[content.type] ?? '☕'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {mine ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate();
                    }}
                  >
                    <Trash2 className="size-4" />
                    {t('delete')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportOpen(true);
                    }}
                  >
                    <Flag className="size-4" />
                    {t('report')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {content.author.username ? (
            <p className="text-xs text-muted-foreground">
              @{content.author.username}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5 ps-[3.125rem]">
        <BeanBody
          body={content.body}
          className={cn(
            'whitespace-pre-wrap leading-relaxed',
            detail ? 'text-base' : 'text-sm',
          )}
        />
        <BeanMediaGrid media={content.media} />
        {content.poll ? (
          <BeanPollView
            beanId={content.id}
            poll={content.poll}
            myOptionId={content.myPollOptionId}
            locale={locale}
          />
        ) : null}
        {content.quotedBean ? (
          <QuotedBeanCard bean={content.quotedBean} locale={locale} />
        ) : null}
        <ContextChips bean={content} />

        <div className="flex items-center gap-5 pt-0.5 text-muted-foreground">
          <Link
            href={`/bean/${content.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-sm hover:text-foreground"
          >
            <MessageCircle className="size-4.5" />
            {counts.replies > 0 ? counts.replies : null}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              title={contentMine ? t('cantRebeanOwn') : undefined}
              className={cn(
                'flex items-center gap-1 text-sm hover:text-foreground',
                content.rebeaned && 'font-medium text-emerald-600',
                contentMine && 'cursor-not-allowed opacity-40 hover:text-muted-foreground',
              )}
              disabled={contentMine}
            >
              <Repeat2 className="size-4.5" />
              {counts.rebeans > 0 ? counts.rebeans : null}
            </DropdownMenuTrigger>
            {!contentMine ? (
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={() => rebeanMutation.mutate()}
                  disabled={rebeanMutation.isPending}
                >
                  <Repeat2 className="size-4" />
                  {content.rebeaned ? t('undoRebean') : t('rebean')}
                </DropdownMenuItem>
                {onQuote ? (
                  <DropdownMenuItem onClick={() => onQuote(content)}>
                    <PenLine className="size-4" />
                    {t('quote')}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            ) : null}
          </DropdownMenu>
        </div>

        <BeanReactionsBar
          beanId={content.id}
          locale={locale}
          current={content.myReaction}
          count={counts.reactions}
          breakdown={detail ? content.reactionBreakdown : undefined}
        />
      </div>

      {!mine ? (
        <ReportDialog
          targetType="POST"
          targetId={content.id}
          locale={locale}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      ) : null}
    </article>
  );
}
