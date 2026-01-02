import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ImageIcon,
  CheckCircle,
  Receipt,
  MapPin,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CHECKOUT_URL = "https://linknabio.gg/asperus";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCart();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const total = getTotal();

  const handleFinalizarCompra = () => {
    setShowConfirmation(true);
  };

  const decrementStock = async () => {
    try {
      // Decrementar estoque para cada item do carrinho
      for (const item of items) {
        const { data: produto, error: fetchError } = await supabase
          .from("produtos_loja")
          .select("quantidade")
          .eq("id", item.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Erro ao buscar produto:", fetchError);
          continue;
        }

        if (produto) {
          const novaQuantidade = Math.max(0, produto.quantidade - item.quantidade);
          
          const { error: updateError } = await supabase
            .from("produtos_loja")
            .update({ quantidade: novaQuantidade })
            .eq("id", item.id);

          if (updateError) {
            console.error("Erro ao atualizar estoque:", updateError);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao decrementar estoque:", error);
    }
  };

  const handleConfirmRedirect = async () => {
    await decrementStock();
    clearCart();
    window.open(CHECKOUT_URL, "_blank");
    navigate("/loja");
  };

  if (items.length === 0 && !showConfirmation) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${authBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
        <div className="absolute inset-0 noise-overlay opacity-10"></div>

        <main className="container mx-auto px-4 sm:px-6 py-8 relative z-10">
          <header className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate("/loja")}
              className="border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Loja
            </Button>
          </header>

          <Card className="p-12 text-center bg-card/80 backdrop-blur-sm border-dashed border-border/50">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-sm text-muted-foreground/70 mb-6">
              Adicione produtos para continuar
            </p>
            <Button onClick={() => navigate("/loja")} className="btn-primary-gradient">
              Ver Produtos
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
      <div className="absolute inset-0 noise-overlay opacity-10"></div>
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
              onClick={() => navigate("/loja")}
              className="border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
          </div>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <div className="bg-primary/20 p-3 rounded-xl border border-primary/30 glow-effect-sm">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="font-bold text-3xl sm:text-4xl tracking-tight">
              <span className="text-gradient">Seu Carrinho</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Revise seus produtos antes de finalizar
            </p>
          </div>
        </header>

        {/* Lista de Produtos */}
        <div className="grid gap-4 mb-8">
          {items.map((item) => (
            <Card
              key={item.id}
              className="bg-card/80 backdrop-blur-sm border-border/30 overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  {/* Imagem */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.nome}
                    </h3>
                    <p className="text-primary font-bold">{item.preco}</p>
                  </div>

                  {/* Controles de quantidade */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                      className="h-8 w-8 border-border/50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[32px] text-center font-bold">
                      {item.quantidade}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                      className="h-8 w-8 border-border/50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Remover */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total e Checkout */}
        <Card className="bg-card/90 backdrop-blur-sm border-primary/30 sticky bottom-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-3xl font-bold text-primary">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <Button
              onClick={handleFinalizarCompra}
              className="w-full h-14 text-lg font-bold btn-primary-gradient"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Finalizar Compra
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Modal de Confirmação */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-card border-primary/30 max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto bg-primary/20 p-4 rounded-full mb-4 w-fit">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Pedido Confirmado!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg border border-border/30 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    Seus produtos foram separados e aguardam retirada na barbearia
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    Leve seu comprovante de pagamento para retirar os produtos
                  </span>
                </div>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg mt-2">
                <p className="text-destructive font-bold text-sm">ATENÇÃO!</p>
                <p className="text-destructive/90 text-sm">
                  Não realizamos entregas. Retirada somente em nossa loja.
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Você será redirecionado para a página de pagamento.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleConfirmRedirect}
              className="w-full btn-primary-gradient h-12"
            >
              Ir para Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
