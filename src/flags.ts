import { flag } from '@vercel/flags/next';

export const showBetaFeatures = flag({
  key: 'showBetaFeatures',
  defaultValue: false,
  decide() {
    // Check for a specific environment variable or logic here
    // For now, it will be controlled via Vercel Dashboard/Overrides
    return process.env.SHOW_BETA_FEATURES === 'true';
  },
});
