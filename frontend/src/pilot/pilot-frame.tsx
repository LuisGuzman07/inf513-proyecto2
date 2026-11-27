import { MenuOutlined } from '@ant-design/icons';
import { Button, Drawer, Grid, Layout, Menu, type MenuProps } from 'antd';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminRbacApi, type VisitSummary } from './admin-api';
import { AppearanceControl } from './appearance';
import { GlobalSearchBar } from './global-search';
import { institutionalAssets } from './identity';

export function PilotFrame({
  children,
  navigation,
  publicPage,
  continueTo,
}: {
  children: ReactNode;
  navigation: {
    brand: ReactNode;
    items: MenuProps['items'];
    publicLinks?: { to: string; label: string }[];
    selected: string;
    actions: ReactNode;
  };
  publicPage: boolean;
  continueTo?: string;
}) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visits, setVisits] = useState<VisitSummary | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash, mobile]);
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    void adminRbacApi
      .recordVisit(location.pathname)
      .then(setVisits)
      .catch(() => {});
  }, [location.pathname]);
  const brand = (
    <div className="pilot-frame-brand">
      <img {...institutionalAssets.university} className="pilot-frame-crest" />
      {navigation.brand}
    </div>
  );
  const menu = (
    <nav aria-label="Navegación principal">
      <Menu
        className="pilot-frame-menu"
        theme="dark"
        mode="inline"
        selectedKeys={[navigation.selected]}
        items={navigation.items}
        onClick={() => setDrawerOpen(false)}
      />
    </nav>
  );
  const context =
    navigation.selected === '/admin/usuarios'
      ? 'Administración de usuarios'
      : navigation.selected === '/admin/roles'
        ? 'Roles y permisos'
        : navigation.selected === '/admin/dashboard'
          ? 'Dashboard de estadísticas'
          : navigation.selected === '/admin/auditoria'
            ? 'Bitácora de auditoría'
            : navigation.selected === '/personal/instrumentos'
      ? 'Banco de instrumentos'
      : navigation.selected === '/personal/servicios'
        ? 'Bandeja de servicios'
        : navigation.selected === '/empresa/servicios'
          ? 'Solicitudes de mi empresa'
          : navigation.selected === '/empresa/donativos'
            ? 'Donativos empresariales'
            : navigation.selected === '/portal/pruebas'
            ? 'Mis pruebas'
            : navigation.selected.endsWith('#documentos')
              ? 'Documentos'
              : navigation.selected.endsWith('#observaciones')
                ? 'Observaciones'
                : location.pathname.startsWith('/personal')
                  ? 'Bandeja de inscripciones'
                  : location.pathname.startsWith('/portal')
                    ? 'Mi inscripción'
                    : 'Expedientes anteriores';
  return (
    <Layout
      className={
        'pilot-frame ' +
        (publicPage ? 'pilot-frame-public' : 'pilot-frame-private')
      }
    >
      {!publicPage && !mobile ? (
        <Layout.Sider width={264} className="pilot-frame-sidebar">
          {brand}
          {menu}
          <div className="pilot-frame-note">Grupo 18B · Entorno académico</div>
        </Layout.Sider>
      ) : null}
      <Layout className="pilot-frame-main">
        <Layout.Header className="pilot-frame-header">
          {publicPage ? (
            <>
              {brand}
              <nav
                className="pilot-frame-public-nav"
                aria-label="Navegación pública"
              >
                <Link
                  to="/"
                  aria-current={location.pathname === '/' ? 'page' : undefined}
                >
                  Inicio
                </Link>
                {(navigation.publicLinks ?? []).map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={
                      location.pathname === link.to ? 'page' : undefined
                    }
                  >
                    {link.label}
                  </Link>
                ))}
                {continueTo ? (
                  <Link to={continueTo}>Continuar</Link>
                ) : (
                  <>
                    <Link
                      to="/ingresar"
                      aria-current={
                        location.pathname === '/ingresar' ? 'page' : undefined
                      }
                    >
                      Ingresar
                    </Link>
                    <Link
                      to="/registro"
                      aria-current={
                        location.pathname === '/registro' ? 'page' : undefined
                      }
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </nav>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GlobalSearchBar />
                <AppearanceControl />
              </div>
            </>
          ) : (
            <>
              <div className="pilot-frame-context">
                {mobile ? (
                  <Button
                    aria-label="Abrir navegación"
                    aria-expanded={drawerOpen}
                    aria-controls="pilot-mobile-navigation"
                    icon={<MenuOutlined />}
                    onClick={() => setDrawerOpen(true)}
                  />
                ) : null}
                <span>{context}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GlobalSearchBar />
                <AppearanceControl />
                {navigation.actions}
              </div>
            </>
          )}
        </Layout.Header>
        <Layout.Content
          ref={contentRef}
          id="main-content"
          tabIndex={-1}
          className="template-app-content pilot-frame-content"
        >
          {children}
        </Layout.Content>
        <Layout.Footer
          style={{
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 12,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <span>Grupo 24SA · FCEE - UAGRM · Selección de Personal</span>
          <span aria-live="polite">
            {visits
              ? `Esta página: ${(visits.path_visits ?? 0).toLocaleString('es-BO')} · Hoy: ${visits.today_visits.toLocaleString('es-BO')} · Total: ${visits.total_visits.toLocaleString('es-BO')}`
              : 'Visitas: —'}
          </span>
        </Layout.Footer>
      </Layout>
      {!publicPage && mobile ? (
        <Drawer
          title="Navegación"
          placement="left"
          size={264}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={{ 'aria-label': 'Cerrar navegación' }}
          className="pilot-frame-drawer"
        >
          <div id="pilot-mobile-navigation">
            {brand}
            {menu}
          </div>
        </Drawer>
      ) : null}
    </Layout>
  );
}
