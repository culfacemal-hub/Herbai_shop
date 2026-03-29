import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "@/hooks/use-cart";
import { VitaminBottleSVG } from "@/components/VitaminBottleSVG";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/AnimatedSection";

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽"
  );
}

export default function Cart() {
  const [, navigate] = useLocation();
  const { data: items, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );
  const itemCount = (items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  const DELIVERY_THRESHOLD = 5000;
  const deliveryCost = subtotal >= DELIVERY_THRESHOLD ? 0 : 399;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center" data-testid="cart-empty">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-5" />
        <h1 className="text-lg font-semibold mb-2">Корзина пуста</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Добавьте витамины или добавки из нашего каталога
        </p>
        <Link href="/catalog">
          <Button data-testid="button-go-catalog">
            Перейти в каталог
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PageTransition className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-cart-title">
          Корзина
          <span className="ml-2 text-base font-normal text-muted-foreground">({itemCount} шт.)</span>
        </h1>
        <button
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          data-testid="button-clear-cart"
        >
          Очистить
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Items list */}
        <div className="space-y-3">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-xl border border-border bg-card"
                data-testid={`cart-item-${item.id}`}
              >
                {/* Image */}
                <Link href={`/product/${product.slug}`} className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <VitaminBottleSVG className="w-10 h-10" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {product.brand && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      {product.brand}
                    </p>
                  )}
                  <Link href={`/product/${product.slug}`} className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors" data-testid={`cart-item-name-${item.id}`}>
                    {product.name}
                  </Link>

                  <div className="flex items-center justify-between gap-4 mt-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          item.quantity <= 1
                            ? removeItem.mutate(item.id)
                            : updateItem.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                        }
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        data-testid={`button-dec-${item.id}`}
                        aria-label="Уменьшить количество"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="h-7 w-7 flex items-center justify-center text-xs font-medium" data-testid={`text-qty-${item.id}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateItem.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })
                        }
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        data-testid={`button-inc-${item.id}`}
                        aria-label="Увеличить количество"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-semibold" data-testid={`text-item-total-${item.id}`}>
                      {formatPrice(product.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem.mutate(item.id)}
                  className="flex-shrink-0 p-1.5 h-fit rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  data-testid={`button-remove-${item.id}`}
                  aria-label="Удалить из корзины"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Итого</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары ({itemCount} шт.)</span>
                <span data-testid="text-subtotal">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span data-testid="text-delivery">
                  {deliveryCost === 0 ? (
                    <span className="text-green-600 dark:text-green-400">Бесплатно</span>
                  ) : (
                    formatPrice(deliveryCost)
                  )}
                </span>
              </div>

              {subtotal < DELIVERY_THRESHOLD && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                  <Truck size={13} />
                  <span>
                    Ещё {formatPrice(DELIVERY_THRESHOLD - subtotal)} до бесплатной доставки
                  </span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-base font-semibold mb-5">
              <span>К оплате</span>
              <span data-testid="text-total">{formatPrice(subtotal + deliveryCost)}</span>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => navigate("/checkout")}
              data-testid="button-checkout"
            >
              Оформить заказ
              <ArrowRight size={15} />
            </Button>

            <Link href="/catalog">
              <button
                className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                data-testid="button-continue-shopping"
              >
                Продолжить покупки
              </button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
