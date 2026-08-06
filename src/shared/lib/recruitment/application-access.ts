export type RecruitmentPatchAccessInput = {
  isAuthenticated: boolean;
  isOwner: boolean;
  canEditRecruitment: boolean;
  wantsStaffFields: boolean;
};

export type RecruitmentPatchAccessResult =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; error: string };

export function resolveRecruitmentPatchAccess({
  isAuthenticated,
  isOwner,
  canEditRecruitment,
  wantsStaffFields,
}: RecruitmentPatchAccessInput): RecruitmentPatchAccessResult {
  if (!isAuthenticated) {
    return { allowed: false, status: 401, error: 'No autorizado' };
  }

  if (wantsStaffFields && !canEditRecruitment) {
    return {
      allowed: false,
      status: 403,
      error: 'No tienes permiso para modificar estos campos',
    };
  }

  if (!wantsStaffFields && !isOwner && !canEditRecruitment) {
    return {
      allowed: false,
      status: 403,
      error: 'No puedes editar esta solicitud',
    };
  }

  return { allowed: true };
}
