import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, ImageIcon, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";

interface Produto {
  id: string;
  nome: string;
  preco: string;
  foto_url: string | null;
  ativo: boolean;
  ordem: number;
}

export default function Loja() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Form states para admin
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Verificar se usuário é admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: lojaInfo } = await supabase
            .from("info_loja")
            .select("auth_user")
            .limit(1)
            .maybeSingle();
          
          if (lojaInfo?.auth_user === session.user.email) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
      } finally {
        setCheckingAuth(false);
      }
    }
    
    checkAdmin();
  }, []);

  // Carregar produtos
  useEffect(() => {
    async function loadProdutos() {
      try {
        const { data, error } = await supabase
          .from("produtos_loja")
          .select("*")
          .order("ordem", { ascending: true });
        
        if (error) throw error;
        setProdutos(data || []);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        toast.error("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    }
    
    loadProdutos();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 5MB.");
        return;
      }
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Adicionar produto
  const handleAddProduto = async () => {
    if (!novoNome.trim() || !novoPreco.trim()) {
      toast.warning("Preencha nome e preço do produto");
      return;
    }

    setUploading(true);
    
    try {
      let fotoUrl: string | null = null;

      // Upload da imagem se selecionada
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("produtos")
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          toast.error("Erro ao fazer upload da imagem");
          setUploading(false);
          return;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("produtos")
          .getPublicUrl(fileName);
        
        fotoUrl = urlData.publicUrl;
      }

      // Inserir produto
      const { data, error } = await supabase
        .from("produtos_loja")
        .insert({
          nome: novoNome.trim(),
          preco: novoPreco.trim(),
          foto_url: fotoUrl,
          ordem: produtos.length
        })
        .select()
        .single();

      if (error) throw error;

      setProdutos([...produtos, data]);
      setNovoNome("");
      setNovoPreco("");
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success("Produto adicionado!");
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao adicionar produto");
    } finally {
      setUploading(false);
    }
  };

  // Remover produto
  const handleRemoveProduto = async (id: string, fotoUrl: string | null) => {
    try {
      // Remover imagem do storage se existir
      if (fotoUrl) {
        const fileName = fotoUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from("produtos").remove([fileName]);
        }
      }

      const { error } = await supabase
        .from("produtos_loja")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProdutos(produtos.filter(p => p.id !== id));
      toast.success("Produto removido!");
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      toast.error("Erro ao remover produto");
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      {/* Overlay com textura de granito */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
      <div className="absolute inset-0 noise-overlay opacity-10"></div>
      
      {/* Textura de rachados/aspereza */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      <main className="container mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <div className="bg-primary/20 p-3 rounded-xl border border-primary/30 glow-effect-sm">
                <Store className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              <span className="text-gradient">Nossa Loja</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Confira nossos produtos e promoções
            </p>
          </div>
        </header>

        {/* Admin Form */}
        {isAdmin && !checkingAuth && (
          <Card className="mb-8 border-primary/30 bg-card/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Produto
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto</Label>
                  <Input
                    id="nome"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Pomada Modeladora"
                    className="bg-input/50 border-border/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço</Label>
                  <Input
                    id="preco"
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    placeholder="Ex: R$ 45,00"
                    className="bg-input/50 border-border/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foto">Foto do Produto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="bg-input/50 border-border/50 file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs"
                    />
                  </div>
                  {previewUrl && (
                    <div className="mt-2 relative w-16 h-16">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg border border-border/50"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={handleAddProduto}
                    disabled={uploading}
                    className="w-full btn-primary-gradient"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden bg-card/80 backdrop-blur-sm animate-pulse">
                <div className="aspect-square bg-muted"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <Card className="p-12 text-center bg-card/80 backdrop-blur-sm border-dashed border-border/50">
            <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-sm text-muted-foreground/70">
              {isAdmin ? "Use o formulário acima para adicionar produtos." : "Em breve teremos novidades!"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produtos.map((produto, index) => (
              <Card 
                key={produto.id} 
                className="group overflow-hidden bg-card/80 backdrop-blur-sm border-border/30 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                  {produto.foto_url ? (
                    <img
                      src={produto.foto_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Admin delete button */}
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveProduto(produto.id, produto.foto_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Content */}
                <CardContent className="p-4 space-y-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {produto.nome}
                  </h3>
                  <p className="text-lg font-bold text-primary">
                    {produto.preco}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}