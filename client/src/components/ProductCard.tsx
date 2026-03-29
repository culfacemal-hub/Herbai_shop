import { Star, ShoppingCart, Plus } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { VitaminBottleSVG } from "./VitaminBottleSVG";
import { useAddToCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatPrice(value: number): string {
  return (
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽"
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={11}
            className={
              i <= Math.round(rating)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30 fill-muted-foreground/10"
            }
          />
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const addToCart = useAddToCart();
  const { toast } = useToast();

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          toast({
            description: `«${product.name}» добавлен в корзину`,
            duration: 2000,
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
    <Link
      href={`/product/${product.slug}`}
      data-testid={`card-product-${product.id}`}
      className={`group block rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Image area */}
      <div className="relative bg-muted/30 aspect-square overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6">
            <VitaminBottleSVG className="w-full h-full max-w-[120px]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPercent && (
            <span
              className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-md"
              data-testid={`badge-discount-${product.id}`}
            >
              -{discountPercent}%
            </span>
          )}
          {!product.inStock && (
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
              Нет в наличии
            </span>
          )}
        </div>

        {/* Quick add overlay */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || addToCart.isPending}
            className="w-full py-2.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`button-quick-add-${product.id}`}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <Plus size={15} />
            В корзину
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {product.brand && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5 truncate" data-testid={`text-brand-${product.id}`}>
            {product.brand}
          </p>
        )}
        <p className="text-sm font-medium leading-snug line-clamp-2 mb-1.5" data-testid={`text-name-${product.id}`}>
          {product.name}
        </p>

        {(product.rating || 0) > 0 && (
          <div className="mb-2">
            <StarRating
              rating={product.rating ?? 0}
              count={product.reviewCount ?? 0}
            />
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-semibold" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through" data-testid={`text-compare-price-${product.id}`}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || addToCart.isPending}
            className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid={`button-add-cart-${product.id}`}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </Link>
  );
}
