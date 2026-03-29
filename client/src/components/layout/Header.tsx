import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, Sun, Moon, Menu, X } from "lucide-react";
import { useCartCount } from "@/hooks/use-cart";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function HerbaiLogo() {
  return (
    <svg
      width="120"
      height="32"
      viewBox="0 0 120 32"
      fill="none"
      aria-label="Herbai"
      className="flex-shrink-0"
    >
      {/* Leaf icon */}
      <path
        d="M4 28C4 28 6 16 14 10C22 4 26 6 26 6C26 6 24 18 16 24C8 30 4 28 4 28Z"
        fill="currentColor"
        className="text-primary"
        opacity="0.9"
      />
      <path
        d="M4 28C8 22 14 18 20 14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Wordmark */}
      <text
        x="34"
        y="22"
        fontFamily="'General Sans', sans-serif"
        fontSize="18"
        fontWeight="600"
        letterSpacing="-0.5"
        fill="currentColor"
        className="text-foreground"
      >
        herbai
      </text>
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog/vitamins", label: "Витамины" },
  { href: "/catalog/omega", label: "Омега-3" },
  { href: "/catalog/protein", label: "Протеин" },
  { href: "/catalog/probiotics", label: "Пробиотики" },
  { href: "/catalog/collagen", label: "Коллаген" },
];

export function Header() {
  const [location, navigate] = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const cartCount = useCartCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue("");
    }
  }

  const dynamicLinks = categories && categories.length > 0
    ? categories.slice(0, 6).map((c) => ({ href: `/catalog/${c.slug}`, label: c.name }))
    : NAV_LINKS;

  return (
    <header
      className={`sticky top-0 z-50 bg-background border-b border-border transition-shadow duration-200 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
          aria-label="Меню"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link href="/" data-testid="link-logo" className="flex items-center">
          <HerbaiLogo />
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="w-full max-w-md flex items-center gap-2">
              <input
                ref={searchRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Поиск витаминов, добавок..."
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-search"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchValue(""); }}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
                data-testid="button-search-close"
                aria-label="Закрыть поиск"
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground rounded-lg border border-border hover:border-primary/30 hover:text-foreground transition-colors w-full max-w-md"
              data-testid="button-search-open"
            >
              <Search size={15} />
              <span>Поиск...</span>
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            className="sm:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setSearchOpen(!searchOpen)}
            data-testid="button-search-mobile"
            aria-label="Поиск"
          >
            <Search size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            data-testid="button-theme-toggle"
            aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link href="/cart" data-testid="link-cart" className="relative p-2 rounded-md hover:bg-accent transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-semibold bg-primary text-primary-foreground rounded-full"
                data-testid="badge-cart-count"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden md:block border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
            {dynamicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`nav-link-${link.href.replace(/\//g, "-")}`}
                className={`whitespace-nowrap px-4 py-2.5 text-sm transition-colors border-b-2 ${
                  location === link.href
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background pb-3">
          <nav className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1">
            {dynamicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`mobile-nav-${link.href.replace(/\//g, "-")}`}
                className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
