import type { Settings } from '@/lib/settings'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSettingsUpdate(
  updates: Partial<Settings>,
): { valid: true } | { valid: false; error: string } {
  if (updates.storeName !== undefined) {
    const name = updates.storeName.trim()
    if (!name) {
      return { valid: false, error: 'Store name is required.' }
    }
  }

  if (updates.storeEmail !== undefined) {
    const email = updates.storeEmail.trim()
    if (!email || !EMAIL_PATTERN.test(email)) {
      return { valid: false, error: 'Support email must be a valid email address.' }
    }
  }

  if (updates.storePhone !== undefined && updates.storePhone.trim()) {
    const digits = updates.storePhone.replace(/\D/g, '')
    if (digits.length < 10) {
      return { valid: false, error: 'Support phone must contain at least 10 digits.' }
    }
  }

  if (updates.shipping) {
    const { freeShippingThreshold, defaultRate } = updates.shipping
    if (
      freeShippingThreshold !== undefined &&
      (typeof freeShippingThreshold !== 'number' ||
        !Number.isFinite(freeShippingThreshold) ||
        freeShippingThreshold < 0)
    ) {
      return {
        valid: false,
        error: 'Free shipping threshold must be zero or a positive number.',
      }
    }
    if (
      defaultRate !== undefined &&
      (typeof defaultRate !== 'number' ||
        !Number.isFinite(defaultRate) ||
        defaultRate < 0)
    ) {
      return {
        valid: false,
        error: 'Default shipping rate must be zero or a positive number.',
      }
    }
  }

  return { valid: true }
}
