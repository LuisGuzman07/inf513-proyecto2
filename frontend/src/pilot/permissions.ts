import type { PilotUser } from './types';

export function hasPermission(
  user: PilotUser | null | undefined,
  permission: string
): boolean {
  if (!user) return false;
  if (Array.isArray(user.permissions) && user.permissions.includes(permission)) {
    return true;
  }
  // Respaldo con banderas heredadas si aún no vienen permisos
  if (
    user.is_graduate &&
    (permission === 'talento.inscripcion.gestionar' ||
      permission === 'talento.evaluaciones.realizar')
  ) {
    return true;
  }
  if (
    user.can_review_talent &&
    (permission === 'talento.revision.gestionar' ||
      permission === 'talento.instrumentos.gestionar' ||
      permission === 'candidatos.banco.ver')
  ) {
    return true;
  }
  if (
    user.can_manage_services &&
    (permission === 'servicios.gestionar' ||
      permission === 'candidatos.banco.ver')
  ) {
    return true;
  }
  return false;
}

export function hasAnyPermission(
  user: PilotUser | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}
