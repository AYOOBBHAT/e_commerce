'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { StorefrontSettings } from '@/lib/storefront-settings'

const StorefrontSettingsContext = createContext<StorefrontSettings | null>(null)

export function StorefrontSettingsProvider({
  value,
  children,
}: {
  value: StorefrontSettings
  children: ReactNode
}) {
  return (
    <StorefrontSettingsContext.Provider value={value}>
      {children}
    </StorefrontSettingsContext.Provider>
  )
}

export function useStorefrontSettings(): StorefrontSettings {
  const context = useContext(StorefrontSettingsContext)
  if (!context) {
    throw new Error('useStorefrontSettings must be used within StorefrontSettingsProvider')
  }
  return context
}
