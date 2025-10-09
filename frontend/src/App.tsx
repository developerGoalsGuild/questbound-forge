import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TranslationProvider } from '@/hooks/useTranslation';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import LocalSignup from "./pages/signup/LocalSignUp";
import Login from "./pages/login/Login";
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
import QuestListPage from './pages/quests/QuestList';
import QuestCreatePage from './pages/quests/QuestCreate';
import QuestDetailsPage from './pages/quests/QuestDetails';
import QuestEditPage from './pages/quests/QuestEdit';
import QuestDashboard from './pages/quests/QuestDashboard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';



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
            <Route path="/quests" element={<ProtectedRoute><AuthenticatedLayout><QuestListPage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/dashboard" element={<ProtectedRoute><AuthenticatedLayout><ErrorBoundary><QuestDashboard /></ErrorBoundary></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/create" element={<ProtectedRoute><AuthenticatedLayout><QuestCreatePage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/details/:id" element={<ProtectedRoute><AuthenticatedLayout><QuestDetailsPage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/quests/edit/:id" element={<ProtectedRoute><AuthenticatedLayout><QuestEditPage /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/account/change-password" element={<ProtectedRoute><AuthenticatedLayout><ChangePassword /></AuthenticatedLayout></ProtectedRoute>} />
            <Route path="/login/Login" element={<Login />} />
            <Route path="/signup/LocalSignUp" element={<LocalSignup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
