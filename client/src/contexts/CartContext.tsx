import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CartItem, Book, MerchandiseProduct } from "@shared/schema";
import { nanoid } from "nanoid";

interface CartItemWithDetails extends CartItem {
  book?: Book;
  merchandise?: MerchandiseProduct;
}

interface CartContextType {
  items: CartItemWithDetails[];
  isLoading: boolean;
  sessionId: string;
  addToCart: (productType: "book" | "merchandise", productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Generate or retrieve session ID
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("cart_session_id");
    if (stored) return stored;
    const newId = nanoid();
    localStorage.setItem("cart_session_id", newId);
    return newId;
  });

  // Fetch cart items from API
  const { data: items = [], isLoading } = useQuery<CartItemWithDetails[]>({
    queryKey: [`/api/cart/${sessionId}`],
  });

  // Add to cart mutation
  const addMutation = useMutation({
    mutationFn: async ({ productType, productId, quantity }: { 
      productType: "book" | "merchandise"; 
      productId: string; 
      quantity: number;
    }) => {
      return await apiRequest("POST", "/api/cart", {
        sessionId,
        productType,
        productId,
        quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    }
  });

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    }
  });

  // Remove from cart mutation
  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    }
  });

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/cart/session/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    }
  });

  // Cart actions
  const addToCart = useCallback(async (
    productType: "book" | "merchandise",
    productId: string,
    quantity: number
  ) => {
    await addMutation.mutateAsync({ productType, productId, quantity });
  }, [addMutation]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await updateMutation.mutateAsync({ itemId, quantity });
  }, [updateMutation]);

  const removeFromCart = useCallback(async (itemId: string) => {
    await removeMutation.mutateAsync(itemId);
  }, [removeMutation]);

  const clearCart = useCallback(async () => {
    await clearMutation.mutateAsync();
  }, [clearMutation]);

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.book?.price || item.merchandise?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        sessionId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
