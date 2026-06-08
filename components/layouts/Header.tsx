'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  PackageSearch,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SITE_NAME } from '@/lib/constants';
import type { NavCategory } from '@/lib/category-types';
import { useSession } from '../SessionProvider';
import { useCart } from '../CartProvider';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  navCategories: NavCategory[];
}

export default function Header({ user, navCategories }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useSession();
  const { cart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [cartBadgePulse, setCartBadgePulse] = useState(false);
  const prevCartCountRef = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartBadgePulse(true);
      const timer = window.setTimeout(() => setCartBadgePulse(false), 600);
      prevCartCountRef.current = cartCount;
      return () => window.clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  const desktopNavLink = (isActive: boolean) =>
    cn(
      'text-sm font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#B87333] after:transition-all hover:after:w-full',
      isActive
        ? 'text-[#B87333]'
        : 'text-stone-700 hover:text-[#B87333]',
    );

  const mobileNavLink = (isActive: boolean) =>
    cn(
      'block rounded-r-lg border-l-4 py-2.5 pl-3 pr-3 text-base font-medium transition-colors',
      isActive
        ? 'border-[#B87333] bg-[#FAF7F2] text-stone-900'
        : 'border-transparent text-stone-700 hover:bg-stone-50',
    );

  const mobileActionLink =
    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-[#FAF7F2] hover:text-stone-900';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
      setUser(null);
      router.replace('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-stone-200/80' 
            : 'bg-white/90 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 gap-2">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden bg-white">
              <Image
                src="https://res.cloudinary.com/dfocwbzzo/image/upload/v1763995872/ZESCOH_LOGO_o7pz0s.jpg"
                alt="ZeeShaEla & Co. logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold text-stone-900 truncate">{SITE_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/" className={desktopNavLink(pathname === '/')}>
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-sm font-medium text-stone-700 hover:text-[#B87333] transition-colors">
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 mt-2">
                {navCategories.map((category) => (
                  <DropdownMenuItem key={category.slug} className="p-0">
                    <Link href={`/category/${category.slug}`} className="w-full px-2 py-2 hover:bg-muted rounded-sm transition-colors">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/products"
              className={desktopNavLink(pathname.startsWith('/products'))}
            >
              All Products
            </Link>
          </nav>

          {/* Search, Cart, Wishlist, Account */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block w-48 lg:w-64">
              <Input
                type="search"
                placeholder="Search"
                className="pl-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </form>
            
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-slate-900 hover:bg-slate-100"
              onClick={() => router.push('/search')}
              aria-label="Search products"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#B87333] text-[10px] font-semibold text-white shadow-sm shadow-[#B87333]/30 sm:text-xs',
                    cartBadgePulse && 'motion-safe:scale-125 motion-safe:transition-transform motion-safe:duration-300',
                  )}
                  aria-label={`${cartCount} items in cart`}
                >
                  {cartCount}
                </span>
                )}
              </Button>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9 text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-2">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem>
                        <Link href="/admin" className="flex w-full items-center">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Link href="/account/orders" className="flex w-full items-center">
                      <PackageSearch className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/account/settings" className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-stone-600 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-stone-200 text-stone-700 hover:bg-stone-50" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="bg-stone-900 text-white hover:bg-stone-800" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden h-9 w-9 ml-2 text-slate-900 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          </div>
        </div>
        </div>
      </header>

      {/* Mobile Menu — dimmed overlay + opaque drawer */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/45 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className="fixed inset-x-0 top-14 z-[70] flex max-h-[calc(100dvh-3.5rem)] flex-col bg-[#FAF7F2] shadow-2xl sm:top-16 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="container mx-auto px-4 py-5 sm:px-6">
            <form onSubmit={handleSearch} className="relative mb-5">
              <Input
                type="search"
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border-stone-200 bg-white pl-9 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#B87333]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" aria-hidden />
            </form>

            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              <Link
                href="/"
                className={mobileNavLink(pathname === '/')}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              <Link
                href="/products"
                className={mobileNavLink(pathname.startsWith('/products'))}
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </Link>

              <div className="mt-4 border-t border-stone-200/80 pt-4">
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
                  Shop by Category
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {navCategories.map((category) => {
                    const isActive = pathname === `/category/${category.slug}`;
                    return (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className={cn(
                          'rounded-lg px-3 py-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-white font-medium text-stone-900 ring-1 ring-[#B87333]/30'
                            : 'text-stone-600 hover:bg-white/80 hover:text-stone-900',
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-stone-200/80 pt-3">
                <Link
                  href="/cart"
                  className={mobileActionLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="mr-2.5 h-4 w-4 text-[#B87333]" aria-hidden />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#B87333] px-1.5 text-[11px] font-semibold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {user ? (
                <div className="mt-4 space-y-1 border-t border-stone-200/80 pt-4">
                  <div className="mb-3 rounded-xl border border-stone-200/80 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-stone-900">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-stone-500">{user.email}</p>
                  </div>

                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className={mobileActionLink}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="mr-2.5 h-4 w-4 text-stone-500" aria-hidden />
                      Admin Dashboard
                    </Link>
                  )}

                  <Link
                    href="/account/orders"
                    className={mobileActionLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PackageSearch className="mr-2.5 h-4 w-4 text-stone-500" aria-hidden />
                    My Orders
                  </Link>

                  <Link
                    href="/account/settings"
                    className={mobileActionLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="mr-2.5 h-4 w-4 text-stone-500" aria-hidden />
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="mr-2.5 h-4 w-4" aria-hidden />
                    Log out
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5 border-t border-stone-200/80 pt-4">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-full border-stone-200 text-stone-700 hover:bg-white"
                    asChild
                  >
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    className="h-11 w-full rounded-full bg-stone-900 text-white hover:bg-stone-800"
                    asChild
                  >
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Create account
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}