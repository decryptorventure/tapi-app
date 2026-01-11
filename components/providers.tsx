'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
            cacheTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer
            refetchOnWindowFocus: false, // Already set - good!
            retry: 1, // Reduce retry attempts for faster failures
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
