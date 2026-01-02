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

    const processRecoveryToken = async () => {
      try {
        const href = window.location.href;

        const getParam = (name: string) => {
          const match = new RegExp(`[?&#]${name}=([^&#]+)`).exec(href);
          return match ? decodeURIComponent(match[1]) : null;
        };

        const code = getParam("code");
        const accessToken = getParam("access_token");
        const refreshToken = getParam("refresh_token");
        const type = getParam("type");
        const errorDescription = getParam("error_description") || getParam("error");

        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription));
        }

        // Formato novo/alternativo: ?code=... (PKCE)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Erro ao trocar code por sessão (recovery):", error);
            toast.error("Link de recuperação inválido ou expirado.");
            setSessionReady(false);
            return;
          }

          setSessionReady(true);
          window.history.replaceState(
            {},
            document.title,
            `${window.location.origin}${window.location.pathname}#/reset-password`
          );
          return;
        }

        // Caso mais comum: tokens no fragment/query
        // Observação: com HashRouter o link pode chegar como #/reset-password?access_token=...
        if (accessToken && refreshToken && (type === "recovery" || !type)) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Erro ao definir sessão (recovery):", error);
            toast.error("Link de recuperação inválido ou expirado.");
            setSessionReady(false);
            return;
          }

          setSessionReady(true);

          // Limpar tokens da URL (segurança) mantendo a rota
          window.history.replaceState(
            {},
            document.title,
            `${window.location.origin}${window.location.pathname}#/reset-password`
          );
          return;
        }

        // Fallback: se já existe sessão válida, permitir redefinição
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSessionReady(true);
          return;
        }

        toast.error("Nenhum link de recuperação encontrado. Use o link do email.");
      } catch (e) {
        console.error("Erro ao processar token:", e);
        toast.error("Erro ao processar link de recuperação.");
      } finally {
        setIsVerifying(false);
      }
    };

    processRecoveryToken();
  }, []);

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
