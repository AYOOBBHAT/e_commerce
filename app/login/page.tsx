'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSession } from '@/components/SessionProvider'
import {
  AuthDivider,
  AuthFooterLink,
  AuthLoadingScreen,
  AuthShell,
  GoogleSignInButton,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthShell'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const { user, isLoading, setUser, refreshSession } = useSession()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/')
    }
  }, [user, isLoading, router])

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      if (result.user) {
        setUser({
          id: String(result.user.id),
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        })
      }

      setIsRedirecting(true)
      toast.success('Welcome back!')
      router.replace('/')
      void refreshSession()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  if (isLoading || user || isRedirecting) {
    return (
      <AuthLoadingScreen
        message={
          isRedirecting || user
            ? 'Taking you to the store...'
            : 'Checking your session...'
        }
      />
    )
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to your account">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-700">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#B87333]"
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
                <FormLabel className="text-stone-700">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="rounded-xl border-stone-200 bg-white pr-10 focus-visible:ring-[#B87333]"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-stone-500 hover:text-stone-900"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          <div className="text-right text-sm">
            <Link href="/forgot-password" className={authLinkClass}>
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className={authPrimaryButtonClass}
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

      <AuthDivider />
      <GoogleSignInButton />
      <AuthFooterLink
        prompt="Don't have an account?"
        href="/register"
        label="Sign up"
      />
    </AuthShell>
  )
}
