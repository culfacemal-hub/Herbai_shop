import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/contexts/SessionContext";
import { submitOrder } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { VitaminBottleSVG } from "@/components/VitaminBottleSVG";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Truck, Store } from "lucide-react";

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽"
  );
}

const checkoutSchema = z
  .object({
    customerName: z.string().min(2, "Введите имя (минимум 2 символа)").max(100),
    customerEmail: z.string().email("Введите корректный email"),
    customerPhone: z
      .string()
      .min(10, "Введите номер телефона")
      .regex(/^[\d\s\+\-\(\)]+$/, "Некорректный формат телефона"),
    deliveryMethod: z.enum(["cdek", "pickup"]),
    cdekCity: z.string().optional(),
    deliveryAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryMethod === "cdek") {
        return !!data.cdekCity && !!data.deliveryAddress;
      }
      return true;
    },
    {
      message: "Укажите город и адрес для доставки СДЭК",
      path: ["deliveryAddress"],
    }
  );

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { sessionId } = useSession();
  const { data: items, isLoading } = useCart();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      deliveryMethod: "cdek",
      cdekCity: "",
      deliveryAddress: "",
    },
  });

  const deliveryMethod = form.watch("deliveryMethod");

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );
  const itemCount = (items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  const deliveryCost = subtotal >= 5000 ? 0 : 399;

  async function onSubmit(data: CheckoutFormData) {
    if (!items || items.length === 0) {
      toast({ variant: "destructive", description: "Корзина пуста" });
      return;
    }
    setSubmitting(true);
    try {
      const order = await submitOrder(sessionId, {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress,
        cdekCity: data.cdekCity,
      });
      navigate(`/order/${order.id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        description: err.message || "Не удалось оформить заказ. Попробуйте снова.",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Skeleton className="h-6 w-40 mb-8" />
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight mb-8" data-testid="text-checkout-title">
        Оформление заказа
      </h1>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact info */}
            <section>
              <h2 className="text-sm font-semibold mb-4 pb-2 border-b border-border">
                Контактные данные
              </h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя и фамилия</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Иван Иванов"
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="mail@example.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+7 (999) 000-00-00"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section>
              <h2 className="text-sm font-semibold mb-4 pb-2 border-b border-border">
                Способ доставки
              </h2>

              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                        data-testid="radio-delivery-method"
                      >
                        <div
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                            field.value === "cdek"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                          onClick={() => field.onChange("cdek")}
                        >
                          <RadioGroupItem value="cdek" id="cdek" className="mt-0.5" data-testid="radio-cdek" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Truck size={15} className="text-primary" />
                              <label htmlFor="cdek" className="text-sm font-medium cursor-pointer">
                                СДЭК доставка
                              </label>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {subtotal >= 5000 ? "Бесплатно" : "399 ₽"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">По всей России, 3–7 рабочих дней</p>
                          </div>
                        </div>

                        <div
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                            field.value === "pickup"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                          onClick={() => field.onChange("pickup")}
                        >
                          <RadioGroupItem value="pickup" id="pickup" className="mt-0.5" data-testid="radio-pickup" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Store size={15} className="text-primary" />
                              <label htmlFor="pickup" className="text-sm font-medium cursor-pointer">
                                Самовывоз Москва
                              </label>
                              <span className="ml-auto text-xs text-green-600 dark:text-green-400">Бесплатно</span>
                            </div>
                            <p className="text-xs text-muted-foreground">ул. Ленина, 1. Пн–Пт: 9:00–20:00</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CDEK address fields */}
              {deliveryMethod === "cdek" && (
                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="cdekCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Город</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Москва"
                            {...field}
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес доставки</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ул. Пушкина, д. 10, кв. 5"
                            {...field}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </section>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              data-testid="button-submit-order"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-2" />
                  Оформляем...
                </>
              ) : (
                `Оформить заказ · ${formatPrice(subtotal + deliveryCost)}`
              )}
            </Button>
          </form>
        </Form>

        {/* Order summary */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Ваш заказ</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(items ?? []).map((item) => {
                const product = item.product;
                if (!product) return null;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <VitaminBottleSVG className="w-7 h-7" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} шт.</p>
                    </div>
                    <span className="text-xs font-medium flex-shrink-0">
                      {formatPrice(product.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары ({itemCount} шт.)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка</span>
                <span>
                  {deliveryCost === 0 ? (
                    <span className="text-green-600 dark:text-green-400">Бесплатно</span>
                  ) : (
                    formatPrice(deliveryCost)
                  )}
                </span>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between font-semibold text-sm">
              <span>Итого</span>
              <span data-testid="text-checkout-total">{formatPrice(subtotal + deliveryCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
