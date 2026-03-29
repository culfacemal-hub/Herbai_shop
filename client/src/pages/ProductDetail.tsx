import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  ChevronRight,
  Package,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { fetchProductBySlug, fetchProducts, fetchProductReviews } from "@/lib/api";
import type { Product } from "@shared/schema";
import { useAddToCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";
import { VitaminBottleSVG } from "@/components/VitaminBottleSVG";
import { Button } from "@/components/ui/button";
import { PageTransition, AnimatedSection } from "@/components/AnimatedSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽"
  );
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={
              i <= Math.round(rating)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30 fill-muted-foreground/10"
            }
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"})
      </span>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-12">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery<Product | null>({
    queryKey: ["/api/products", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
  });

  const { data: relatedData } = useQuery({
    queryKey: ["/api/products", "related", product?.categoryId],
    queryFn: () =>
      fetchProducts({
        categoryId: product?.categoryId ?? undefined,
        limit: 4,
      }),
    enabled: !!product?.categoryId,
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/products", product?.id, "reviews"],
    queryFn: () => fetchProductReviews(product!.id),
    enabled: !!product?.id,
  });

  if (isLoading) return <ProductSkeleton />;
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-sm mb-4">Товар не найден</p>
        <Link href="/catalog">
          <Button variant="outline" size="sm">Вернуться в каталог</Button>
        </Link>
      </div>
    );
  }

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const relatedProducts: Product[] = (relatedData as any)?.products?.filter(
    (p: Product) => p.id !== product.id
  ).slice(0, 4) ?? [];

  function handleAddToCart() {
    addToCart.mutate(
      { productId: product!.id, quantity },
      {
        onSuccess: () => {
          toast({
            description: `«${product!.name}» (${quantity} шт.) добавлен в корзину`,
            duration: 2500,
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            description: "Не удалось добавить в корзину",
            duration: 3000,
          });
        },
      }
    );
  }

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Главная</Link>
        <ChevronRight size={12} />
        <Link href="/catalog" className="hover:text-foreground transition-colors">Каталог</Link>
        <ChevronRight size={12} />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product main */}
      <div className="grid lg:grid-cols-2 gap-10 mb-12">
        {/* Image */}
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card overflow-hidden aspect-square flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="img-product-main"
              />
            ) : (
              <div className="w-full h-full p-16 flex items-center justify-center">
                <VitaminBottleSVG className="w-full h-full max-w-[200px]" />
              </div>
            )}
          </div>

          {/* Badges */}
          {discountPercent && (
            <div className="absolute top-4 left-4">
              <span className="text-sm font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-lg">
                -{discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2" data-testid="text-product-brand">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h1 className="text-xl font-semibold leading-snug mb-3 tracking-tight" data-testid="text-product-name">
            {product.name}
          </h1>

          {/* Rating */}
          {(product.rating ?? 0) > 0 && (
            <div className="mb-4">
              <StarRow rating={product.rating ?? 0} count={product.reviewCount ?? 0} />
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-muted-foreground mb-4">
              Арт.: <span className="font-mono" data-testid="text-product-sku">{product.sku}</span>
            </p>
          )}

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed" data-testid="text-product-short-desc">
              {product.shortDescription}
            </p>
          )}

          <Separator className="my-4" />

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-xl font-bold" data-testid="text-product-price">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through" data-testid="text-product-compare-price">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            {discountPercent && (
              <Badge variant="secondary" className="text-primary">
                Скидка {discountPercent}%
              </Badge>
            )}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-1.5 mb-5 text-xs">
            <div
              className={`h-2 w-2 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className={product.inStock ? "text-green-600 dark:text-green-400" : "text-red-500"}>
              {product.inStock ? "В наличии" : "Нет в наличии"}
            </span>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                data-testid="button-quantity-dec"
                aria-label="Уменьшить количество"
              >
                <Minus size={15} />
              </button>
              <span className="h-10 w-10 flex items-center justify-center text-sm font-medium" data-testid="text-quantity">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                data-testid="button-quantity-inc"
                aria-label="Увеличить количество"
              >
                <Plus size={15} />
              </button>
            </div>

            <Button
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={!product.inStock || addToCart.isPending}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart size={16} />
              {addToCart.isPending ? "Добавляем..." : "В корзину"}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Truck size={13} />, text: "Доставка СДЭК" },
              { icon: <ShieldCheck size={13} />, text: "100% оригинал" },
              { icon: <Package size={13} />, text: "Надёжная упаковка" },
            ].map((b) => (
              <div key={b.text} className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-muted/50 text-center">
                <div className="text-primary">{b.icon}</div>
                <span className="text-xs text-muted-foreground">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="w-full justify-start border-b border-border bg-transparent h-auto p-0 rounded-none gap-0">
          {[
            { value: "description", label: "Описание" },
            { value: "ingredients", label: "Состав" },
            { value: "dosage", label: "Дозировка" },
            { value: "reviews", label: `Отзывы${(product.reviewCount ?? 0) > 0 ? ` (${product.reviewCount})` : ""}` },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="description" className="pt-6">
          {product.description ? (
            <div
              className="product-html text-sm text-foreground leading-relaxed max-w-3xl"
              data-testid="text-product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Описание не указано</p>
          )}
        </TabsContent>

        <TabsContent value="ingredients" className="pt-6">
          {product.ingredients ? (
            <div
              className="product-html text-sm text-foreground leading-relaxed max-w-3xl"
              data-testid="text-product-ingredients"
              dangerouslySetInnerHTML={{ __html: product.ingredients }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Состав не указан</p>
          )}
        </TabsContent>

        <TabsContent value="dosage" className="pt-6">
          {product.dosage ? (
            <div
              className="product-html text-sm text-foreground leading-relaxed max-w-3xl"
              data-testid="text-product-dosage"
              dangerouslySetInnerHTML={{ __html: product.dosage }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Рекомендации по дозировке не указаны</p>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="pt-6">
          {!reviews || (reviews as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">Отзывов пока нет. Будьте первым!</p>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {(reviews as any[]).map((review: any) => (
                <div key={review.id} className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" data-testid={`review-author-${review.id}`}>{review.author}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={11}
                            className={
                              i <= review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground/30 fill-muted-foreground/10"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  {review.text && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight mb-5">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </PageTransition>
  );
}
