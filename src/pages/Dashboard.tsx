
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { AgendamentosList } from "@/components/AgendamentosList";
import { StatsCards } from "@/components/StatsCards";
import { ChartsSection } from "@/components/ChartsSection";
import { PainelAgendamentos } from "@/components/PainelAgendamentos";
import { QuadroEfetivados } from "@/components/QuadroEfetivados";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aplicar tema escuro automaticamente
    document.documentElement.classList.add('dark');

    // Verificar autenticação
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      // Verificar se o email está autorizado na info_loja
      const { data: lojaInfo } = await supabase
        .from("info_loja")
        .select("auth_user")
        .limit(1)
        .maybeSingle();

      if (!lojaInfo || lojaInfo.auth_user !== session.user.email) {
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    }

    checkAuth();
  }, [navigate]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">
            DASHBOARD DE AGENDAMENTOS
          </h1>
          <p className="text-muted-foreground text-lg">
            Análise completa e interativa dos seus agendamentos em tempo real
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <StatsCards />

        {/* Quadro de Efetivados do Dia */}
        <div className="mb-8">
          <div className="grid gap-6 md:grid-cols-4">
            <QuadroEfetivados />
          </div>
        </div>

        {/* Lista de Agendamentos Segmentados */}
        <div className="mb-8">
          <AgendamentosList />
        </div>

        {/* Painel de Agendamentos em Tempo Real */}
        <div className="mb-8">
          <PainelAgendamentos />
        </div>

        {/* Gráficos */}
        <ChartsSection />
      </main>
    </div>
  );
};
