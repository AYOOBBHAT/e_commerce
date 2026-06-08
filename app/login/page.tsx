'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SITE_NAME } from '@/lib/constants';
import { useSession } from '@/components/SessionProvider';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" aria-hidden />
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { user, isLoading, setUser, refreshSession } = useSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      if (result.user) {
        setUser({
          id: String(result.user.id),
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        });
      }

      setIsRedirecting(true);
      toast.success('Welcome back!');
      router.replace('/');
      void refreshSession();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  if (isLoading || user || isRedirecting) {
    return (
      <AuthLoadingScreen
        message={
          isRedirecting || user
            ? 'Taking you to the store...'
            : 'Checking your session...'
        }
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-400/10 border border-emerald-400/40 mb-4 shadow-[0_10px_25px_rgba(16,185,129,0.35)]">
            <ShoppingBag className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{SITE_NAME}</h1>
          <p className="text-sm text-slate-300 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm p-6 md:p-7 rounded-2xl shadow-xl border border-slate-700/70">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      type="email" 
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="text-sm text-right">
              <Link href="/forgot-password" className="text-emerald-300 hover:text-emerald-200">
                Forgot password?
              </Link>
            </div>
            
              <Button
                type="submit"
                className="w-full mt-1 bg-emerald-400 text-slate-950 hover:bg-emerald-300 font-semibold shadow-[0_12px_28px_rgba(16,185,129,0.4)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4">
            <a
              href="/api/auth/google"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-slate-700/80 bg-slate-900/60 text-slate-50 hover:bg-slate-800 transition-colors"
            >
              <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
              Continue with Google
            </a>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-400">Don&apos;t have an account? </span>
            <Link href="/register" className="text-emerald-300 hover:text-emerald-200 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
