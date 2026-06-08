import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { getServerSession } from '@/lib/auth'
import { invalidateCategoryCache } from '@/lib/actions/categories'
import { cleanupReplacedCategoryImage } from '@/lib/category-image-lifecycle'
import type { CategoryRecord } from '@/lib/category-types'

type RouteContext = { params: { slug: string } }

function serializeCategory(doc: {
  slug: string
  name: string
  image: string
  imagePublicId?: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  hideWhenEmpty: boolean
}) {
  return {
    slug: doc.slug,
    name: doc.name,
    image: doc.image,
    imagePublicId: doc.imagePublicId || '',
    imageAlt: doc.imageAlt,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    hideWhenEmpty: doc.hideWhenEmpty,
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    const category = await Category.findOne({ slug: params.slug }).lean()
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(serializeCategory(category as unknown as CategoryRecord), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    await connectToDatabase()

    const existing = await Category.findOne({ slug: params.slug })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = {}
    let nextPublicId: string | undefined

    if (typeof data.name === 'string' && data.name.trim()) {
      update.name = data.name.trim()
    }
    if (typeof data.image === 'string') {
      const image = data.image.trim()
      if (!image) {
        return NextResponse.json(
          { error: 'Category image cannot be empty' },
          { status: 400 },
        )
      }
      update.image = image
    }
    if (typeof data.imagePublicId === 'string') {
      nextPublicId = data.imagePublicId.trim()
      update.imagePublicId = nextPublicId
    }
    if (typeof data.imageAlt === 'string') {
      update.imageAlt = data.imageAlt.trim()
    }
    if (typeof data.sortOrder === 'number') {
      update.sortOrder = data.sortOrder
    }
    if (typeof data.isActive === 'boolean') {
      update.isActive = data.isActive
    }
    if (typeof data.hideWhenEmpty === 'boolean') {
      update.hideWhenEmpty = data.hideWhenEmpty
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const imageChanged =
      typeof update.image === 'string' && update.image !== existing.image

    if (imageChanged || typeof update.imagePublicId === 'string') {
      await cleanupReplacedCategoryImage({
        previousPublicId: existing.imagePublicId,
        previousUrl: existing.image,
        nextPublicId:
          nextPublicId ??
          (typeof update.imagePublicId === 'string'
            ? update.imagePublicId
            : existing.imagePublicId),
        nextUrl:
          typeof update.image === 'string' ? update.image : existing.image,
      })
    }

    existing.set(update)
    await existing.save()

    await invalidateCategoryCache(params.slug)

    return NextResponse.json(serializeCategory(existing.toObject()), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 },
    )
  }
}
