import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

export function CartButton() {
  const { getItemCount, getTotal } = useCart();
  const navigate = useNavigate();
  const count = getItemCount();
  const total = getTotal();

  if (count === 0) return null;

  return (
    <Button
      onClick={() => navigate("/checkout")}
      className="fixed bottom-6 right-6 z-50 h-auto py-3 px-5 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 animate-slide-up flex items-center gap-3 rounded-full"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-xs opacity-80">Carrinho</span>
        <span className="font-bold">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>
    </Button>
  );
}
