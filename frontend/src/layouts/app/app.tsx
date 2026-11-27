import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Breadcrumb,
  Button,
  Drawer,
  Flex,
  Grid,
  Layout,
  Menu,
  Spin,
  Typography,
  theme,
  type MenuProps,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import SideNav, { SIDER_WIDTH, SIDER_COLLAPSED_WIDTH } from './side-nav';
import HeaderNav from './header-nav';
import FooterNav from './footer-nav';
import './app.css';

const DemoAppLayout = lazy(() =>
  import('./app-demo').then((module) => ({ default: module.DemoAppLayout }))
);
export type AppNavigation = {
  brand: ReactNode;
  items: MenuProps['items'];
  selected: string;
  actions: ReactNode;
  sidebar: boolean;
};

// Customize the template's original fixed sidebar/header/scrolling content/footer
// composition here. Real navigation/session data comes only from the caller.
export function AppLayout({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation?: AppNavigation;
}) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navFill, setNavFill] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { token } = theme.useToken();
  useEffect(() => {
    setCollapsed(isMobile);
    setDrawerOpen(false);
  }, [isMobile]);
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const onScroll = () => setNavFill(content.scrollTop > 5);
    content.addEventListener('scroll', onScroll, { passive: true });
    return () => content.removeEventListener('scroll', onScroll);
  }, [navigation?.sidebar]);
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [location.pathname]);

  if (!navigation)
    return (
      <Suspense fallback={<Spin />}>
        <DemoAppLayout>{children}</DemoAppLayout>
      </Suspense>
    );
  const sidebarWidth =
    navigation.sidebar && !isMobile
      ? collapsed
        ? SIDER_COLLAPSED_WIDTH
        : SIDER_WIDTH
      : 0;
  const sidebarMargin = sidebarWidth + 'px';
  const crumbs = [
    { title: <Link to="/">Inicio</Link> },
    ...(location.pathname.startsWith('/personal')
      ? [
          {
            title: (
              <Link to="/personal/inscripciones">Bandeja de inscripciones</Link>
            ),
          },
          ...(location.pathname !== '/personal/inscripciones'
            ? [{ title: 'Detalle de revisión' }]
            : []),
        ]
      : location.pathname.startsWith('/portal')
        ? [
            { title: <Link to="/portal/inscripcion">Mi inscripción</Link> },
            ...(location.pathname.endsWith('/editar')
              ? [{ title: 'Editar inscripción' }]
              : []),
          ]
        : location.pathname.startsWith('/expedientes-anteriores')
          ? [{ title: 'Expedientes anteriores' }]
          : location.pathname === '/ingresar'
            ? [{ title: 'Ingresar' }]
            : location.pathname === '/registro'
              ? [{ title: 'Crear mi cuenta' }]
              : []),
  ];
  const menu = (
    <Menu
      mode={navigation.sidebar || isMobile ? 'inline' : 'horizontal'}
      selectedKeys={[navigation.selected]}
      items={navigation.items}
      onClick={() => setDrawerOpen(false)}
    />
  );
  return (
    <Layout
      className="template-app-layout"
      style={
        {
          '--template-sidebar-margin': sidebarMargin,
          background: token.colorBgLayout,
        } as CSSProperties
      }
    >
      {navigation.sidebar && !isMobile ? (
        <SideNav
          className="template-app-sidebar"
          trigger={null}
          theme="light"
          collapsible
          collapsed={collapsed}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          width={SIDER_WIDTH}
          onCollapse={setCollapsed}
          navigation={{
            brand: <Typography.Text strong>Área de revisión</Typography.Text>,
            items: navigation.items,
            selected: navigation.selected,
          }}
        />
      ) : null}
      <Layout className="template-app-main">
        <HeaderNav
          className="template-app-header"
          data-scrolled={navFill || undefined}
          style={{ background: token.colorBgContainer }}
        >
          <Flex vertical gap={8} className="template-app-header-identity">
            <Flex align="center" gap={8}>
              {isMobile ? (
                <Button
                  aria-label="Abrir navegación"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerOpen(true)}
                />
              ) : navigation.sidebar ? (
                <Button
                  type="text"
                  aria-label={
                    collapsed ? 'Expandir navegación' : 'Contraer navegación'
                  }
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => setCollapsed((value) => !value)}
                />
              ) : null}
              {navigation.brand}
            </Flex>
            {location.pathname !== '/' ? <Breadcrumb items={crumbs} /> : null}
          </Flex>
          {navigation.actions}
        </HeaderNav>
        {!navigation.sidebar && !isMobile ? (
          <nav
            className="template-app-navigation"
            aria-label="Navegación principal"
          >
            {menu}
          </nav>
        ) : null}
        <Layout.Content
          ref={contentRef}
          id="main-content"
          tabIndex={-1}
          className="template-app-content"
        >
          {children}
        </Layout.Content>
        <FooterNav className="template-app-footer">
          Grupo 18B · Tecnología Web · UAGRM
        </FooterNav>
      </Layout>
      <Drawer
        title="Navegación"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
