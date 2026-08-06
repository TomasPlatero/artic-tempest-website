import { describe, expect, it } from 'vitest';
import { resolveRecruitmentPatchAccess } from './application-access';

describe('resolveRecruitmentPatchAccess', () => {
  it('allows the owner to edit their own answers', () => {
    expect(
      resolveRecruitmentPatchAccess({
        isAuthenticated: true,
        isOwner: true,
        canEditRecruitment: false,
        wantsStaffFields: false,
      }),
    ).toEqual({ allowed: true });
  });

  it('blocks staff fields for non-staff users', () => {
    expect(
      resolveRecruitmentPatchAccess({
        isAuthenticated: true,
        isOwner: true,
        canEditRecruitment: false,
        wantsStaffFields: true,
      }),
    ).toEqual({
      allowed: false,
      status: 403,
      error: 'No tienes permiso para modificar estos campos',
    });
  });

  it('blocks non-owners who are not staff', () => {
    expect(
      resolveRecruitmentPatchAccess({
        isAuthenticated: true,
        isOwner: false,
        canEditRecruitment: false,
        wantsStaffFields: false,
      }),
    ).toEqual({
      allowed: false,
      status: 403,
      error: 'No puedes editar esta solicitud',
    });
  });

  it('rejects unauthenticated requests', () => {
    expect(
      resolveRecruitmentPatchAccess({
        isAuthenticated: false,
        isOwner: false,
        canEditRecruitment: false,
        wantsStaffFields: false,
      }),
    ).toEqual({
      allowed: false,
      status: 401,
      error: 'No autorizado',
    });
  });
});
