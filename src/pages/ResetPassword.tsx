import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    document.title = "Redefinir Senha | ÁSPERUS";
    
    // Processar tokens da URL (Supabase envia tokens como query params ou hash)
    const processRecoveryToken = async () => {
      try {
        // O Supabase pode enviar o token de diferentes formas
        // Verificar se há parâmetros na URL (antes do hash)
        const fullUrl = window.location.href;
        console.log("Processing recovery URL:", fullUrl);
        
        // Extrair access_token e refresh_token da URL
        let accessToken = null;
        let refreshToken = null;
        let type = null;
        
        // Verificar nos query params
        const urlParams = new URLSearchParams(window.location.search);
        accessToken = urlParams.get('access_token');
        refreshToken = urlParams.get('refresh_token');
        type = urlParams.get('type');
        
        // Se não encontrou, verificar no hash (pode vir após #)
        if (!accessToken) {
          const hashParams = new URLSearchParams(window.location.hash.replace('#', '').split('?')[1] || '');
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
        }
        
        // Também verificar no formato de fragmento (#access_token=...)
        if (!accessToken && fullUrl.includes('access_token=')) {
          const fragment = fullUrl.split('#')[1] || fullUrl.split('?')[1] || '';
          const fragmentParams = new URLSearchParams(fragment.replace(/^\//, ''));
          accessToken = fragmentParams.get('access_token');
          refreshToken = fragmentParams.get('refresh_token');
          type = fragmentParams.get('type');
        }
        
        console.log("Token type:", type, "Has access token:", !!accessToken);
        
        if (accessToken && type === 'recovery') {
          // Definir a sessão com os tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error("Erro ao definir sessão:", error);
            toast.error("Link de recuperação inválido ou expirado.");
            setIsVerifying(false);
            return;
          }
          
          console.log("Sessão definida com sucesso:", data);
          setSessionReady(true);
        } else {
          // Verificar se já tem uma sessão válida
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSessionReady(true);
          } else {
            toast.error("Nenhum token de recuperação encontrado. Use o link do email.");
          }
        }
      } catch (e) {
        console.error("Erro ao processar token:", e);
        toast.error("Erro ao processar link de recuperação.");
      } finally {
        setIsVerifying(false);
      }
    };
    
    processRecoveryToken();
  }, []);

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      toast.warning("Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.warning("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Erro ao redefinir senha:", error);
        toast.error("Erro ao redefinir senha. O link pode ter expirado.");
        return;
      }

      setIsSuccess(true);
      toast.success("Senha redefinida com sucesso!");
    } catch (e: any) {
      console.error("Erro:", e);
      toast.error("Erro ao processar redefinição de senha.");
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
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao login
          </Button>
          <h1 className="font-bold text-3xl text-primary mt-4">Redefinir Senha</h1>
          <p className="text-slate-50">Digite sua nova senha</p>
        </header>

        <div className="max-w-md mx-auto">
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">Nova Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isVerifying ? (
                <div className="text-center space-y-4 py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    Verificando link de recuperação...
                  </p>
                </div>
              ) : isSuccess ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-5xl">✅</div>
                  <p className="text-foreground">
                    Senha redefinida com sucesso!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Você já pode fazer login com sua nova senha.
                  </p>
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="mt-4"
                  >
                    Ir para o login
                  </Button>
                </div>
              ) : !sessionReady ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-5xl">⚠️</div>
                  <p className="text-foreground">
                    Link inválido ou expirado
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Por favor, solicite um novo link de recuperação de senha.
                  </p>
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="mt-4"
                  >
                    Voltar ao login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova Senha</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                    />
                  </div>

                  <Button 
                    onClick={handleResetPassword} 
                    disabled={!password || !confirmPassword || isLoading} 
                    className="w-full text-xl font-bold mt-6"
                  >
                    {isLoading ? "REDEFININDO..." : "REDEFINIR SENHA"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
