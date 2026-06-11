'use client';

import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Bean } from '@/lib/api/beans';
import { BeanComposer, type BeanComposerContext } from './bean-composer';

export function BeanComposerSheet({
  open,
  onOpenChange,
  locale,
  context,
  quotedBean,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  context?: BeanComposerContext;
  quotedBean?: Bean | null;
  parentId?: string;
}) {
  const t = useTranslations('beans');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-[430px] rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>
            {quotedBean ? t('quoteTitle') : t('shareTitle')}
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-2">
          <BeanComposer
            locale={locale}
            context={context}
            quotedBean={quotedBean}
            parentId={parentId}
            onPosted={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
