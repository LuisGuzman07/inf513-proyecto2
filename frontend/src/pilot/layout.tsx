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
  DownOutlined,
  LogoutOutlined,
  HomeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  HistoryOutlined,
  LoginOutlined,
  SolutionOutlined,
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
import { institutionalTheme } from './design';
import './styles.css';
import './brand.css';
import './figma-shell.css';
import { InstitutionalBrand } from './brand';
import { institutionalVariables } from './identity';
import { companyAccess, useServiceAccess } from './services-access';
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
        <ConfigProvider locale={esES} theme={institutionalTheme}>
          <App className="pilot-identity" style={institutionalVariables}>
            <PilotLayout />
          </App>
        </ConfigProvider>
      </QueryClientProvider>
    </PilotSessionContext.Provider>
  );
}
function PilotLayout() {
  const { user, session } = usePilotSession();
  const { pathname, hash } = useLocation();
  const access = useServiceAccess(Boolean(user));
  const staffServices = user ? access.data?.staff === true : false;
  const companyServices = user ? companyAccess(access.data) : false;
  const links = [
    ['/', 'Inicio'],
    ...(user
      ? [
          ...(user.is_graduate
            ? [
                ['/portal/inscripcion', 'Mi inscripción'],
                ['/portal/pruebas', 'Mis pruebas'],
                ['/portal/inscripcion#documentos', 'Documentos'],
                ['/portal/inscripcion#observaciones', 'Observaciones'],
              ]
            : []),
          ...(user.can_review_talent
            ? [
                ['/personal/inscripciones', 'Bandeja de inscripciones'],
                ['/personal/banco-candidatos', 'Banco de candidatos'],
                ['/personal/instrumentos', 'Banco de instrumentos'],
              ]
            : []),
          ...(staffServices
            ? [['/personal/servicios', 'Bandeja de servicios']]
            : []),
          ...(companyServices
            ? [
                ['/banco-candidatos', 'Banco de candidatos'],
                ['/empresa/servicios', 'Solicitudes de mi empresa'],
              ]
            : []),
          ['/expedientes-anteriores', 'Expedientes anteriores'],
        ]
      : [
          ['/banco-candidatos', 'Banco de candidatos'],
          ['/ingresar', 'Ingresar'],
          ['/registro', 'Registrarse'],
        ]),
  ];
  const selected = [
    ['/personal/banco-candidatos', '/personal/banco-candidatos'],
    ['/banco-candidatos', '/banco-candidatos'],
    ['/personal/instrumentos', '/personal/instrumentos'],
    ['/portal/pruebas', '/portal/pruebas'],
    ['/personal/servicios', '/personal/servicios'],
    ['/empresa/servicios', '/empresa/servicios'],
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
            ) : key.startsWith('/personal') ? (
              <InboxOutlined />
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
}: {
  capability?: 'is_graduate' | 'can_review_talent';
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
  return <Outlet key={user.id + ':' + generation} />;
}
