'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MockAuthInit } from '@/components/dev/mock-auth-init';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <MockAuthInit />
      {children}
    </QueryClientProvider>
  );
}
