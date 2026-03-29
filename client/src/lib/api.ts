import { apiRequest } from "@/lib/queryClient";
import type { Category, Product, CartItem, Order } from "@shared/schema";

// ─── Categories ────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await apiRequest("GET", "/api/categories");
  return res.json();
}

// ─── Products ──────────────────────────────────────────────────────────────

export interface ProductFilters {
  categoryId?: number;
  categorySlug?: string;
  search?: string;
  sort?: "popular" | "price_asc" | "price_desc" | "new";
  featured?: boolean;
  page?: number;
  limit?: number;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<{
  products: Product[];
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("category", String(filters.categoryId));
  if (filters.categorySlug) params.set("category", filters.categorySlug);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.featured !== undefined) params.set("featured", String(filters.featured));
  // Convert page to offset
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 16;
  if (page > 1) params.set("offset", String((page - 1) * limit));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  // Fetch current page + fetch total count (no limit)
  const countParams = new URLSearchParams(params);
  countParams.delete("limit");
  countParams.delete("offset");

  const [res, countRes] = await Promise.all([
    apiRequest("GET", `/api/products${query ? `?${query}` : ""}`),
    apiRequest("GET", `/api/products${countParams.toString() ? `?${countParams}` : ""}`),
  ]);

  const products: Product[] = await res.json();
  const allProducts: Product[] = await countRes.json();
  return { products, total: allProducts.length };
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const res = await apiRequest("GET", "/api/products?featured=true&limit=8");
  const data = await res.json();
  return data.products ?? data;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const res = await apiRequest("GET", `/api/products/${slug}`);
  return res.json();
}

// ─── Cart ──────────────────────────────────────────────────────────────────

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export async function fetchCart(sessionId: string): Promise<CartItemWithProduct[]> {
  const res = await fetch(`./api/cart`, {
    headers: { "x-session-id": sessionId },
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

export async function addToCart(
  sessionId: string,
  productId: number,
  quantity: number = 1
): Promise<CartItem> {
  const res = await fetch(`./api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function updateCartItem(
  sessionId: string,
  cartItemId: number,
  quantity: number
): Promise<CartItem> {
  const res = await fetch(`./api/cart/${cartItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function removeCartItem(
  sessionId: string,
  cartItemId: number
): Promise<void> {
  const res = await fetch(`./api/cart/${cartItemId}`, {
    method: "DELETE",
    headers: { "x-session-id": sessionId },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function clearCart(sessionId: string): Promise<void> {
  const res = await fetch(`./api/cart`, {
    method: "DELETE",
    headers: { "x-session-id": sessionId },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

// ─── Orders ────────────────────────────────────────────────────────────────

export interface SubmitOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  cdekCity?: string;
  cdekPoint?: string;
}

export async function submitOrder(
  sessionId: string,
  payload: SubmitOrderPayload
): Promise<Order> {
  // First fetch cart to get items with prices
  const cartItems = await fetchCart(sessionId);
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Корзина пуста");
  }

  const items = cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.product.price,
  }));

  const res = await fetch(`./api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ ...payload, items }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchOrder(orderId: number): Promise<Order & { items: CartItemWithProduct[] }> {
  const res = await apiRequest("GET", `/api/orders/${orderId}`);
  return res.json();
}

// ─── Reviews ───────────────────────────────────────────────────────────────

export async function fetchProductReviews(productId: number) {
  const res = await apiRequest("GET", `/api/products/${productId}/reviews`);
  return res.json();
}
