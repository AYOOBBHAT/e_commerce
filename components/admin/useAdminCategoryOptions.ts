'use client'

import { useEffect, useMemo, useState } from 'react'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import type { CategoryRecord } from '@/lib/category-types'

export type CategoryOption = {
  slug: string
  name: string
}

export function useAdminCategoryOptions(currentSlug?: string) {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/categories', { cache: 'no-store' })
        if (res.ok) {
          setCategories(await res.json())
        }
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [])

  const options = useMemo(() => {
    const fromDb: CategoryOption[] = categories.map((category) => ({
      slug: category.slug,
      name: category.name,
    }))

    if (fromDb.length > 0) {
      if (
        currentSlug &&
        !fromDb.some((option) => option.slug === currentSlug)
      ) {
        return [
          ...fromDb,
          { slug: currentSlug, name: `${currentSlug} (legacy)` },
        ]
      }
      return fromDb
    }

    return PRODUCT_CATEGORIES.map((category) => ({
      slug: category.id,
      name: category.name,
    }))
  }, [categories, currentSlug])

  return { options, loaded }
}
