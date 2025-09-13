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
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen ? 'bg-background/95 backdrop-blur-md shadow-lg border-b' : 'bg-background/80 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 mr-2 text-primary" />
            <span className="text-lg sm:text-xl font-bold text-foreground truncate">{SITE_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full ${
                pathname === '/' ? 'text-primary' : 'text-foreground'
              }`}
            >
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="text-foreground p-0 h-auto text-sm font-medium hover:text-primary transition-colors">
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 mt-2">
                {PRODUCT_CATEGORIES.map((category) => (
                  <DropdownMenuItem key={category.id} className="p-0">
                    <Link href={`/category/${category.id}`} className="w-full px-2 py-2 hover:bg-muted rounded-sm transition-colors">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link 
              href="/products"
              className={`text-sm font-medium transition-colors hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full ${
                pathname.startsWith('/products') ? 'text-primary' : 'text-foreground'
              }`}
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
                placeholder="Search products..."
                className="pl-9 h-9 rounded-full bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </form>
            
            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
            
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-primary/10 transition-colors">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[10px] sm:text-xs text-primary-foreground font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
                )}
              </Button>
            </Link>
            
            <Link href="/wishlist" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 transition-colors">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
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
                    <Link href="/account/profile" className="flex w-full items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
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
                    className="flex items-center text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden h-9 w-9 ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          </div>
        </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 sm:top-16 lg:top-20 z-40 bg-background/95 backdrop-blur-md border-b shadow-lg">
          <div className="container mx-auto px-4 sm:px-6 py-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <form onSubmit={handleSearch} className="relative mb-6">
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9 h-11 w-full rounded-lg bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </form>
          
          <nav className="flex flex-col space-y-6">
            <Link 
              href="/"
              className={`text-base font-medium py-2 px-3 rounded-lg transition-colors ${
                pathname === '/' ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            <div className="space-y-4">
              <p className="text-base font-semibold text-foreground">Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCT_CATEGORIES.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.id}`}
                    className="block text-sm text-muted-foreground hover:text-primary py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <Link 
              href="/products"
              className={`text-base font-medium py-2 px-3 rounded-lg transition-colors ${
                pathname.startsWith('/products') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              All Products
            </Link>
            
            <div className="flex space-x-4 pt-4 border-t">
              <Link 
                href="/cart"
                className="flex items-center text-base font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </Link>
              
              <Link 
                href="/wishlist"
                className="flex items-center text-base font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5 mr-2" />
                Wishlist
              </Link>
            </div>
            
            {user ? (
              <div className="pt-4 border-t space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {user.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className="flex items-center text-base font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}
                <Link 
                  href="/account/profile"
                  className="flex items-center text-base font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link 
                  href="/account/orders"
                  className="flex items-center text-base font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PackageSearch className="mr-2 h-4 w-4" />
                  My Orders
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="destructive" 
                  className="w-full justify-start mt-4"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t space-y-3">
                <Button variant="outline" className="w-full h-11" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button variant="default" className="w-full h-11" asChild>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                </Button>
              </div>
            )}
          </nav>
          </div>
        </div>
      )}
    </>
  );
}