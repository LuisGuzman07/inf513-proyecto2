import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom';
import {
  AccountDeactivePage,
  BiddingDashboardPage,
  CorporateAboutPage,
  CorporateContactPage,
  CorporateFaqPage,
  CorporateLicensePage,
  CorporatePricingPage,
  CorporateTeamPage,
  DefaultDashboardPage,
  EcommerceDashboardPage,
  Error400Page,
  Error403Page,
  Error404Page,
  Error500Page,
  Error503Page,
  ErrorPage,
  GalleryPage,
  HomePage,
  MarketingDashboardPage,
  OtpAuthPage,
  PasswordResetPage,
  ProjectsDashboardPage,
  ReleasesPage,
  SettingsPage,
  SignInPage,
  SignUpPage,
  SitemapPage,
  SocialDashboardPage,
  UserProfileActionsPage,
  UserProfileActivityPage,
  UserProfileDetailsPage,
  UserProfileFeedbackPage,
  UserProfileHelpPage,
  UserProfileInformationPage,
  UserProfilePreferencesPage,
  UserProfileSecurityPage,
  VerifyEmailPage,
  WelcomePage,
  LearningDashboardPage,
  LogisticsDashboardPage,
  AnalyticsDashboardPage,
  HealthcareDashboardPage,
  FinanceDashboardPage,
} from '../pages';
import {
  CorporateLayout,
  DashboardLayout,
  GuestLayout,
  UserAccountLayout,
} from '../layouts';
import React, { ReactNode, useEffect } from 'react';
import { AboutPage } from '../pages/about.tsx';
import { ProtectedRoute } from '../utils/ProtectedRoute';
import ReactGA from 'react-ga4';
import TechnicalStatusPage from '../pages/technical-status';
import { PilotGuard, PilotSessionProvider } from '../pilot/layout';
import { PilotLogin } from '../pilot/login';
import { RecordListPage, RecordPage } from '../pilot/records';
import { PortalHome } from '../pilot/records';
import { ConsolidatedProfilePage } from '../pilot/profile';
import { CandidatePoolPage } from '../pilot/candidate-pool';
import { CorporateServicesPage } from '../pilot/corporate-services';
import { PublicHome, RegisterPage } from '../pilot/public';
import {
  ConsultaServicioPage,
  SolicitudServicioPage,
} from '../pilot/services-public';
import {
  ServiceRequestCreatePage,
  ServiceRequestListPage,
  ServiceRequestPage,
} from '../pilot/services-panel';
import { ServiceAreaGuard } from '../pilot/services-guard';
import {
  EvaluationPage,
  EvaluationsPage,
  InstrumentBankPage,
  InstrumentDetailPage,
} from '../pilot/evaluations';
import { AdminRolesPage, AdminUsersPage } from '../pilot/admin-rbac';
import { AdminAuditPage, AdminDashboardPage } from '../pilot/admin-monitoring';
import { AdminCompaniesPage } from '../pilot/admin-companies';
import { CompanyDonationsPage } from '../pilot/company-donations';
import { Alert } from 'antd';

// Custom scroll restoration function
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    }); // Scroll to the top when the location changes
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: 'pageview', page: pathname });
    }
  }, [pathname]);

  return null; // This component doesn't render anything
};

type PageProps = {
  children: ReactNode;
};

// Create an HOC to wrap your route components with ScrollToTop
const PageWrapper = ({ children }: PageProps) => {
  return (
    <>
      <Alert
        type="warning"
        title="DEMO — ejemplos de la plantilla"
        description="Usá únicamente datos ficticios en estos ejemplos."
      />
      <ScrollToTop />
      {children}
    </>
  );
};

