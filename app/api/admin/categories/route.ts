import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { getServerSession } from '@/lib/auth'
import { invalidateCategoryCache } from '@/lib/actions/categories'
import type { CategoryRecord } from '@/lib/category-types'

function serializeCategory(doc: {
  slug: string
  name: string
  image: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  hideWhenEmpty: boolean
}) {
  return {
    slug: doc.slug,
    name: doc.name,
    image: doc.image,
    imageAlt: doc.imageAlt,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    hideWhenEmpty: doc.hideWhenEmpty,
  }
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean()

    return NextResponse.json(
      categories.map((category) =>
        serializeCategory(category as unknown as CategoryRecord),
      ),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const slug = normalizeSlug(data.slug || data.name || '')
    const name = String(data.name || '').trim()
    const image = String(data.image || '').trim()
    const imageAlt = String(data.imageAlt || name).trim()

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 },
      )
    }
    if (!image) {
      return NextResponse.json(
        { error: 'Category image is required' },
        { status: 400 },
      )
    }

    await connectToDatabase()

    const existing = await Category.findOne({ slug }).lean()
    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 },
      )
    }

    const maxSort = await Category.findOne()
      .sort({ sortOrder: -1 })
      .select('sortOrder')
      .lean<{ sortOrder: number }>()
    const sortOrder =
      typeof data.sortOrder === 'number'
        ? data.sortOrder
        : (maxSort?.sortOrder ?? -1) + 1

    const category = await Category.create({
      slug,
      name,
      image,
      imageAlt,
      sortOrder,
      isActive: data.isActive !== false,
      hideWhenEmpty: data.hideWhenEmpty !== false,
    })

    await invalidateCategoryCache()

    return NextResponse.json(serializeCategory(category.toObject()), {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 },
    )
  }
}
