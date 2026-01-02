
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isRecoverySent, setIsRecoverySent] = useState(false);

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

  async function handlePasswordRecovery() {
    if (!email) {
      toast.warning("Preencha o email para recuperar a senha.");
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/#/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Erro ao enviar email de recuperação:", error);
        toast.error("Erro ao enviar email de recuperação. Tente novamente.");
        return;
      }

      setIsRecoverySent(true);
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (e: any) {
      console.error("Erro na recuperação:", e);
      toast.error("Erro ao processar recuperação de senha.");
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
            onClick={() => isRecoveryMode ? setIsRecoveryMode(false) : navigate("/")}
          >
            <ArrowLeft className="h-3 w-3" />
            {isRecoveryMode ? "Voltar ao login" : "Voltar"}
          </Button>
          <h1 className="font-bold text-3xl text-primary mt-4">
            {isRecoveryMode ? "Recuperar Senha" : "Acesso Administrativo"}
          </h1>
          <p className="text-slate-50">
            {isRecoveryMode 
              ? "Digite seu email para receber o link de recuperação" 
              : "Entre com suas credenciais de administrador"}
          </p>
        </header>

        <div className="max-w-md mx-auto">
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">
                {isRecoveryMode ? "Recuperação de Senha" : "Login"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRecoverySent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-5xl">📧</div>
                  <p className="text-foreground">
                    Email de recuperação enviado para <strong>{email}</strong>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsRecoveryMode(false);
                      setIsRecoverySent(false);
                    }}
                    className="mt-4"
                  >
                    Voltar ao login
                  </Button>
                </div>
              ) : isRecoveryMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="admin@exemplo.com"
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === 'Enter' && handlePasswordRecovery()}
                    />
                  </div>

                  <Button 
                    onClick={handlePasswordRecovery} 
                    disabled={!email || isLoading} 
                    className="w-full text-xl font-bold mt-6"
                  >
                    {isLoading ? "ENVIANDO..." : "ENVIAR LINK DE RECUPERAÇÃO"}
                  </Button>
                </>
              ) : (
                <>
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

                  <button
                    type="button"
                    onClick={() => setIsRecoveryMode(true)}
                    className="w-full text-center text-sm text-primary hover:underline mt-2"
                  >
                    Esqueci minha senha
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
