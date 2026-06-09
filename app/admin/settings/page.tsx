"use client";
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Save, CheckCircle2 } from 'lucide-react';

interface Settings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  maintenanceMode: boolean;
  paymentMethods: Record<string, boolean>;
  shipping: {
    freeShippingThreshold: number;
    defaultRate: number;
  };
  notifications: {
    orderConfirmation: boolean;
    shippingUpdates: boolean;
    lowInventory: boolean;
    marketing: boolean;
  };
}

export default function AdminSettings() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    maintenanceMode: false,
    paymentMethods: {},
    shipping: {
      freeShippingThreshold: 2000,
      defaultRate: 0,
    },
    notifications: {
      orderConfirmation: true,
      shippingUpdates: true,
      lowInventory: true,
      marketing: false,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent, section?: string) => {
    e.preventDefault();
    setIsUpdating(true);
    setShowSuccess(false);

    try {
      const payload: any = {};
      if (section === 'general') {
        payload.storeName = settings.storeName;
        payload.storeEmail = settings.storeEmail;
        payload.storePhone = settings.storePhone;
        payload.maintenanceMode = settings.maintenanceMode;
      } else if (section === 'payment') {
        payload.paymentMethods = settings.paymentMethods;
      } else if (section === 'shipping') {
        payload.shipping = settings.shipping;
      } else if (section === 'notifications') {
        payload.notifications = settings.notifications;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }
      
      // Show warning if present (e.g., Redis not configured)
      if (data.warning) {
        alert(`⚠️ WARNING: ${data.warning}\n\n${data.instructions || ''}`);
      }
      
      // Show success message
      if (data.message) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000); // Show longer if there's a warning
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      
      // Update settings if returned
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400 text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your store settings and preferences</p>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg p-4 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-1.5 rounded-lg">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md transition-all"
          >
            General
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md transition-all"
          >
            Payment
          </TabsTrigger>
          <TabsTrigger 
            value="shipping" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md transition-all"
          >
            Shipping
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md transition-all"
          >
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Store Information</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Update your store details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-gray-900">
              <form onSubmit={(e) => handleSaveSettings(e, 'general')} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="font-semibold text-gray-900 dark:text-gray-100">Store Name</Label>
                  <Input
                    id="storeName"
                    placeholder="Enter store name"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="max-w-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeEmail" className="font-semibold text-gray-900 dark:text-gray-100">Support Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    placeholder="support@example.com"
                    value={settings.storeEmail}
                    onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                    className="max-w-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storePhone" className="font-semibold text-gray-900 dark:text-gray-100">Support Phone</Label>
                  <Input
                    id="storePhone"
                    placeholder="Enter phone number"
                    value={settings.storePhone}
                    onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                    className="max-w-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance" className="font-semibold text-gray-900 dark:text-gray-100">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      When enabled, only admins can access the store
                    </p>
                  </div>
                  <Switch 
                    id="maintenance" 
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>
                
                <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Payment Methods</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure available payment options. Disabled methods will not be visible to customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-gray-900">
              <form onSubmit={(e) => handleSaveSettings(e, 'payment')} className="space-y-4">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Label htmlFor={method.id} className="font-medium cursor-pointer text-gray-900 dark:text-gray-100">
                      {method.name}
                    </Label>
                    <Switch 
                      id={method.id} 
                      checked={settings.paymentMethods[method.id] ?? method.isActive}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          paymentMethods: { ...settings.paymentMethods, [method.id]: checked }
                        })
                      }
                    />
                  </div>
                ))}
                
                <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Shipping Settings</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Free shipping threshold and default rate drive cart, checkout, and order totals.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-gray-900">
              <form onSubmit={(e) => handleSaveSettings(e, 'shipping')} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="freeShipping" className="font-semibold text-gray-900 dark:text-gray-100">Free Shipping Threshold (₹)</Label>
                  <Input
                    id="freeShipping"
                    type="number"
                    min={0}
                    placeholder="Enter amount"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      shipping: { ...settings.shipping, freeShippingThreshold: Number(e.target.value) }
                    })}
                    className="max-w-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Orders above this amount will qualify for free shipping
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultRate" className="font-semibold text-gray-900 dark:text-gray-100">Default Shipping Rate (₹)</Label>
                  <Input
                    id="defaultRate"
                    type="number"
                    min={0}
                    placeholder="Enter amount"
                    value={settings.shipping.defaultRate}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      shipping: { ...settings.shipping, defaultRate: Number(e.target.value) }
                    })}
                    className="max-w-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-b border-gray-200 dark:border-gray-800">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Notification Settings</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure transactional email notifications. These settings are not currently applied to the storefront.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-gray-900">
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Not currently applied to storefront — controls backend email delivery only.
              </p>
              <form onSubmit={(e) => handleSaveSettings(e, 'notifications')} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor="orderConfirmation" className="font-medium cursor-pointer text-gray-900 dark:text-gray-100">Order Confirmation</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send email when order is placed</p>
                    </div>
                    <Switch 
                      id="orderConfirmation" 
                      checked={settings.notifications.orderConfirmation}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, orderConfirmation: checked }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor="shipping" className="font-medium cursor-pointer text-gray-900 dark:text-gray-100">Shipping Updates</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send email when order is shipped</p>
                    </div>
                    <Switch 
                      id="shipping" 
                      checked={settings.notifications.shippingUpdates}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, shippingUpdates: checked }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor="inventory" className="font-medium cursor-pointer text-gray-900 dark:text-gray-100">Low Inventory Alerts</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when stock is low</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Not currently applied to storefront</p>
                    </div>
                    <Switch 
                      id="inventory" 
                      checked={settings.notifications.lowInventory}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, lowInventory: checked }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing" className="font-medium cursor-pointer text-gray-900 dark:text-gray-100">Marketing Emails</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send promotional emails to customers</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Not currently applied to storefront</p>
                    </div>
                    <Switch 
                      id="marketing" 
                      checked={settings.notifications.marketing}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, marketing: checked }
                        })
                      }
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}