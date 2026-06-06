"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AccountSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    otp: '',
    step: 'email' as 'email' | 'otp', // 'email' to request OTP, 'otp' to verify
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUpdating(true);

    try {
      const res = await fetch('/api/auth/change-email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: emailForm.newEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setEmailForm({ ...emailForm, step: 'otp' });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUpdating(true);

    try {
      const res = await fetch('/api/auth/change-email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newEmail: emailForm.newEmail,
          otp: emailForm.otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

      setUser({ ...user, email: emailForm.newEmail });
      setEmailForm({ newEmail: '', otp: '', step: 'email' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6 bg-gray-50 min-h-screen px-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-lg p-4 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">Email updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-900 rounded-lg p-4 flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <Card className="border-2 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-xl flex items-center gap-2 text-gray-900">
            <Mail className="h-5 w-5" />
            Change Email Address
          </CardTitle>
          <CardDescription className="text-gray-600">
            Update your email address. You'll receive an OTP to verify the new email.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div>
              <Label className="text-sm font-semibold text-gray-800">Current Email</Label>
              <p className="font-semibold text-gray-900 mt-2 text-lg">{user?.email || '—'}</p>
            </div>
          </div>

          {emailForm.step === 'email' ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail" className="font-semibold text-gray-900">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter new email address"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  required
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <Button type="submit" disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Mail className="mr-2 h-4 w-4" />
                {isUpdating ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-900">New Email</Label>
                <Input
                  value={emailForm.newEmail}
                  disabled
                  className="bg-gray-100 border-2 border-gray-300 text-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp" className="font-semibold text-gray-900">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={emailForm.otp}
                  onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value })}
                  maxLength={6}
                  required
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <p className="text-sm text-gray-600">
                  Check your email ({emailForm.newEmail}) for the OTP code
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Verifying...' : 'Verify & Update Email'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailForm({ newEmail: '', otp: '', step: 'email' })}
                  disabled={isUpdating}
                  className="border-2 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
