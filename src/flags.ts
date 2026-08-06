const featureFlagDefaults = {
  enableRoster: true,
  enableStatsLogs: true,
  enableWeeklyVault: true,
} as const;

function readBooleanEnv(name: string, defaultValue: boolean) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === 'true';
}

export async function enableRoster() {
  return readBooleanEnv(
    'NEXT_PUBLIC_ENABLE_ROSTER',
    featureFlagDefaults.enableRoster,
  );
}

export async function enableStatsLogs() {
  return readBooleanEnv(
    'NEXT_PUBLIC_ENABLE_STATS_LOGS',
    featureFlagDefaults.enableStatsLogs,
  );
}

export async function enableWeeklyVault() {
  return readBooleanEnv(
    'NEXT_PUBLIC_ENABLE_WEEKLY_VAULT',
    featureFlagDefaults.enableWeeklyVault,
  );
}

export async function isMaintenanceEnabled() {
  return readBooleanEnv(
    'MAINTENANCE_MODE',
    readBooleanEnv('NEXT_PUBLIC_MAINTENANCE_MODE', false),
  );
}