// Create the router
const router = createBrowserRouter([
  {
    element: <PilotSessionProvider />,
    children: [
      { path: '/', element: <PublicHome /> },
      { path: '/banco-candidatos', element: <CandidatePoolPage /> },
      { path: '/servicios-empresariales', element: <CorporateServicesPage /> },
      { path: '/ingresar', element: <PilotLogin /> },
      { path: '/registro', element: <RegisterPage /> },
      { path: '/servicios/solicitud', element: <SolicitudServicioPage /> },
      { path: '/servicios/consulta', element: <ConsultaServicioPage /> },
      {
        element: <ServiceAreaGuard area="company" />,
        children: [
          {
            path: '/empresa/servicios',
            element: <ServiceRequestListPage area="company" />,
          },
          {
            path: '/empresa/servicios/nueva',
            element: <ServiceRequestCreatePage area="company" />,
          },
          {
            path: '/empresa/servicios/:id',
            element: <ServiceRequestPage area="company" />,
          },
        ],
      },
      {
        element: <ServiceAreaGuard area="staff" />,
        children: [
          {
            path: '/personal/servicios',
            element: <ServiceRequestListPage area="staff" />,
          },
          {
            path: '/personal/servicios/nueva',
            element: <ServiceRequestCreatePage area="staff" />,
          },
          {
            path: '/personal/servicios/:id',
            element: <ServiceRequestPage area="staff" />,
          },
        ],
      },
      {
        element: <PilotGuard />,
        children: [
          {
            path: '/expedientes-anteriores',
            element: <RecordListPage legacy />,
          },
          {
            path: '/expedientes-anteriores/:id',
            element: <RecordPage legacy />,
          },
        ],
      },
      {
        element: <PilotGuard capability="is_graduate" />,
        children: [
          { path: '/portal/pruebas', element: <EvaluationsPage /> },
          { path: '/portal/pruebas/:assignment', element: <EvaluationPage /> },
          { path: '/portal/inscripcion', element: <PortalHome /> },
          { path: '/portal/inscripciones/:id', element: <RecordPage /> },
          {
            path: '/portal/inscripciones/:id/editar',
            element: <RecordPage edit />,
          },
        ],
      },
      {
        element: <PilotGuard capability="can_review_talent" />,
        children: [
          { path: '/personal/banco-candidatos', element: <CandidatePoolPage /> },
          { path: '/personal/instrumentos', element: <InstrumentBankPage /> },
          {
            path: '/personal/instrumentos/:version',
            element: <InstrumentDetailPage />,
          },
          {
            path: '/personal/inscripciones',
            element: <RecordListPage staff />,
          },
          {
            path: '/personal/inscripciones/:id',
            element: <RecordPage staff />,
          },
          {
            path: '/personal/inscripciones/:id/perfil',
            element: <ConsolidatedProfilePage />,
          },
        ],
      },
      {
        element: (
          <PilotGuard
            permission={['servicios.gestionar', 'admin.usuarios.gestionar']}
          />
        ),
        children: [{ path: '/personal/empresas', element: <AdminCompaniesPage /> }],
      },
      {
        element: <PilotGuard permission="empresa.donativos.gestionar" />,
        children: [
          { path: '/empresa/donativos', element: <CompanyDonationsPage /> },
        ],
      },
      {
        element: <PilotGuard permission="admin.usuarios.gestionar" />,
        children: [{ path: '/admin/usuarios', element: <AdminUsersPage /> }],
      },
      {
        element: (
          <PilotGuard
            permission={['admin.roles.gestionar', 'admin.permisos.gestionar']}
          />
        ),
        children: [{ path: '/admin/roles', element: <AdminRolesPage /> }],
      },
      {
        element: <PilotGuard permission="admin.dashboard.ver" />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
        ],
      },
      {
        element: <PilotGuard permission="admin.auditoria.ver" />,
        children: [{ path: '/admin/auditoria', element: <AdminAuditPage /> }],
      },
    ],
  },
  {
    path: '/estado-tecnico',
    element: <TechnicalStatusPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/ejemplos',
    element: <PageWrapper children={<GuestLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/ejemplos/dashboards',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<DashboardLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'default',
        element: <DefaultDashboardPage />,
      },
      {
        path: 'projects',
        element: <ProjectsDashboardPage />,
      },
      {
        path: 'ecommerce',
        element: <EcommerceDashboardPage />,
      },
      {
        path: 'marketing',
        element: <MarketingDashboardPage />,
      },
      {
        path: 'social',
        element: <SocialDashboardPage />,
      },
      {
        path: 'bidding',
        element: <BiddingDashboardPage />,
      },
      {
        path: 'learning',
        element: <LearningDashboardPage />,
      },
      {
        path: 'logistics',
        element: <LogisticsDashboardPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsDashboardPage />,
      },
      {
        path: 'healthcare',
        element: <HealthcareDashboardPage />,
      },
      {
        path: 'finance',
        element: <FinanceDashboardPage />,
      },
    ],
  },
  {
    path: '/ejemplos/sitemap',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<DashboardLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <SitemapPage />,
      },
    ],
  },
  {
    path: '/ejemplos/corporate',
    element: <PageWrapper children={<CorporateLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'about',
        element: <CorporateAboutPage />,
      },
      {
        path: 'team',
        element: <CorporateTeamPage />,
      },
      {
        path: 'faqs',
        element: <CorporateFaqPage />,
      },
      {
        path: 'contact',
        element: <CorporateContactPage />,
      },
      {
        path: 'pricing',
        element: <CorporatePricingPage />,
      },
      {
        path: 'license',
        element: <CorporateLicensePage />,
      },
    ],
  },
  {
    path: '/ejemplos/user-profile',
    element: (
      <ProtectedRoute>
        <PageWrapper children={<UserAccountLayout />} />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'details',
        element: <UserProfileDetailsPage />,
      },
      {
        path: 'preferences',
        element: <UserProfilePreferencesPage />,
      },
      {
        path: 'information',
        element: <UserProfileInformationPage />,
      },
      {
        path: 'security',
        element: <UserProfileSecurityPage />,
      },
      {
        path: 'activity',
        element: <UserProfileActivityPage />,
      },
      {
        path: 'actions',
        element: <UserProfileActionsPage />,
      },
      {
        path: 'help',
        element: <UserProfileHelpPage />,
      },
      {
        path: 'feedback',
        element: <UserProfileFeedbackPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '/ejemplos/auth',
    element: (
      <PageWrapper>
        <Outlet />
      </PageWrapper>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'signup',
        element: (
          <ProtectedRoute requireAuth={false}>
            <SignUpPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'signin',
        element: (
          <ProtectedRoute requireAuth={false}>
            <SignInPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'welcome',
        element: <WelcomePage />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'password-reset',
        element: <PasswordResetPage />,
      },
      {
        path: 'otp-auth',
        element: <OtpAuthPage />,
      },
      {
        path: 'account-delete',
        element: <AccountDeactivePage />,
      },
    ],
  },
  {
    path: '/ejemplos/errors',
    element: (
      <PageWrapper>
        <Outlet />
      </PageWrapper>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: '400',
        element: <Error400Page />,
      },
      {
        path: '403',
        element: <Error403Page />,
      },
      {
        path: '404',
        element: <Error404Page />,
      },
      {
        path: '500',
        element: <Error500Page />,
      },
      {
        path: '503',
        element: <Error503Page />,
      },
    ],
  },
  {
    path: '/ejemplos/about',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <AboutPage />,
      },
    ],
  },
  {
    path: '/ejemplos/gallery',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <GalleryPage />,
      },
    ],
  },
  {
    path: '/ejemplos/releases',
    element: <PageWrapper children={<GuestLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <ReleasesPage />,
      },
    ],
  },
], {
  basename: typeof __APP_BASE__ !== 'undefined' ? __APP_BASE__ : '/',
});

// eslint-disable-next-line react-refresh/only-export-components
export default router;
