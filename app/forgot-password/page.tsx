'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Mail, ShoppingBag } from 'lucide-react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }
      
      setEmailSent(true);
      toast.success('Password reset code sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (emailSent) {
    return (
      <div className="container max-w-md mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Check Your Email</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            We've sent a password reset code to your email address
          </p>
        </div>
        
        <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm border text-center">
          <p className="text-muted-foreground mb-6">
            Please check your email and enter the 6-digit code along with your new password to reset your account.
          </p>
          
          <div className="space-y-4">
            <Link href="/reset-password">
              <Button className="w-full">
                Enter Reset Code
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                form.reset();
              }}
            >
              Send Another Code
            </Button>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-primary hover:text-primary/90 flex items-center justify-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">{SITE_NAME}</h1>
        <p className="text-sm text-muted-foreground mt-1">Reset your password</p>
      </div>
      
      <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm border">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Forgot your password?</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-primary hover:text-primary/90 flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}