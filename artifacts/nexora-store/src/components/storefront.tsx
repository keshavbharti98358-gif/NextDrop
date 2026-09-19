import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, Heart, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { getGetCartQueryKey, useAddCartItem, useGetCart } from "@workspace/api-client-react";
import type { Category, Product } from "@workspace/api-client-react";

export const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;

export function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const cart = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const nav = [
    { href: "/shop", label: "Shop" },
    { href: "/shop?sort=bestselling", label: "Best sellers" },
    { href: "/shop?deal=true", label: "Offers" },
  ];
  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-background">
        Complimentary shipping on orders over $75
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
            <span className="flex h-9 w-9 items-center justify-center bg-primary font-display text-xl font-bold">N</span>
            <span className="font-display text-xl font-bold tracking-[-0.06em]">NEXORA</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={`text-sm font-semibold transition-colors hover:text-primary ${location === item.href ? "text-primary" : "text-foreground/70"}`} data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/shop" className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-muted sm:flex" data-testid="link-search">
              <Search size={19} strokeWidth={1.8} />
            </Link>
            <Link href="/account" className="hidden px-3 py-2 text-sm font-semibold hover:text-primary sm:block" data-testid="link-account">Account</Link>
            <Link href="/cart" className="relative flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold hover:border-foreground" data-testid="link-cart">
              <ShoppingBag size={17} strokeWidth={1.8} />
              <span className="hidden sm:inline">Bag</span>
              <span className="font-mono-ui text-[10px]">{cart.data?.itemCount ?? 0}</span>
            </Link>
            <button type="button" className="ml-1 flex h-10 w-10 items-center justify-center md:hidden" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" aria-label="Toggle menu">
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4">
              {nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="text-lg font-display font-semibold" data-testid={`link-mobile-${item.label.toLowerCase().replace(" ", "-")}`}>{item.label}</Link>)}
              <Link href="/account" onClick={() => setMenuOpen(false)} className="text-lg font-display font-semibold" data-testid="link-mobile-account">Account</Link>
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-foreground px-5 py-14 text-background lg:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-3" data-testid="link-footer-logo">
            <span className="flex h-9 w-9 items-center justify-center bg-primary font-display text-xl font-bold text-foreground">N</span>
            <span className="font-display text-xl font-bold tracking-[-0.06em]">NEXORA</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-background/60">Useful things, found with a sharper eye. A small edit of products for the way you live now.</p>
        </div>
        <div><p className="font-mono-ui text-[10px] text-background/45">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-background/75"><Link href="/shop" data-testid="link-footer-shop">Shop all</Link><Link href="/shop?deal=true" data-testid="link-footer-offers">Current offers</Link><Link href="/account" data-testid="link-footer-account">Your orders</Link></div></div>
        <div><p className="font-mono-ui text-[10px] text-background/45">Help</p><div className="mt-4 flex flex-col gap-3 text-sm text-background/75"><Link href="/shipping" data-testid="link-footer-shipping">Shipping</Link><Link href="/returns" data-testid="link-footer-returns">Returns</Link><Link href="/contact" data-testid="link-footer-contact">Contact</Link></div></div>
        <div><p className="font-mono-ui text-[10px] text-background/45">Fine print</p><div className="mt-4 flex flex-col gap-3 text-sm text-background/75"><Link href="/privacy" data-testid="link-footer-privacy">Privacy</Link><Link href="/terms" data-testid="link-footer-terms">Terms</Link><Link href="/cookies" data-testid="link-footer-cookies">Cookies</Link></div></div>
      </div>
      <div className="mx-auto mt-14 flex max-w-[1400px] flex-col justify-between gap-3 border-t border-background/15 pt-5 text-[10px] uppercase tracking-[0.18em] text-background/40 sm:flex-row"><span>© 2025 Nexora Supply Co.</span><span>Good finds, no noise.</span></div>
    </footer>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "quiet" }) {
  return <button {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-bold transition-all active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variant === "primary" ? "bg-primary text-primary-foreground hover:brightness-95" : variant === "outline" ? "border border-foreground/25 hover:border-foreground hover:bg-muted" : "px-1 text-foreground/65 hover:text-foreground"} ${className}`} />;
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const queryClient = useQueryClient();
  const add = useAddCartItem();
  const addToCart = () => {
    add.mutate({ data: { productId: product.id, quantity: 1 } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }); setAdded(true); window.setTimeout(() => setAdded(false), 1600); } });
  };
  return (
    <article className={`product-card reveal stagger-${Math.min(index + 1, 5)} group relative`} data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-[.88] overflow-hidden bg-muted">
        <Link href={`/product/${product.slug}`} data-testid={`link-product-${product.id}`}>
          {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="product-image h-full w-full object-cover" /> : <div className="h-full w-full bg-secondary/20" />}
        </Link>
        <div className="absolute left-3 top-3 flex gap-2">
          {(product.badge || product.deal) && <span className="bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-[.12em]">{product.badge || "Good deal"}</span>}
        </div>
        <button type="button" onClick={() => setSaved(!saved)} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 transition-colors ${saved ? "text-primary" : "text-foreground"}`} data-testid={`button-wishlist-${product.id}`} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
        <Button variant="primary" onClick={addToCart} disabled={add.isPending} className={`absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${added ? "bg-secondary text-background" : ""}`} data-testid={`button-add-${product.id}`}>{added ? <><Check size={15} /> Added to bag</> : <><ShoppingBag size={15} /> Add to bag</>}</Button>
      </div>
      <Link href={`/product/${product.slug}`} className="block pt-4" data-testid={`link-product-info-${product.id}`}>
        <div className="flex justify-between gap-3"><h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3><span className="shrink-0 font-mono-ui text-[11px]">{money(product.price)}</span></div>
        <p className="mt-2 text-xs text-muted-foreground">{product.category} <span className="mx-1">/</span> {product.rating?.toFixed(1)} rating</p>
      </Link>
    </article>
  );
}

