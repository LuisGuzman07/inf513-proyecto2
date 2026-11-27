import { QueryClientProvider } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  ConfigProvider,
  Dropdown,
  Flex,
  Spin,
  Typography,
} from 'antd';
import esES from 'antd/locale/es_ES';
import {
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  DollarOutlined,
  DownOutlined,
  LogoutOutlined,
  HomeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  HistoryOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  Link,
  matchPath,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { PilotFrame } from './pilot-frame';
import { UserAvatar } from '../components/shared/user-avatar/user-avatar';
import { PilotSessionContext, usePilotSession } from './context';
import { PilotSession } from './session';
import {
  AppearanceProvider,
  resolveEffectiveColorMode,
  useAppearance,
} from './appearance';
import './styles.css';
import './brand.css';
import './figma-shell.css';
import { InstitutionalBrand } from './brand';
import { institutionalVariables } from './identity';
import { companyAccess, useServiceAccess } from './services-access';
import { hasAnyPermission, hasPermission } from './permissions';
import { sessionHome } from './workflow';
export function PilotSessionProvider() {
  const [session] = useState(() => new PilotSession());
  useEffect(() => {
    void session.boot();
    return () => session.invalidate('anonymous');
  }, [session]);
  return (
    <PilotSessionContext.Provider value={session}>
      <QueryClientProvider client={session.client}>
        <AppearanceProvider>
          <PilotThemedApp />
        </AppearanceProvider>
      </QueryClientProvider>
    </PilotSessionContext.Provider>
  );
}

function PilotThemedApp() {
  const { preferences, themeConfig } = useAppearance();
  const effectiveMode = resolveEffectiveColorMode(preferences.color_mode);
  const classes = [
    'pilot-identity',
    `pilot-theme-${preferences.theme_variant}`,
    `pilot-mode-${effectiveMode}`,
    preferences.high_contrast ? 'pilot-high-contrast' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ConfigProvider locale={esES} theme={themeConfig}>
      <App className={classes} style={institutionalVariables}>
        <PilotLayout />
      </App>
    </ConfigProvider>
  );
}
function PilotLayout() {
  const { user, session } = usePilotSession();
  const { pathname, hash } = useLocation();
  const access = useServiceAccess(Boolean(user));
  const staffServices = user
    ? access.data?.staff === true ||
      hasPermission(user, 'servicios.gestionar')
    : false;
  const companyServices = user ? companyAccess(access.data) : false;
  const canTalento = hasPermission(user, 'talento.inscripcion.gestionar');
  const canEvaluaciones = hasPermission(user, 'talento.evaluaciones.realizar');
  const canRevisar = hasPermission(user, 'talento.revision.gestionar');
  const canInstrumentos = hasPermission(user, 'talento.instrumentos.gestionar');
  const canBanco = hasPermission(user, 'candidatos.banco.ver');
  const canCompanyDonations =
    companyServices && hasPermission(user, 'empresa.donativos.gestionar');
  const canManageCompanies = staffServices || hasPermission(user, 'admin.usuarios.gestionar');
  const canAdminUsers = hasPermission(user, 'admin.usuarios.gestionar');
  const canAdminRoles = hasAnyPermission(user, [
    'admin.roles.gestionar',
    'admin.permisos.gestionar',
  ]);
  const canAdminDashboard = hasPermission(user, 'admin.dashboard.ver');
  const canAdminAudit = hasPermission(user, 'admin.auditoria.ver');
  const links = [
    ['/', 'Inicio'],
    ...(user
      ? [
          ...(canTalento
            ? [
                ['/portal/inscripcion', 'Mi inscripción'],
                ['/portal/inscripcion#documentos', 'Documentos'],
                ['/portal/inscripcion#observaciones', 'Observaciones'],
              ]
            : []),
          ...(canEvaluaciones ? [['/portal/pruebas', 'Mis pruebas']] : []),
          ...(canRevisar
            ? [['/personal/inscripciones', 'Bandeja de inscripciones']]
            : []),
          ...(canRevisar && canBanco
            ? [['/personal/banco-candidatos', 'Banco de candidatos']]
            : []),
          ...(canInstrumentos
            ? [['/personal/instrumentos', 'Banco de instrumentos']]
            : []),
          ...(staffServices
            ? [['/personal/servicios', 'Bandeja de servicios']]
            : []),
          ...(canManageCompanies
            ? [['/personal/empresas', 'Empresas']]
            : []),
          ...(companyServices
            ? [
                ['/banco-candidatos', 'Banco de candidatos'],
                ['/empresa/servicios', 'Solicitudes de mi empresa'],
              ]
            : []),
          ...(canCompanyDonations
            ? [['/empresa/donativos', 'Donativos empresariales']]
            : []),
          ...(canAdminDashboard
            ? [['/admin/dashboard', 'Dashboard']]
            : []),
          ...(canAdminUsers ? [['/admin/usuarios', 'Usuarios']] : []),
          ...(canAdminRoles ? [['/admin/roles', 'Roles y permisos']] : []),
          ...(canAdminAudit ? [['/admin/auditoria', 'Auditoría']] : []),
          ...(canTalento || canRevisar
            ? [['/expedientes-anteriores', 'Expedientes anteriores']]
            : []),
        ]
      : [
          ['/banco-candidatos', 'Banco de candidatos'],
          ['/ingresar', 'Ingresar'],
          ['/registro', 'Registrarse'],
        ]),
  ];
  const selected = [
    ['/admin/dashboard', '/admin/dashboard'],
    ['/admin/auditoria', '/admin/auditoria'],
    ['/admin/usuarios', '/admin/usuarios'],
    ['/admin/roles', '/admin/roles'],
    ['/personal/banco-candidatos', '/personal/banco-candidatos'],
    ['/banco-candidatos', '/banco-candidatos'],
    ['/personal/instrumentos', '/personal/instrumentos'],
    ['/portal/pruebas', '/portal/pruebas'],
    ['/personal/servicios', '/personal/servicios'],
    ['/personal/empresas', '/personal/empresas'],
    ['/empresa/servicios', '/empresa/servicios'],
    ['/empresa/donativos', '/empresa/donativos'],
  ].find(([prefix]) => pathname.startsWith(prefix));
  return (
    <PilotFrame
      publicPage={[
        '/',
        '/ingresar',
        '/registro',
        '/servicios/solicitud',
        '/servicios/consulta',
        '/banco-candidatos',
        '/servicios-empresariales',
      ].some((path) => matchPath({ path, end: true }, pathname) !== null)}
      continueTo={
        user
          ? sessionHome({
              ...user,
              can_manage_services: staffServices,
              company_manager: companyServices,
            })
          : undefined
      }
      navigation={{
        brand: <InstitutionalBrand />,
        items: links.map(([key, label]) => ({
          key,
          icon:
            key === '/' ? (
              <HomeOutlined />
            ) : key === '/admin/dashboard' ? (
              <BarChartOutlined />
            ) : key === '/admin/auditoria' ? (
              <AuditOutlined />
            ) : key === '/admin/usuarios' ? (
              <TeamOutlined />
            ) : key === '/admin/roles' ? (
              <SafetyCertificateOutlined />
            ) : key === '/personal/empresas' ? (
              <BankOutlined />
            ) : key.startsWith('/personal') ? (
              <InboxOutlined />
            ) : key === '/empresa/donativos' ? (
              <DollarOutlined />
            ) : key.startsWith('/empresa') ? (
              <SolutionOutlined />
            ) : key.includes('#documentos') ? (
              <FolderOpenOutlined />
            ) : key.includes('#observaciones') ? (
              <FileTextOutlined />
            ) : key.startsWith('/expedientes-anteriores') ? (
              <HistoryOutlined />
            ) : key === '/ingresar' ? (
              <LoginOutlined />
            ) : key === '/registro' ? (
              <UserAddOutlined />
            ) : (
              <FileTextOutlined />
            ),
          label: <Link to={key}>{label}</Link>,
        })),
        publicLinks: [
          { to: '/banco-candidatos', label: 'Banco de candidatos' },
          { to: '/servicios/solicitud', label: 'Solicitar servicio' },
          { to: '/servicios-empresariales', label: 'Servicios para empresas' },
        ],
        selected: selected
          ? selected[1]
          : pathname.startsWith('/personal')
            ? '/personal/inscripciones'
            : pathname.startsWith('/portal')
              ? '/portal/inscripcion' + hash
              : pathname,
        actions: user ? (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'identity',
                  label: <Typography.Text strong>{user.name}</Typography.Text>,
                  disabled: true,
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  label: 'Cerrar sesión',
                  icon: <LogoutOutlined />,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'logout') void session.logout();
              },
            }}
          >
            <Button
              className="pilot-account-menu"
              aria-label={'Menú de cuenta de ' + user.name}
              type="text"
            >
              <UserAvatar
                fullName={user.name}
                mark
                size="middle"
                verified={false}
                textWidth="auto"
                className="pilot-account-avatar"
              />
              <DownOutlined />
            </Button>
          </Dropdown>
        ) : null,
      }}
    >
      <Outlet />
    </PilotFrame>
  );
}
export function SessionStatus() {
  const { status, session } = usePilotSession();
  // Una sesión autenticada puede estar resolviendo el destino empresarial; no es un error.
  if (status === 'loading' || status === 'authenticated')
    return (
      <Flex gap={16} role="status">
        <Spin />
        <span>Comprobando tu sesión…</span>
      </Flex>
    );
  const logoutFailure = status === 'logout-error';
  return (
    <Alert
      showIcon
      type={logoutFailure ? 'warning' : 'error'}
      title={
        logoutFailure
          ? 'No se pudo confirmar el cierre de sesión.'
          : status === 'disabled'
            ? 'Cuenta no habilitada para este acceso.'
            : 'No se pudo verificar la sesión.'
      }
      description={
        logoutFailure
          ? 'Tu información dejó de mostrarse en este dispositivo. Reintentá cerrar sesión para completar la salida.'
          : 'Para ver tu información, necesitamos volver a comprobar tu sesión.'
      }
      action={
        <Button
          onClick={() =>
            void (status === 'network-error'
              ? session.boot()
              : session.logout())
          }
        >
          {status === 'network-error'
            ? 'Reintentar'
            : 'Reintentar cierre de sesión'}
        </Button>
      }
    />
  );
}
export function PilotGuard({
  capability,
  permission,
}: {
  capability?: 'is_graduate' | 'can_review_talent';
  permission?: string | string[];
}) {
  const { user, status, generation } = usePilotSession();
  if (status === 'anonymous') return <Navigate to="/ingresar" replace />;
  if (status !== 'authenticated' || !user?.pilot_enabled)
    return <SessionStatus />;
  if (capability && user[capability] !== true)
    return (
      <Alert
        type="warning"
        title="Esta cuenta no tiene acceso a esta sección."
      />
    );
  if (permission) {
    const required = Array.isArray(permission) ? permission : [permission];
    if (!hasAnyPermission(user, required)) {
      return (
        <Alert
          type="warning"
          title="Esta cuenta no tiene permiso para acceder a esta sección."
        />
      );
    }
  }
  return <Outlet key={user.id + ':' + generation} />;
}
