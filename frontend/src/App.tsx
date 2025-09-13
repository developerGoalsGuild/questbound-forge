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
//import ConfirmEmail from "./pages/ConfirmEmail";
import { SessionKeepAlive } from '@/lib/session';
import { ProtectedRoute, AuthWatcher } from '@/lib/auth';
import ChangePassword from './pages/account/ChangePassword';



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionKeepAlive />
        <BrowserRouter>
          <AuthWatcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/account/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
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
