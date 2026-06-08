'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
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
import {
  AuthShell,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthShell';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      setEmailSent(true);
      toast.success('Password reset code sent to your email');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We've sent a password reset code to your inbox"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#4A6741]/30 bg-[#4A6741]/10">
            <Mail className="h-6 w-6 text-[#4A6741]" aria-hidden />
          </div>
          <p className="mb-6 text-sm text-stone-600">
            Enter the 6-digit code with your new password to reset your account.
          </p>
          <div className="w-full space-y-3">
            <Button className={authPrimaryButtonClass} asChild>
              <Link href="/reset-password">Enter reset code</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full border-stone-200 text-stone-700 hover:bg-stone-50"
              onClick={() => {
                setEmailSent(false);
                form.reset();
              }}
            >
              Send another code
            </Button>
          </div>
          <Link
            href="/login"
            className={`${authLinkClass} mt-6 inline-flex items-center`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a code to reset your password"
    >
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
                    className="rounded-xl border-stone-200 focus-visible:ring-[#B87333]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className={authPrimaryButtonClass}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send reset code'}
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className={`${authLinkClass} mt-6 inline-flex w-full items-center justify-center`}
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
        Back to sign in
      </Link>
    </AuthShell>
  );
}
