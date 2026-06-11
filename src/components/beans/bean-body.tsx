'use client';

import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';

const TOKEN_RE = /([#@][\p{L}\p{N}_.]+)/gu;

export function BeanBody({
  body,
  className,
}: {
  body?: string | null;
  className?: string;
}) {
  if (!body) return null;
  const parts = body.split(TOKEN_RE);
  return (
    <p className={className ?? 'whitespace-pre-wrap text-sm leading-relaxed'}>
      {parts.map((part, i) => {
        if (part.startsWith('#') && part.length > 1) {
          return (
            <Link
              key={i}
              href={`/hashtag/${encodeURIComponent(part.slice(1).toLowerCase())}`}
              className="font-medium text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('@') && part.length > 1) {
          return (
            <Link
              key={i}
              href={`/profile/${part.slice(1)}`}
              className="font-medium text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}
