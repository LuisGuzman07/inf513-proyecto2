import { Alert, Flex, Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { usePilotSession } from './context';
import { SessionStatus } from './layout';
import { useServiceAccess } from './services-access';
import type { ServiceArea } from './services-types';

/** La autorización real la aplica Laravel en cada petición; esto sólo evita una sección vacía. */
export function ServiceAreaGuard({ area }: { area: ServiceArea }) {
  const { user, status } = usePilotSession();
  const access = useServiceAccess(Boolean(user));
  if (status === 'anonymous') return <Navigate to="/ingresar" replace />;
  if (status !== 'authenticated' || !user?.pilot_enabled)
    return <SessionStatus />;
  if (access.isPending)
    return (
      <Flex gap={16} role="status" align="center">
        <Spin />
        <span>Comprobando el acceso a servicios…</span>
      </Flex>
    );
  if (access.isError)
    return (
      <Alert
        type="error"
        showIcon
        title="No se pudo verificar el acceso a servicios."
        action={<a href="/">Volver al inicio</a>}
      />
    );
  if (area === 'staff' && access.data?.staff !== true)
    return (
      <Alert
        type="warning"
        showIcon
        title="Esta cuenta no tiene acceso a esta sección."
        description="La gestión de servicios empresariales requiere la capacidad explícita y provisional del personal de la plataforma."
      />
    );
  if (area === 'company' && (access.data?.companies.length ?? 0) === 0)
    return (
      <Alert
        type="warning"
        showIcon
        title="Esta cuenta no tiene una vinculación activa con una empresa."
        description="El acceso al panel empresarial depende de una vinculación registrada por el personal. La revisión de talento del proceso A no lo concede."
      />
    );
  return <Outlet />;
}
