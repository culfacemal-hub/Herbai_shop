import { Link } from "wouter";
import { MapPin, Phone, Mail, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="24" height="24" viewBox="0 0 26 26" fill="none" className="text-primary" aria-hidden>
                <path
                  d="M2 24C2 24 4 14 11 8C18 2 22 4 22 4C22 4 20 16 13 22C6 28 2 24 2 24Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path d="M2 24C6 18 11 14 17 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              </svg>
              <span className="font-semibold text-base tracking-tight">herbai</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Витамины и добавки для здоровья и активной жизни. Только оригинальная продукция.
            </p>
          </div>

          {/* Delivery */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Доставка</h3>
            <div className="flex items-start gap-2 mb-2">
              <Truck size={15} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">СДЭК по всей России</p>
                <p className="text-xs text-muted-foreground">3–7 рабочих дней</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Самовывоз Москва</p>
                <p className="text-xs text-muted-foreground">ул. Ленина, 1</p>
              </div>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Каталог</h3>
            <ul className="space-y-1.5">
              {[
                ["Витамины", "/catalog/vitamins"],
                ["Омега-3", "/catalog/omega"],
                ["Протеин", "/catalog/protein"],
                ["Пробиотики", "/catalog/probiotics"],
                ["Коллаген", "/catalog/collagen"],
                ["Все товары", "/catalog"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-link-${label.toLowerCase()}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Контакты</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} className="text-primary flex-shrink-0" />
                <span>+7 (495) 000-00-00</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="text-primary flex-shrink-0" />
                <span>hello@herbai.com</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Пн–Пт: 9:00–20:00<br />
                Сб–Вс: 10:00–18:00
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>© 2025 Herbai. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <span>ИП Иванов И.И.</span>
            <span>ОГРНИП: 123456789012345</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
