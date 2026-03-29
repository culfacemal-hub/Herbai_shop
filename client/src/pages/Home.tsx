import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Truck, ShieldCheck, Bot, ChevronRight, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { fetchFeaturedProducts, fetchCategories } from "@/lib/api";
import type { Product, Category } from "@shared/schema";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AnimatedSection,
  StaggerGrid,
  StaggerItem,
  PageTransition,
} from "@/components/AnimatedSection";

const CATEGORY_ICONS: Record<string, string> = {
  vitamins: "💊",
  omega: "🐟",
  protein: "💪",
  probiotics: "🦠",
  collagen: "✨",
  magnesium: "⚡",
  zinc: "🔬",
  "vitamin-d": "☀️",
  "vitamin-c": "🍋",
  minerals: "💎",
};

const DEFAULT_CATEGORIES = [
  { id: 1, slug: "vitamins", name: "Витамины", description: "Комплексы и отдельные витамины", imageUrl: null, parentId: null },
  { id: 2, slug: "omega", name: "Омега-3", description: "Рыбий жир и растительные омеги", imageUrl: null, parentId: null },
  { id: 3, slug: "protein", name: "Протеин", description: "Спортивное питание", imageUrl: null, parentId: null },
  { id: 4, slug: "probiotics", name: "Пробиотики", description: "Здоровье кишечника", imageUrl: null, parentId: null },
  { id: 5, slug: "collagen", name: "Коллаген", description: "Красота и суставы", imageUrl: null, parentId: null },
  { id: 6, slug: "minerals", name: "Минералы", description: "Магний, цинк, железо", imageUrl: null, parentId: null },
];

function HeroSection() {
  const [, navigate] = useLocation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-background border-b border-border/50">
      {/* Decorative blobs */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(152 55% 33%) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(152 55% 33%) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-8 items-center">
        {/* Text — animate in from left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-5">
            <Leaf size={12} />
            100% оригинальная продукция
          </div>

          <h1 className="text-xl font-semibold leading-tight mb-4 tracking-tight">
            Herbai — витамины и добавки<br />
            <span className="text-primary">с доставкой по всей России</span>
          </h1>

          <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md">
            Более 500 наименований витаминов, минералов и спортивных добавок от ведущих мировых производителей. Быстрая доставка СДЭК в любой город.
          </p>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <Button
              onClick={() => navigate("/catalog")}
              size="lg"
              className="gap-2 text-sm"
              data-testid="button-hero-catalog"
            >
              Перейти в каталог
              <ArrowRight size={15} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm"
              data-testid="button-hero-categories"
            >
              Категории
            </Button>
          </motion.div>
        </motion.div>

        {/* Illustration — animate in from right with subtle float */}
        <motion.div
          className="hidden lg:flex justify-center items-center"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="relative">
            {/* Subtle floating animation */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 200 280" className="w-56 h-auto drop-shadow-xl" aria-hidden="true">
                <rect x="72" y="20" width="56" height="30" rx="8" fill="hsl(152 55% 33% / 0.25)" />
                <rect x="78" y="24" width="44" height="22" rx="5" fill="hsl(152 55% 33% / 0.4)" />
                <rect x="78" y="48" width="44" height="18" rx="4" fill="hsl(152 55% 33% / 0.2)" />
                <path
                  d="M58 70 C50 76 46 90 46 108 L46 218 C46 228 55 236 66 236 L134 236 C145 236 154 228 154 218 L154 108 C154 90 150 76 142 70 Z"
                  fill="hsl(152 55% 33% / 0.1)"
                  stroke="hsl(152 55% 33% / 0.3)"
                  strokeWidth="2"
                />
                <rect x="56" y="102" width="88" height="96" rx="6" fill="hsl(152 55% 33% / 0.12)" />
                <path
                  d="M88 138 C88 138 91 128 100 122 C109 116 114 119 114 119 C114 119 111 129 102 135 C93 141 88 138 88 138Z"
                  fill="hsl(152 55% 33% / 0.6)"
                />
                <path d="M88 138 C92 133 97 130 103 127" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <rect x="68" y="154" width="64" height="6" rx="3" fill="hsl(152 55% 33% / 0.3)" />
                <rect x="74" y="166" width="52" height="5" rx="2.5" fill="hsl(152 55% 33% / 0.2)" />
                <rect x="78" y="178" width="44" height="4" rx="2" fill="hsl(152 55% 33% / 0.15)" />
                <path d="M62 86 C60 96 58 112 58 128" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
              </svg>
            </motion.div>

            {/* Floating tags with stagger */}
            <motion.div
              className="absolute -top-4 -right-4 bg-background border border-border rounded-xl px-3 py-2 shadow-sm text-xs font-medium whitespace-nowrap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              🚚 Доставка 3–7 дней
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-6 bg-primary text-primary-foreground rounded-xl px-3 py-2 shadow-sm text-xs font-medium whitespace-nowrap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              ✓ 100% оригинал
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Trust badges — stagger in */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Truck size={18} />, title: "Доставка СДЭК", desc: "По всей России, 3–7 дней" },
            { icon: <ShieldCheck size={18} />, title: "100% оригинал", desc: "Сертифицированная продукция" },
            { icon: <Bot size={18} />, title: "Консультация AI", desc: "Подберём добавки именно для вас" },
          ].map((badge) => (
            <StaggerItem key={badge.title}>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  {badge.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 py-12">
      <AnimatedSection>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Категории</h2>
          <Link href="/catalog" className="text-sm text-primary flex items-center gap-1 hover:underline" data-testid="link-all-categories">
            Все
            <ChevronRight size={14} />
          </Link>
        </div>
      </AnimatedSection>

      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <StaggerItem key={cat.id}>
            <Link
              href={`/catalog/${cat.slug}`}
              data-testid={`card-category-${cat.id}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-center"
            >
              <motion.div
                className="text-2xl"
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {CATEGORY_ICONS[cat.slug] || "🌿"}
              </motion.div>
              <span className="text-xs font-medium leading-snug">{cat.name}</span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}

function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { data: categories, isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: fetchCategories,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/products", "featured"],
    queryFn: fetchFeaturedProducts,
  });

  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const featuredProducts: Product[] = Array.isArray(featuredData)
    ? featuredData
    : (featuredData as any)?.products ?? [];

  return (
    <PageTransition>
      <HeroSection />

      {/* Categories */}
      <CategoriesSection categories={displayCategories} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="border-t border-border/40" />
      </div>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <AnimatedSection>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight">Популярные товары</h2>
            <Link href="/catalog" className="text-sm text-primary flex items-center gap-1 hover:underline" data-testid="link-featured-all">
              Смотреть все
              <ChevronRight size={14} />
            </Link>
          </div>
        </AnimatedSection>

        {featuredLoading ? (
          <ProductSkeletonGrid count={8} />
        ) : featuredProducts.length > 0 ? (
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Товары скоро появятся</p>
            <Link href="/catalog" className="text-sm text-primary mt-2 inline-block hover:underline">
              Перейти в каталог
            </Link>
          </div>
        )}
      </section>
    </PageTransition>
  );
}
