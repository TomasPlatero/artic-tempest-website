export function normalizeRosterRole(role: string | null | undefined) {
  const value = (role || '').trim().toLowerCase();
  if (!value) return null;
  if (value === 'tank') return 'tank';
  if (value === 'heal' || value === 'healer' || value === 'healing') return 'heal';
  if (value === 'melee' || value === 'melee_dps' || value === 'melee-dps') return 'melee';
  if (value === 'ranged' || value === 'ranged_dps' || value === 'ranged-dps') return 'ranged';
  return value;
}