export function ProductStrip({ title, eyebrow, products = [], href = "/shop" }: { title: string; eyebrow?: string; products?: Product[]; href?: string }) {
  return <section className="mx-auto max-w-[1400px] px-5 lg:px-10"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="font-mono-ui text-[10px] text-primary">{eyebrow || "The edit"}</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] md:text-4xl">{title}</h2></div><Link href={href} className="group hidden items-center gap-2 text-sm font-bold sm:flex" data-testid={`link-see-${title.toLowerCase().replaceAll(" ", "-")}`}>See all <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">{products.slice(0, 4).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div></section>;
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mb-10 max-w-2xl"><p className="font-mono-ui text-[10px] text-primary">{eyebrow}</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] md:text-6xl">{title}</h1>{description && <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>}</div>;
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: count }).map((_, index) => <div key={index} className="animate-pulse"><div className="aspect-[.88] bg-muted" /><div className="mt-4 h-5 w-3/4 bg-muted" /><div className="mt-2 h-3 w-1/2 bg-muted" /></div>)}</div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"><p className="font-display text-2xl font-semibold">The edit is taking a moment.</p><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">We could not reach the catalog. Try again in a breath.</p>{onRetry && <Button className="mt-6" onClick={onRetry} data-testid="button-retry">Try again</Button>}</div>;
}

export function EmptyState({ title = "Nothing here yet", body = "Try a different route through the edit." }: { title?: string; body?: string }) {
  return <div className="border border-dashed border-border px-6 py-16 text-center"><Sparkles className="mx-auto text-primary" size={24} /><p className="mt-4 font-display text-2xl font-semibold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{body}</p><Link href="/shop" className="mt-6 inline-flex text-sm font-bold underline underline-offset-4" data-testid="link-empty-shop">Browse the shop</Link></div>;
}

export function QuantityControl({ value, onChange, max = 20 }: { value: number; onChange: (value: number) => void; max?: number }) {
  return <div className="flex h-10 items-center border border-border"><button type="button" className="flex h-full w-9 items-center justify-center hover:bg-muted" onClick={() => onChange(Math.max(1, value - 1))} data-testid="button-quantity-minus"><Minus size={14} /></button><span className="w-8 text-center font-mono-ui text-[11px]" data-testid="text-quantity">{value}</span><button type="button" className="flex h-full w-9 items-center justify-center hover:bg-muted" onClick={() => onChange(Math.min(max, value + 1))} data-testid="button-quantity-plus"><Plus size={14} /></button></div>;
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{categories.slice(0, 4).map((category, index) => <Link href={`/shop?category=${category.slug}`} key={category.id} className={`reveal stagger-${index + 1} group relative aspect-[1.1] overflow-hidden bg-secondary/20`} data-testid={`card-category-${category.id}`}>{category.image ? <img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="h-full w-full bg-secondary/30" />}<div className="absolute inset-0 bg-gradient-to-t from-foreground/75 to-transparent" /><div className="absolute bottom-4 left-4 text-background"><p className="font-display text-xl font-semibold">{category.name}</p><p className="mt-1 text-xs text-background/70">{category.productCount} pieces</p></div></Link>)}</div>;
}