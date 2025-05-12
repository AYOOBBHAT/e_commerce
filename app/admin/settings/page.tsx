import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function AdminSettings() {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Implement settings update logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Update your store details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    placeholder="Enter store name"
                    defaultValue="ShopSphere"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Support Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    placeholder="support@example.com"
                    defaultValue="support@shopsphere.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Support Phone</Label>
                  <Input
                    id="storePhone"
                    placeholder="Enter phone number"
                    defaultValue="+1 (123) 456-7890"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="maintenance" />
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                </div>
                
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Configure available payment options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Switch id={method.id} defaultChecked={method.isActive} />
                    <Label htmlFor={method.id}>{method.name}</Label>
                  </div>
                ))}
                
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>
                Configure shipping rates and zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="freeShipping">Free Shipping Threshold</Label>
                  <Input
                    id="freeShipping"
                    type="number"
                    placeholder="Enter amount"
                    defaultValue="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultRate">Default Shipping Rate</Label>
                  <Input
                    id="defaultRate"
                    type="number"
                    placeholder="Enter amount"
                    defaultValue="5"
                  />
                </div>
                
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email and push notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="orderConfirmation" defaultChecked />
                    <Label htmlFor="orderConfirmation">Order Confirmation</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="shipping" defaultChecked />
                    <Label htmlFor="shipping">Shipping Updates</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="inventory" defaultChecked />
                    <Label htmlFor="inventory">Low Inventory Alerts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="marketing" />
                    <Label htmlFor="marketing">Marketing Emails</Label>
                  </div>
                </div>
                
                <Button type="submit" disabled={isUpdating}>
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