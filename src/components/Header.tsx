import { LogOut, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    const fetchStoreName = async () => {
      const { data } = await supabase
        .from('info_loja')
        .select('name')
        .limit(1)
        .single();
      
      if (data?.name) {
        setStoreName(data.name);
      }
    };
    fetchStoreName();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      navigate("/auth");
    } catch (error: any) {
      toast.error("Erro ao fazer logout. Tente novamente.");
      console.error("Erro ao fazer logout:", error.message);
    }
  };

  return (
    <header className="relative overflow-hidden bg-card border-b border-border/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5"></div>
      
      <div className="container relative mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-primary/20 p-3 md:p-4 rounded-xl border border-primary/30 shadow-glow-sm">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
                Dashboard <span className="text-gradient">{storeName || "ASPERUS"}</span>
              </h1>
              <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                Painel de controle para agendamentos
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-border/50 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive self-end md:self-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};
