'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown, ArrowUp, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CategoryRecord } from '@/lib/category-types'

export default function CategoriesTable() {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' })
      if (res.ok) {
        setCategories(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const patchCategory = async (
    slug: string,
    patch: Partial<CategoryRecord>,
  ) => {
    setSavingSlug(slug)
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }
      await loadCategories()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSavingSlug(null)
    }
  }

  const reorder = async (slug: string, direction: 'up' | 'down') => {
    const index = categories.findIndex((category) => category.slug === slug)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const next = [...categories]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)

    setSavingSlug(slug)
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: next.map((category) => category.slug) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Reorder failed')
      }
      setCategories(next.map((category, sortOrder) => ({ ...category, sortOrder })))
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Reorder failed')
      await loadCategories()
    } finally {
      setSavingSlug(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading categories…</p>
  }

  if (!categories.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No categories in the database yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Run <code className="rounded bg-muted px-1">npm run seed:categories</code>{' '}
          or create your first category.
        </p>
        <Link href="/admin/categories/new" className="mt-4 inline-block">
          <Button>Add Category</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Order</TableHead>
            <TableHead className="w-20">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Hide if empty</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category, index) => (
            <TableRow key={category.slug}>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0 || savingSlug === category.slug}
                    onClick={() => reorder(category.slug, 'up')}
                    aria-label={`Move ${category.name} up`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      index === categories.length - 1 ||
                      savingSlug === category.slug
                    }
                    onClick={() => reorder(category.slug, 'down')}
                    aria-label={`Move ${category.name} down`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {category.image ? (
                  <div className="relative h-14 w-11 overflow-hidden rounded-md bg-[#FAF7F2]">
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {category.slug}
              </TableCell>
              <TableCell>
                <Switch
                  checked={category.isActive}
                  disabled={savingSlug === category.slug}
                  onCheckedChange={(checked) =>
                    patchCategory(category.slug, { isActive: checked })
                  }
                  aria-label={`Toggle ${category.name} active`}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={category.hideWhenEmpty}
                  disabled={savingSlug === category.slug}
                  onCheckedChange={(checked) =>
                    patchCategory(category.slug, { hideWhenEmpty: checked })
                  }
                  aria-label={`Toggle hide when empty for ${category.name}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/categories/${encodeURIComponent(category.slug)}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
