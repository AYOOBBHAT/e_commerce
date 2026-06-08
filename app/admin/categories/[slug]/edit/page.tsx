'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import CategoryImageUpload from '@/components/admin/CategoryImageUpload'

type CategoryForm = {
  slug: string
  name: string
  image: string
  imagePublicId: string
  imageAlt: string
  isActive: boolean
  hideWhenEmpty: boolean
}

export default function EditCategoryPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<CategoryForm | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/admin/categories/${encodeURIComponent(params.slug)}`,
          { cache: 'no-store' },
        )
        if (!res.ok) throw new Error('Category not found')
        setForm(await res.json())
      } catch {
        alert('Category not found')
        router.push('/admin/categories')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.slug, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setIsSaving(true)
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(params.slug)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            image: form.image,
            imagePublicId: form.imagePublicId,
            imageAlt: form.imageAlt,
            isActive: form.isActive,
            hideWhenEmpty: form.hideWhenEmpty,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update category')
      }
      router.push('/admin/categories')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !form) {
    return <p className="text-sm text-muted-foreground">Loading category…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Category</h1>
        <p className="font-mono text-sm text-muted-foreground">{form.slug}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <CategoryImageUpload
          image={form.image}
          imagePublicId={form.imagePublicId}
          imageAlt={form.imageAlt}
          onImageChange={(asset) =>
            setForm({
              ...form,
              image: asset?.url ?? '',
              imagePublicId: asset?.publicId ?? '',
            })
          }
        />

        <div className="space-y-2">
          <Label htmlFor="imageAlt">Image alt text</Label>
          <Input
            id="imageAlt"
            value={form.imageAlt}
            onChange={(e) => setForm({ ...form, imageAlt: e.target.value })}
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
            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
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
              setForm({ ...form, hideWhenEmpty: checked })
            }
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving || !form.image}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/categories">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
