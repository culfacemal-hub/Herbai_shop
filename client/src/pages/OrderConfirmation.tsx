import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, Truck, Mail, ArrowRight, Home } from "lucide-react";
import { fetchOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { VitaminBottleSVG } from "@/components/VitaminBottleSVG";

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽"
  );
}

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id, 10);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !isNaN(orderId),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto mb-8" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="text-lg font-semibold mb-2">Заказ не найден</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Возможно, заказ был оформлен в другой сессии.
        </p>
        <Link href="/">
          <Button variant="outline" data-testid="button-home-error">
            На главную
          </Button>
        </Link>
      </div>
    );
  }

  const DELIVERY_LABELS: Record<string, string> = {
    cdek: "СДЭК",
    pickup: "Самовывоз Москва",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-semibold mb-1" data-testid="text-order-title">
          Заказ #{order.id} оформлен!
        </h1>
        <p className="text-sm text-muted-foreground">
          Спасибо за покупку, {order.customerName.split(" ")[0]}! Подтверждение отправлено на {order.customerEmail}.
        </p>
      </div>

      {/* Order details card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">Номер заказа</p>
            <p className="text-sm font-semibold" data-testid="text-order-id">#{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Статус</p>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">В обработке</p>
          </div>
        </div>

        <Separator />

        {/* Customer info */}
        <div className="p-4 grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Покупатель</h3>
            <p className="text-sm" data-testid="text-customer-name">{order.customerName}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail size={12} />
              <span data-testid="text-customer-email">{order.customerEmail}</span>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-customer-phone">{order.customerPhone}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Доставка</h3>
            <div className="flex items-center gap-1.5 text-sm">
              <Truck size={13} className="text-primary flex-shrink-0" />
              <span data-testid="text-delivery-method">{DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}</span>
            </div>
            {order.cdekCity && (
              <p className="text-xs text-muted-foreground">{order.cdekCity}</p>
            )}
            {order.deliveryAddress && (
              <p className="text-xs text-muted-foreground" data-testid="text-delivery-address">{order.deliveryAddress}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Состав заказа</h3>
            <div className="space-y-3">
              {(order.items as any[]).map((item: any) => {
                const product = item.product;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product?.imageUrl ? (
                        <img src={product.imageUrl} alt={product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <VitaminBottleSVG className="w-7 h-7" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{product?.name ?? "Товар"}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} шт. × {formatPrice(item.price)}</p>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between text-sm font-semibold">
              <span>Итого</span>
              <span data-testid="text-order-total">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-8">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Мы свяжемся с вами по телефону или email для подтверждения заказа. Ориентировочный срок доставки — 3–7 рабочих дней.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full gap-2" data-testid="button-go-home">
            <Home size={15} />
            На главную
          </Button>
        </Link>
        <Link href="/catalog" className="flex-1">
          <Button className="w-full gap-2" data-testid="button-continue-shopping">
            Продолжить покупки
            <ArrowRight size={15} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
