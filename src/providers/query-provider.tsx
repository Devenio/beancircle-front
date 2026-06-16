'use client';

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { MockAuthInit } from '@/components/dev/mock-auth-init';

// Per-mutation toast configuration, set via `meta` on each useMutation call.
// Errors are toasted automatically for every mutation; success toasts are
// opt-in by providing `successMessage` (otherwise mutations that update UI
// optimistically — likes, follows, etc. — would be needlessly noisy).
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Toast shown on success. Omit for no success toast. */
      successMessage?:
        | string
        | ((data: unknown, variables: unknown) => string);
      /** Override the error toast text. Defaults to the thrown Error's message. */
      errorMessage?: string | ((error: Error, variables: unknown) => string);
      /** Disable the automatic error toast for this mutation. */
      suppressErrorToast?: boolean;
    };
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: (data, variables, _context, mutation) => {
            const { successMessage } = mutation.meta ?? {};
            const message =
              typeof successMessage === 'function'
                ? successMessage(data, variables)
                : successMessage;
            if (message) toast.success(message);
          },
          onError: (error, variables, _context, mutation) => {
            const { suppressErrorToast, errorMessage } = mutation.meta ?? {};
            if (suppressErrorToast) return;
            const err = error instanceof Error ? error : new Error(String(error));
            const message =
              typeof errorMessage === 'function'
                ? errorMessage(err, variables)
                : (errorMessage ?? err.message ?? 'Something went wrong.');
            toast.error(message);
          },
        }),
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MockAuthInit />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
