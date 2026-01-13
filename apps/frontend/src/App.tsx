import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TranslationProvider } from '@/hooks/useTranslation';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import LocalSignup from "./pages/signup/LocalSignUp";
import Login from "./pages/login/Login";
import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";
import NotFound from "./pages/NotFound";
import Goals from "./pages/goals/Goals";
import GoalsList from "./pages/goals/GoalsList";
import GoalDetails from "./pages/goals/GoalDetails";
//import ConfirmEmail from "./pages/ConfirmEmail";
import { SessionKeepAlive } from '@/lib/session';
import { ProtectedRoute, AuthWatcher } from '@/lib/auth';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ChangePassword from './pages/account/ChangePassword';
import ProfileView from './pages/profile/ProfileView';
import ProfileEdit from './pages/profile/ProfileEdit';
import QuestCreatePage from './pages/quests/QuestCreate';
import QuestDetailsPage from './pages/quests/QuestDetails';
import QuestEditPage from './pages/quests/QuestEdit';
import QuestDashboard from './pages/quests/QuestDashboard';
import QuestTemplateCreate from './pages/quests/QuestTemplateCreate';
import QuestTemplateDetails from './pages/quests/QuestTemplateDetails';
import QuestChallenges from './pages/quests/QuestChallenges';
import QuestActivity from './pages/quests/QuestActivity';
import Invites from './pages/collaborations/Invites';
import MyCollaborations from './pages/collaborations/MyCollaborations';
import { MyGuilds, CreateGuild, GuildDetails, GuildAnalytics, GuildRankings } from './pages/guilds';
import GuildEditPage from './pages/guilds/GuildEdit';
import ChatPage from './pages/chat/ChatPage';
import SubscriptionPlans from './pages/subscription/SubscriptionPlans';
import SubscriptionManagement from './pages/subscription/SubscriptionManagement';
import CheckoutSuccess from './pages/subscription/CheckoutSuccess';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ApiDocs from './pages/info/ApiDocs';
import About from './pages/info/About';
import Blog from './pages/info/Blog';
import BlogPost from './pages/info/BlogPost';
import Careers from './pages/info/Careers';
import JobApplication from './pages/info/JobApplication';
import Help from './pages/info/Help';
import HelpArticle from './pages/info/HelpArticle';
import Status from './pages/info/Status';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionKeepAlive />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthWatcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><AuthenticatedLayout><Dashboard /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AuthenticatedLayout><ProfileView /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><AuthenticatedLayout><ProfileEdit /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><AuthenticatedLayout><GoalsList /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals/list" element={<ProtectedRoute><AuthenticatedLayout><GoalsList /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals/create" element={<ProtectedRoute><AuthenticatedLayout><Goals /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals/edit/:id" element={<ProtectedRoute><AuthenticatedLayout><Goals /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals/details/:id" element={<ProtectedRoute><AuthenticatedLayout><GoalDetails /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals/:id" element={<ProtectedRoute><AuthenticatedLayout><Goals /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/goals/:id/tasks" element={<ProtectedRoute><AuthenticatedLayout><Goals /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests" element={<ProtectedRoute><AuthenticatedLayout><Navigate to="/quests/dashboard" replace /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/dashboard" element={<ProtectedRoute><AuthenticatedLayout><ErrorBoundary><QuestDashboard /></ErrorBoundary></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/create" element={<ProtectedRoute><AuthenticatedLayout><QuestCreatePage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/create-template" element={<ProtectedRoute><AuthenticatedLayout><ErrorBoundary><QuestTemplateCreate /></ErrorBoundary></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/challenges" element={<ProtectedRoute><AuthenticatedLayout><QuestChallenges /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/activity" element={<ProtectedRoute><AuthenticatedLayout><QuestActivity /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/templates/:templateId" element={<ProtectedRoute><AuthenticatedLayout><ErrorBoundary><QuestTemplateDetails /></ErrorBoundary></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/details/:id" element={<ProtectedRoute><AuthenticatedLayout><QuestDetailsPage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/edit/:id" element={<ProtectedRoute><AuthenticatedLayout><QuestEditPage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/invites" element={<ProtectedRoute><AuthenticatedLayout><Invites /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/my-collaborations" element={<ProtectedRoute><AuthenticatedLayout><MyCollaborations /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/guilds" element={<ProtectedRoute><AuthenticatedLayout><MyGuilds /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/guilds/create" element={<ProtectedRoute><AuthenticatedLayout><CreateGuild /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/guilds/analytics" element={<ProtectedRoute><AuthenticatedLayout><GuildAnalytics /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/guilds/rankings" element={<ProtectedRoute><AuthenticatedLayout><GuildRankings /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/guilds/:id/edit" element={<ProtectedRoute><AuthenticatedLayout><GuildEditPage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/guilds/:id" element={<ProtectedRoute><AuthenticatedLayout><GuildDetails /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><AuthenticatedLayout><ErrorBoundary><ChatPage /></ErrorBoundary></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><AuthenticatedLayout><SubscriptionPlans /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/subscription/manage" element={<ProtectedRoute><AuthenticatedLayout><SubscriptionManagement /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/subscription/success" element={<ProtectedRoute><AuthenticatedLayout><CheckoutSuccess /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/account/change-password" element={<ProtectedRoute><AuthenticatedLayout><ChangePassword /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/Login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup/LocalSignUp" element={<LocalSignup />} />
            
            {/* Info pages (public) */}
            <Route path="/docs" element={<ApiDocs />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/apply/:jobId" element={<JobApplication />} />
            <Route path="/help" element={<Help />} />
            <Route path="/help/article/:slug" element={<HelpArticle />} />
            <Route path="/status" element={<Status />} />
            
            {/* Legal pages (public) */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
