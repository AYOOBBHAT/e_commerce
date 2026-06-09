// Settings management with MongoDB (source of truth) and Redis (fast cache for middleware)
import { connectToDatabase } from './db';
import Settings from '@/models/Settings';
import { getRedisClient } from './redis';

export interface Settings {
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

// In-memory cache (fallback when DB/Redis unavailable)
let settingsCache: Settings = {
  storeName: 'ZeeShaEla & Co.',
  storeEmail: 'support@zeeshaela.com',
  storePhone: '',
  maintenanceMode: false,
  paymentMethods: {
    phonepe: true,
    razorpay: true,
    cashfree: true,
    cod: true,
  },
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
};

// Synchronous getter for in-memory cache (used by email service)
// Note: This returns cached values, which may be slightly stale
// For fresh data, use async getSettings()
export function getSettingsSync(): Settings {
  return settingsCache;
}

// Get settings from MongoDB (source of truth)
export async function getSettings(): Promise<Settings> {
  try {
    await connectToDatabase();
    let settingsDoc = await Settings.findOne();
    if (!settingsDoc) {
      // Create default settings if none exist
      settingsDoc = await Settings.create({
        storeName: 'ZeeShaEla & Co.',
        storeEmail: 'support@zeeshaela.com',
        maintenanceMode: false,
        paymentMethods: { phonepe: true, razorpay: true, cashfree: true, cod: true },
        shipping: { freeShippingThreshold: 2000, defaultRate: 0 },
        notifications: { orderConfirmation: true, shippingUpdates: true, lowInventory: true, marketing: false },
      });
    }
    
    const settings: Settings = {
      storeName: settingsDoc.storeName,
      storeEmail: settingsDoc.storeEmail,
      storePhone: settingsDoc.storePhone,
      maintenanceMode: settingsDoc.maintenanceMode,
      paymentMethods: {
        phonepe: settingsDoc.paymentMethods.phonepe,
        razorpay: settingsDoc.paymentMethods.razorpay,
        cashfree: settingsDoc.paymentMethods.cashfree,
        cod: settingsDoc.paymentMethods.cod,
      },
      shipping: {
        freeShippingThreshold: settingsDoc.shipping.freeShippingThreshold,
        defaultRate: settingsDoc.shipping.defaultRate,
      },
      notifications: {
        orderConfirmation: settingsDoc.notifications.orderConfirmation,
        shippingUpdates: settingsDoc.notifications.shippingUpdates,
        lowInventory: settingsDoc.notifications.lowInventory,
        marketing: settingsDoc.notifications.marketing,
      },
    };
    
    // Update in-memory cache
    settingsCache = settings;
    return settings;
  } catch (error) {
    console.error('[Settings] Error fetching from DB, using cache:', error);
    return settingsCache;
  }
}

// Update settings in MongoDB and sync to Redis
export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  try {
    await connectToDatabase();
    let settingsDoc = await Settings.findOne();
    if (!settingsDoc) {
      // Create default settings if none exist
      settingsDoc = await Settings.create({
        storeName: 'ZeeShaEla & Co.',
        storeEmail: 'support@zeeshaela.com',
        maintenanceMode: false,
        paymentMethods: { phonepe: true, razorpay: true, cashfree: true, cod: true },
        shipping: { freeShippingThreshold: 2000, defaultRate: 0 },
        notifications: { orderConfirmation: true, shippingUpdates: true, lowInventory: true, marketing: false },
      });
    }
    
    // Update fields
    if (updates.storeName !== undefined) settingsDoc.storeName = updates.storeName.trim();
    if (updates.storeEmail !== undefined) settingsDoc.storeEmail = updates.storeEmail.trim();
    if (updates.storePhone !== undefined) settingsDoc.storePhone = updates.storePhone.trim();
    if (updates.maintenanceMode !== undefined) {
      settingsDoc.maintenanceMode = updates.maintenanceMode;
      // Sync maintenance mode to Redis immediately (BEFORE saving to ensure it's ready)
      await syncMaintenanceModeToRedis(updates.maintenanceMode);
    }
    
    if (updates.paymentMethods) {
      if (updates.paymentMethods.phonepe !== undefined) settingsDoc.paymentMethods.phonepe = updates.paymentMethods.phonepe;
      if (updates.paymentMethods.razorpay !== undefined) settingsDoc.paymentMethods.razorpay = updates.paymentMethods.razorpay;
      if (updates.paymentMethods.cashfree !== undefined) settingsDoc.paymentMethods.cashfree = updates.paymentMethods.cashfree;
      if (updates.paymentMethods.cod !== undefined) settingsDoc.paymentMethods.cod = updates.paymentMethods.cod;
    }
    
    if (updates.shipping) {
      if (updates.shipping.freeShippingThreshold !== undefined) settingsDoc.shipping.freeShippingThreshold = updates.shipping.freeShippingThreshold;
      if (updates.shipping.defaultRate !== undefined) settingsDoc.shipping.defaultRate = updates.shipping.defaultRate;
    }
    
    if (updates.notifications) {
      if (updates.notifications.orderConfirmation !== undefined) settingsDoc.notifications.orderConfirmation = updates.notifications.orderConfirmation;
      if (updates.notifications.shippingUpdates !== undefined) settingsDoc.notifications.shippingUpdates = updates.notifications.shippingUpdates;
      if (updates.notifications.lowInventory !== undefined) settingsDoc.notifications.lowInventory = updates.notifications.lowInventory;
      if (updates.notifications.marketing !== undefined) settingsDoc.notifications.marketing = updates.notifications.marketing;
    }
    
    await settingsDoc.save();
    
    // Update in-memory cache
    const updatedSettings = await getSettings();
    
    // If maintenance mode was updated, verify Redis sync one more time
    if (updates.maintenanceMode !== undefined) {
      const { isMaintenanceMode } = await import('./maintenance-mode');
      const redisValue = await isMaintenanceMode();
      if (redisValue !== updatedSettings.maintenanceMode) {
        console.warn(`[Settings] Redis sync mismatch detected! DB: ${updatedSettings.maintenanceMode}, Redis: ${redisValue}. Re-syncing...`);
        await syncMaintenanceModeToRedis(updatedSettings.maintenanceMode);
      }
    }
    
    return updatedSettings;
  } catch (error) {
    console.error('[Settings] Error updating settings:', error);
    // Fallback: update in-memory cache
    settingsCache = { ...settingsCache, ...updates };
    return settingsCache;
  }
}

// Sync maintenance mode to Redis (fast flag for middleware)
async function syncMaintenanceModeToRedis(enabled: boolean): Promise<void> {
  try {
    // Use the edge-safe maintenance mode module
    const { setMaintenanceMode } = await import('./maintenance-mode');
    await setMaintenanceMode(enabled);
    console.log(`[Settings] Maintenance mode ${enabled ? 'enabled' : 'disabled'} - synced to Redis`);
  } catch (error) {
    console.error('[Settings] Error syncing maintenance mode to Redis:', error);
    throw error; // Re-throw to ensure caller knows sync failed
  }
}

// Initialize maintenance mode from MongoDB to Redis (call on startup or when fetching settings)
export async function initializeMaintenanceModeFromDB(): Promise<void> {
  try {
    await connectToDatabase();
    const settingsDoc = await Settings.findOne();
    if (settingsDoc) {
      const { setMaintenanceMode } = await import('./maintenance-mode');
      await setMaintenanceMode(settingsDoc.maintenanceMode);
      console.log(`[Settings] Initialized maintenance mode from DB: ${settingsDoc.maintenanceMode}`);
    }
  } catch (error) {
    console.error('[Settings] Error initializing maintenance mode from DB:', error);
  }
}


