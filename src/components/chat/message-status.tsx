'use client';

import { Check, CheckCheck, Clock3, AlertCircle } from 'lucide-react';
import type { MessageDeliveryStatus } from '@/components/chat/types';
import { cn } from '@/lib/utils';

export function MessageStatusIcon({
  status,
  className,
}: {
  status: MessageDeliveryStatus;
  className?: string;
}) {
  const iconClass = cn('size-3.5', className);

  if (status === 'sending') return <Clock3 className={cn(iconClass, 'opacity-70')} aria-label="Sending" />;
  if (status === 'failed') return <AlertCircle className={cn(iconClass, 'text-destructive')} aria-label="Failed" />;
  if (status === 'sent') return <Check className={iconClass} aria-label="Sent" />;
  if (status === 'delivered') return <CheckCheck className={cn(iconClass, 'opacity-70')} aria-label="Delivered" />;
  return <CheckCheck className={cn(iconClass, 'text-sky-500')} aria-label="Seen" />;
}
