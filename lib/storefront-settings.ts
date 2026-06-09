import { getSettings } from '@/lib/settings'
import {
  buildShippingDisplay,
  type ShippingDisplay,
  type ShippingSettings,
} from '@/lib/shipping-display'

export type StorefrontSettings = {
  storeName: string
  storeEmail: string
  storePhone: string
  shipping: ShippingSettings
  shippingDisplay: ShippingDisplay
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const settings = await getSettings()
  const shipping: ShippingSettings = {
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
    defaultRate: settings.shipping.defaultRate,
  }

  return {
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    storePhone: settings.storePhone,
    shipping,
    shippingDisplay: buildShippingDisplay(shipping),
  }
}
