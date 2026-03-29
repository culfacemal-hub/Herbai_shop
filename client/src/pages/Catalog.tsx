import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, ChevronDown, X, Search } from "lucide-react";
import { fetchProducts, fetchCategories, type ProductFilters } from "@/lib/api";
import type { Product, Category } from "@shared/schema";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageTransition, StaggerGrid, StaggerItem } from "@/components/AnimatedSection";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

type SortOption = "popular" | "price_asc" | "price_desc" | "new";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Популярные" },
  { value: "price_asc", label: "Сначала дешёвые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "new", label: "Новинки" },
];

const PAGE_SIZE = 16;

function FilterPanel({
  categories,
  selectedCategoryId,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onInStockChange,
  onReset,
}: {
  categories: Category[];
  selectedCategoryId?: number;
  onCategoryChange: (id: number | undefined) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  inStockOnly: boolean;
  onInStockChange: (v: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Категории</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              !selectedCategoryId
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-foreground"
            }`}
            data-testid="filter-category-all"
          >
            Все категории
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              }`}
              data-testid={`filter-category-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Цена</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(v) => onPriceRangeChange(v as [number, number])}
            min={0}
            max={10000}
            step={100}
            className="mb-3"
            data-testid="filter-price-slider"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{priceRange[0].toLocaleString("ru-RU")} ₽</span>
            <span>{priceRange[1].toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      </div>

      {/* In stock */}
      <div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(v) => onInStockChange(!!v)}
            data-testid="filter-in-stock"
          />
          <label htmlFor="in-stock" className="text-sm cursor-pointer">
            Только в наличии
          </label>
        </div>
      </div>

      {/* Reset */}
      <Button variant="outline" size="sm" onClick={onReset} className="w-full" data-testid="button-filter-reset">
        Сбросить фильтры
      </Button>
    </div>
  );
}

function ProductSkeletonGrid({ count = 16 }: { count?: number }) {
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

export default function Catalog() {
  const params = useParams<{ slug?: string }>();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.hash.split("?")[1] || "" : ""
  );

  const [sort, setSort] = useState<SortOption>("popular");
  const [page, setPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery] = useState(urlParams.get("search") || "");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: fetchCategories,
  });

  // When slug changes, find and set category
  useEffect(() => {
    if (params.slug && categories) {
      const cat = categories.find((c) => c.slug === params.slug);
      setSelectedCategoryId(cat?.id);
    } else if (!params.slug) {
      setSelectedCategoryId(undefined);
    }
  }, [params.slug, categories]);

  const filters: ProductFilters = {
    sort,
    page,
    limit: PAGE_SIZE,
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  };

  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 30_000,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const currentCategory = categories?.find((c) => c.id === selectedCategoryId);
  const pageTitle = currentCategory?.name ?? (searchQuery ? `Поиск: "${searchQuery}"` : "Каталог");

  function resetFilters() {
    setSelectedCategoryId(undefined);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
    setPage(1);
  }

  const filterContent = (
    <FilterPanel
      categories={categories ?? []}
      selectedCategoryId={selectedCategoryId}
      onCategoryChange={(id) => { setSelectedCategoryId(id); setPage(1); }}
      priceRange={priceRange}
      onPriceRangeChange={(r) => { setPriceRange(r); setPage(1); }}
      inStockOnly={inStockOnly}
      onInStockChange={(v) => { setInStockOnly(v); setPage(1); }}
      onReset={resetFilters}
    />
  );

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
        <a href="/#/" className="hover:text-foreground transition-colors">Главная</a>
        <span>/</span>
        <span className="text-foreground">Каталог</span>
        {currentCategory && (
          <>
            <span>/</span>
            <span className="text-foreground">{currentCategory.name}</span>
          </>
        )}
      </nav>

      {/* Header row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-catalog-title">{pageTitle}</h1>
          {total > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {total.toLocaleString("ru-RU")} товаров
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs w-40" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mobile filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden gap-1.5 text-xs" data-testid="button-filters-mobile">
                <SlidersHorizontal size={14} />
                Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {filterContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          {filterContent}
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <ProductSkeletonGrid count={PAGE_SIZE} />
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground" data-testid="text-empty-catalog">
              <div className="text-4xl mb-3">🌿</div>
              <p className="text-sm font-medium mb-1">Товары не найдены</p>
              <p className="text-xs mb-4">Попробуйте изменить параметры поиска</p>
              <Button variant="outline" size="sm" onClick={resetFilters} data-testid="button-reset-empty">
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <>
              <StaggerGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} />
                  </StaggerItem>
                ))}
              </StaggerGrid>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10" data-testid="pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    data-testid="button-page-prev"
                  >
                    Назад
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    data-testid="button-page-next"
                  >
                    Далее
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
