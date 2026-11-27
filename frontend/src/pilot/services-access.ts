import { useQuery } from '@tanstack/react-query';
import { usePilotSession } from './context';
import { servicesApi } from './services-api';
import type { ServiceAccess } from './services-types';
import type { PilotUser } from './types';
import { sessionHome } from './workflow';

/**
 * S2.2.1 y S2.5: la navegación refleja capacidades reales, no un selector de actores.
 * `/api/servicios/acceso` informa el dato autorizado del servidor: empresas donde la cuenta
 * es responsable activo y `can_manage_services`. El listado compartido de servicios responde
 * 200 también a un responsable, así que no se usa para deducir la capacidad del personal.
 */
export function useServiceAccess(enabled = true) {
  const { session } = usePilotSession();
  return useQuery({
    queryKey: session.key('service-access'),
    enabled,
    queryFn: ({ signal }) =>
      session.run((request) => servicesApi.access(request), signal),
  });
}

export function companyAccess(access?: ServiceAccess) {
  return (access?.companies.length ?? 0) > 0;
}

/**
 * Destino de una sesión ya autenticada. `/auth/me` no informa capacidades del proceso B, así
 * que se resuelven contra el acceso autorizado del servidor. Mientras se resuelven no hay
 * destino: nunca se cae al listado del proceso A por defecto.
 */
export function useSessionHome(user: PilotUser | null) {
  const needsServices =
    Boolean(user) && !user?.is_graduate && !user?.can_review_talent;
  const access = useServiceAccess(needsServices);
  const retry = () => void access.refetch();
  if (!user) return { home: null, pending: false, failed: false, retry };
  if (!needsServices)
    return { home: sessionHome(user), pending: false, failed: false, retry };
  if (access.isPending)
    return { home: null, pending: true, failed: false, retry };
  if (!access.data) return { home: null, pending: false, failed: true, retry };
  return {
    home: sessionHome({
      ...user,
      can_manage_services: access.data.staff,
      company_manager: companyAccess(access.data),
    }),
    pending: false,
    failed: false,
    retry,
  };
}
