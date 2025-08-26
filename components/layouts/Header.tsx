'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, ShoppingCart, Heart, User, Menu, X, LogOut, 
  PackageSearch, ShoppingBag, Settings, LayoutDashboard
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
import { PRODUCT_CATEGORIES, SITE_NAME } from '@/lib/constants';
import { useSession } from '../SessionProvider';
import { useCart } from '../CartProvider';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { refreshSession } = useSession();
  const { cart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await refreshSession();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? 'bg-background shadow-sm' : 'bg-background/80 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <ShoppingBag className="h-8 w-8 mr-2 text-primary" />
            <span className="text-xl font-bold text-foreground">{SITE_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/' ? 'text-primary' : 'text-foreground'
              }`}
            >
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="text-foreground p-0 h-auto text-sm font-medium">
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {PRODUCT_CATEGORIES.map((category) => (
                  <DropdownMenuItem key={category.id}>
                    <Link href={`/category/${category.id}`} className="w-full">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link 
              href="/products"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith('/products') ? 'text-primary' : 'text-foreground'
              }`}
            >
              All Products
            </Link>
          </nav>

          {/* Search, Cart, Wishlist, Account */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative w-56">
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9 h-9 rounded-full bg-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </form>
            
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </Button>
            </Link>
            
            <Link href="/wishlist">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem>
                        <Link href="/admin" className="flex w-full">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Link href="/account/profile" className="flex w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/account/orders" className="flex w-full">
                      <PackageSearch className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/account/settings" className="flex w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t px-4 py-5">
          <form onSubmit={handleSearch} className="relative mb-4">
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9 h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </form>
          
          <nav className="flex flex-col space-y-4">
            <Link 
              href="/"
              className={`text-sm font-medium ${pathname === '/' ? 'text-primary' : 'text-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            <div className="space-y-3">
              <p className="text-sm font-medium">Categories</p>
              <div className="pl-4 space-y-2 border-l">
                {PRODUCT_CATEGORIES.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.id}`}
                    className="block text-sm text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <Link 
              href="/products"
              className={`text-sm font-medium ${pathname.startsWith('/products') ? 'text-primary' : 'text-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              All Products
            </Link>
            
            <div className="flex space-x-4 pt-2">
              <Link 
                href="/cart"
                className="flex items-center text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
              </Link>
              
              <Link 
                href="/wishlist"
                className="flex items-center text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5 mr-2" />
                Wishlist
              </Link>
            </div>
            
            {user ? (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-3">Account</p>
                {user.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className="flex items-center text-sm mb-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}
                <Link 
                  href="/account/profile"
                  className="flex items-center text-sm mb-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link 
                  href="/account/orders"
                  className="flex items-center text-sm mb-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PackageSearch className="mr-2 h-4 w-4" />
                  My Orders
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full justify-start text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button variant="default" className="w-full" asChild>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}