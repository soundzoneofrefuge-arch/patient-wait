import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface CartItem {
  id: string;
  nome: string;
  preco: string;
  foto_url: string | null;
  quantidade: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (produto: Omit<CartItem, "quantidade">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemQuantity: (id: string) => number;
  hasAskedContinue: boolean;
  setHasAskedContinue: (value: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "loja_carrinho";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [hasAskedContinue, setHasAskedContinue] = useState(false);

  // Persistir no localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const parsePrice = (preco: string): number => {
    // Remove "R$" e converte vírgula para ponto
    const cleaned = preco.replace(/[R$\s]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const addItem = useCallback((produto: Omit<CartItem, "quantidade">) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === produto.id);
      if (existing) {
        return prev.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantidade: number) => {
    if (quantidade <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setHasAskedContinue(false);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce(
      (acc, item) => acc + parsePrice(item.preco) * item.quantidade,
      0
    );
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((acc, item) => acc + item.quantidade, 0);
  }, [items]);

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      return item?.quantidade || 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getItemQuantity,
        hasAskedContinue,
        setHasAskedContinue,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
