import { RouteObject } from 'react-router';
import { lazy } from 'react';
import HomePage from './pages/index';
import ProdNotFoundPage from './pages/_404';
import { AdminGuard } from './components/auth/RouteGuards';

const NotFoundPage = ProdNotFoundPage;

const PricingPage = lazy(() => import('./pages/pricing'));
const JobsPage = lazy(() => import('./pages/jobs'));
const ForCompaniesPage = lazy(() => import('./pages/for-companies'));
const VeteransPage = lazy(() => import('./pages/veterans'));
const TermsPage          = lazy(() => import('./pages/terms'));
const PrivacyPage        = lazy(() => import('./pages/privacy'));
const CommunityRulesPage = lazy(() => import('./pages/community-rules'));
const CompanyAccountPage = lazy(() => import('./pages/company/account'));
const VerifyCompanyStep1 = lazy(() => import('./pages/verify-company/index'));
const VerifyCompanyStep2 = lazy(() => import('./pages/verify-company/details'));
const AdminCompaniesPage = lazy(() => import('./pages/admin/companies'));
const TrustPage = lazy(() => import('./pages/trust'));
const AthletesPage = lazy(() => import('./pages/athletes'));
const CoachesPage  = lazy(() => import('./pages/coaches'));
const SignupPage    = lazy(() => import('./pages/signup'));
const LoginPage        = lazy(() => import('./pages/login'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const ResetPasswordPage  = lazy(() => import('./pages/reset-password'));
const SavedJobsPage      = lazy(() => import('./pages/saved-jobs'));
const ResumeBuilderPage  = lazy(() => import('./pages/resume-builder'));
const InterviewTipsPage  = lazy(() => import('./pages/interview-tips'));
const ResourcesPage      = lazy(() => import('./pages/resources'));
const AboutPage          = lazy(() => import('./pages/about'));
const InclusionCoursePage = lazy(() => import('./pages/inclusion-course'));
const EventsPage         = lazy(() => import('./pages/events'));
const AdminEventsPage    = lazy(() => import('./pages/admin/events'));
const CompanyEventsPage  = lazy(() => import('./pages/company/events'));
const DashboardPage         = lazy(() => import('./pages/dashboard'));
const CompanyDashboardPage  = lazy(() => import('./pages/company/dashboard'));
const CompanyJobsPage       = lazy(() => import('./pages/company/jobs'));
const CompanyCandidatesPage = lazy(() => import('./pages/company/candidates'));
const ProfileEditPage  = lazy(() => import('./pages/profile/edit'));
const ProfileViewPage  = lazy(() => import('./pages/profile/[userId]'));
const MessagesPage      = lazy(() => import('./pages/messages'));
const AdminMessagesPage = lazy(() => import('./pages/admin/messages'));
const AdminOverviewPage = lazy(() => import('./pages/admin/index'));
const AdminCompanyListPage = lazy(() => import('./pages/admin/company-list'));
const AdminMembersPage = lazy(() => import('./pages/admin/members'));
const AdminReportsPage = lazy(() => import('./pages/admin/reports'));
const AdminActivityPage = lazy(() => import('./pages/admin/activity'));
const SettingsPage = lazy(() => import('./pages/settings'));
const CheckoutSuccess = lazy(() => import('./pages/checkout/success'));
const CheckoutCancel = lazy(() => import('./pages/checkout/cancel'));

export type Path =
  | '/'
  | '/jobs'
  | '/resources'
  | '/about'
  | '/inclusion-course'
  | '/events'
  | '/admin/events'
  | '/company/events'
  | '/for-companies'
  | '/veterans'
  | '/terms'
  | '/privacy'
  | '/community-rules'
  | '/pricing'
  | '/company/account'
  | '/verify-company'
  | '/verify-company/details'
  | '/admin/companies'
  | '/checkout/success'
  | '/checkout/cancel'
  | '/athletes'
  | '/coaches'
  | '/signup'
  | '/login'
  | '/dashboard'
  | '/company/dashboard'
  | '/company/jobs'
  | '/company/candidates'
  | '/profile/edit'
  | '/messages'
  | '/admin/messages'
  | '/admin'
  | '/admin/company-list'
  | '/admin/members'
  | '/admin/reports'
  | '/admin/activity'
  | '/settings'
  | '/trust'
  | '/forgot-password'
  | '/reset-password'
  | '/profile/:userId'
  | '/saved-jobs'
  | '/resume-builder'
  | '/interview-tips';

export type Params = Record<string, string | undefined>;

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/jobs', element: <JobsPage /> },
  { path: '/saved-jobs', element: <SavedJobsPage /> },
  { path: '/resume-builder', element: <ResumeBuilderPage /> },
  { path: '/interview-tips', element: <InterviewTipsPage /> },
  { path: '/resources', element: <ResourcesPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/inclusion-course', element: <InclusionCoursePage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '/admin/events', element: <AdminEventsPage /> },
  { path: '/company/events', element: <CompanyEventsPage /> },
  { path: '/for-companies', element: <ForCompaniesPage /> },
  { path: '/veterans', element: <VeteransPage /> },
  { path: '/terms',            element: <TermsPage /> },
  { path: '/privacy',          element: <PrivacyPage /> },
  { path: '/community-rules',  element: <CommunityRulesPage /> },
  { path: '/pricing', element: <PricingPage /> },
  { path: '/company/account', element: <CompanyAccountPage /> },
  { path: '/verify-company', element: <VerifyCompanyStep1 /> },
  { path: '/verify-company/details', element: <VerifyCompanyStep2 /> },
  { path: '/admin/companies', element: <AdminGuard><AdminCompaniesPage /></AdminGuard> },
  { path: '/trust', element: <TrustPage /> },
  { path: '/athletes', element: <AthletesPage /> },
  { path: '/coaches',  element: <CoachesPage /> },
  { path: '/signup',    element: <SignupPage /> },
  { path: '/login',          element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },
  { path: '/dashboard',          element: <DashboardPage /> },
  { path: '/company/dashboard', element: <CompanyDashboardPage /> },
  { path: '/company/jobs',      element: <CompanyJobsPage /> },
  { path: '/company/candidates', element: <CompanyCandidatesPage /> },
  { path: '/messages', element: <MessagesPage /> },
  { path: '/admin/messages', element: <AdminGuard><AdminMessagesPage /></AdminGuard> },
  { path: '/admin', element: <AdminGuard><AdminOverviewPage /></AdminGuard> },
  { path: '/admin/company-list', element: <AdminGuard><AdminCompanyListPage /></AdminGuard> },
  { path: '/admin/members', element: <AdminGuard><AdminMembersPage /></AdminGuard> },
  { path: '/admin/reports', element: <AdminGuard><AdminReportsPage /></AdminGuard> },
  { path: '/admin/activity', element: <AdminGuard><AdminActivityPage /></AdminGuard> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/profile/edit',   element: <ProfileEditPage /> },
  { path: '/profile/:userId', element: <ProfileViewPage /> },
  { path: '/checkout/success', element: <CheckoutSuccess /> },
  { path: '/checkout/cancel', element: <CheckoutCancel /> },
  { id: 'airo-not-found', path: '*', element: <NotFoundPage /> },
];
