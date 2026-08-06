'use client';

import useSWR, { SWRConfiguration } from 'swr';

type ApiKey = string | [string, RequestInit?];

async function jsonFetcher<T>(key: ApiKey): Promise<T> {
  const [url, init] = typeof key === 'string' ? [key, undefined] : key;
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json();
}

export function useApiQuery<T = unknown>(
  key: ApiKey | null,
  config?: SWRConfiguration<T>,
) {
  return useSWR<T>(key, jsonFetcher<T>, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    ...config,
  });
}
