import { Star, ShoppingCart, Plus, Check } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { VitaminBottleSVG } from "./VitaminBottleSVG";
import { useAddToCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

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
  const [justAdded, setJustAdded] = useState(false);

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
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1500);
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
      className={`group block rounded-xl border border-border bg-card overflow-hidden transition-shadow duration-300 hover:shadow-lg ${className}`}
    >
      {/* Image area */}
      <div className="relative bg-muted/30 aspect-square overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6">
            <VitaminBottleSVG className="w-full h-full max-w-[120px] group-hover:scale-105 transition-transform duration-500" />
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

        {/* Quick add overlay — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
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

          {/* Animated cart button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || addToCart.isPending}
            className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
              justAdded
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
            data-testid={`button-add-cart-${product.id}`}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check size={15} />
                </motion.div>
              ) : (
                <motion.div
                  key="cart"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <ShoppingCart size={15} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </Link>
  );
}
