import { createFlagsDiscoveryEndpoint, getProviderData } from 'flags/next';
import * as flags from '@/flags';

export const GET = createFlagsDiscoveryEndpoint(async (request) => {
  const apiData = await getProviderData(flags);
  return apiData;
});
