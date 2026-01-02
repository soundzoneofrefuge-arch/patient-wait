import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShoppingCart, Plus } from "lucide-react";

interface AddToCartDialogProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onCheckout: () => void;
  productName: string;
}

export function AddToCartDialog({
  open,
  onClose,
  onContinue,
  onCheckout,
  productName,
}: AddToCartDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-primary">
            <ShoppingCart className="h-5 w-5" />
            Produto Adicionado!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            <span className="font-semibold text-foreground">{productName}</span>{" "}
            foi adicionado ao seu carrinho.
            <br />
            <br />
            Deseja continuar comprando ou finalizar a compra?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onContinue}
            className="border-border/50 hover:bg-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Continuar Comprando
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onCheckout}
            className="bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ir para Carrinho
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
