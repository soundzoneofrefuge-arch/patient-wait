
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Booking from "@/pages/Booking";
import BookingConfirmation from "@/pages/BookingConfirmation";
import Reschedule from "@/pages/Reschedule";
import RescheduleConfirmation from "@/pages/RescheduleConfirmation";
import Cancel from "@/pages/Cancel";
import CancelConfirmation from "@/pages/CancelConfirmation";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  console.log("App component function called");
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    console.log("App component mounted - GitHub Pages optimized");
    console.log("Location:", window.location.href);
    console.log("Supabase client status:", !!supabase);
    
    // Aplicar tema escuro
    document.documentElement.classList.add('dark');

    // Configurar autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Verificar sessão existente em background (não-bloqueante)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    }).catch(error => {
      console.error("Erro ao verificar sessão:", error);
      // Continuar mesmo com erro na verificação de sessão
    });

    return () => subscription.unsubscribe();
  }, []);

  // Para GitHub Pages, sempre usar HashRouter
  const RouterComponent = Router;
  
  return (
    <QueryClientProvider client={queryClient}>
      <RouterComponent>
        <div className="min-h-screen dark">
          <Routes>
            <Route path="/" element={<Booking />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/reschedule" element={<Reschedule />} />
            <Route path="/reschedule-confirmation" element={<RescheduleConfirmation />} />
            <Route path="/cancel" element={<Cancel />} />
            <Route path="/cancel-confirmation" element={<CancelConfirmation />} />
            <Route path="*" element={<Booking />} />
          </Routes>
        </div>
        <Toaster position="top-right" theme="dark" />
      </RouterComponent>
    </QueryClientProvider>
  );
};

export default App;

