import { cache } from 'react';
import { auth } from '@/auth';
export const getCachedServerSession = cache(async () => {
  return auth();
});
