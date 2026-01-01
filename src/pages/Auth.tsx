
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Acesso Administrativo | ÁSPERUS";
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      toast.warning("Preencha email e senha.");
      return;
    }

    setIsLoading(true);
    try {
      // Validar credenciais via edge function que verifica info_loja
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError || !authData?.user) {
        toast.error("Credenciais inválidas.");
        return;
      }

      // Verificar se o email está autorizado na tabela info_loja
      const { data: lojaInfo, error: lojaError } = await supabase
        .from("info_loja")
        .select("auth_user")
        .limit(1)
        .maybeSingle();

      if (lojaError || !lojaInfo || lojaInfo.auth_user !== email) {
        await supabase.auth.signOut();
        toast.error("Acesso não autorizado.");
        return;
      }

      // Login bem-sucedido
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (e: any) {
      console.error("Erro no login:", e);
      toast.error("Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${authBackground})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      
      <main className="container mx-auto px-6 py-8 relative z-10">
        <header className="mb-8 text-center relative">
          <Button 
            variant="outline" 
            size="sm"
            className="absolute -top-4 left-0 flex items-center gap-1 text-xs px-2 py-1 h-7"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar
          </Button>
          <h1 className="font-bold text-3xl text-primary mt-4">Acesso Administrativo</h1>
          <p className="text-slate-50">Entre com suas credenciais de administrador</p>
        </header>

        <div className="max-w-md mx-auto">
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@exemplo.com"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              <Button 
                onClick={handleLogin} 
                disabled={!email || !password || isLoading} 
                className="w-full text-xl font-bold mt-6"
              >
                {isLoading ? "ENTRANDO..." : "ENTRAR"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
