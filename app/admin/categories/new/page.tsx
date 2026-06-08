'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import CategoryImageUpload from '@/components/admin/CategoryImageUpload'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function NewCategoryPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    image: '',
    imageAlt: '',
    isActive: true,
    hideWhenEmpty: true,
  })

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
      imageAlt: prev.imageAlt || name,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category')
      }
      router.push('/admin/categories')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create category')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Category</h1>
        <p className="text-muted-foreground">
          Slug becomes the URL: /category/your-slug
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
            }}
            required
          />
        </div>

        <CategoryImageUpload
          image={form.image}
          imageAlt={form.imageAlt}
          onImageChange={(image) => setForm((prev) => ({ ...prev, image }))}
        />

        <div className="space-y-2">
          <Label htmlFor="imageAlt">Image alt text</Label>
          <Input
            id="imageAlt"
            value={form.imageAlt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, imageAlt: e.target.value }))
            }
            required
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Active</p>
            <p className="text-sm text-muted-foreground">
              Inactive categories are hidden from the storefront
            </p>
          </div>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isActive: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Hide when empty</p>
            <p className="text-sm text-muted-foreground">
              Hide from homepage and nav when no in-stock products
            </p>
          </div>
          <Switch
            checked={form.hideWhenEmpty}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, hideWhenEmpty: checked }))
            }
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving || !form.image}>
            {isSaving ? 'Saving…' : 'Create Category'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/categories">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
