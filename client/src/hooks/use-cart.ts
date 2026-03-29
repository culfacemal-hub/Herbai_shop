import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/contexts/SessionContext";
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type CartItemWithProduct,
} from "@/lib/api";

const CART_QUERY_KEY = (sessionId: string) => ["/api/cart", sessionId];

export function useCart() {
  const { sessionId } = useSession();
  return useQuery<CartItemWithProduct[]>({
    queryKey: CART_QUERY_KEY(sessionId),
    queryFn: () => fetchCart(sessionId),
    staleTime: 30_000,
  });
}

export function useCartCount() {
  const { data } = useCart();
  if (!data) return 0;
  return data.reduce((sum, item) => sum + item.quantity, 0);
}

export function useAddToCart() {
  const { sessionId } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity = 1,
    }: {
      productId: number;
      quantity?: number;
    }) => addToCart(sessionId, productId, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY(sessionId) });
    },
  });
}

export function useUpdateCartItem() {
  const { sessionId } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      cartItemId,
      quantity,
    }: {
      cartItemId: number;
      quantity: number;
    }) => updateCartItem(sessionId, cartItemId, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY(sessionId) });
    },
  });
}

export function useRemoveCartItem() {
  const { sessionId } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: number) => removeCartItem(sessionId, cartItemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY(sessionId) });
    },
  });
}

export function useClearCart() {
  const { sessionId } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_QUERY_KEY(sessionId) });
    },
  });
}
