import type { ZonaRaiderTourRole, ZonaRaiderTourStep } from "./zona-raider-tour.config";

export const filterByRoleAndPermissions = (
  steps: ZonaRaiderTourStep[],
  roleLevel: string,
  viewableAppIds: string[],
): ZonaRaiderTourStep[] => {
  const normalized = roleLevel.toLowerCase().trim() as ZonaRaiderTourRole;
  const viewableSet = new Set(viewableAppIds);
  return steps.filter(
    (step) =>
      (!step.roles || step.roles.includes(normalized)) &&
      (!step.appId || viewableSet.has(step.appId)),
  );
};
