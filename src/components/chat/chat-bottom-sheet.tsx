'use client';

import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ChatBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
};

export function ChatBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = false,
}: ChatBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={showCloseButton}
        className={cn(
          'max-h-[min(92dvh,720px)] rounded-t-[1.25rem] px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0',
          'duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]',
          className,
        )}
      >
        <div
          className="mx-auto mt-2.5 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30"
          aria-hidden
        />
        {(title || description) && (
          <SheetHeader className="px-4 pb-2 text-left">
            {title ? <SheetTitle className="text-base">{title}</SheetTitle> : null}
            {description ? (
              <SheetDescription className="line-clamp-2">{description}</SheetDescription>
            ) : null}
          </SheetHeader>
        )}
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
