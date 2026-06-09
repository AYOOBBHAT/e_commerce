import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { requireAdminFromDb } from '@/lib/admin/users-access'
import { invalidateCategoryCache } from '@/lib/actions/categories'
import type { CategoryRecord } from '@/lib/category-types'
import { writeAdminAuditEvent } from '@/lib/audit/write-audit-event'
import { AUDIT_ACTIONS } from '@/lib/audit/types'

function serializeCategory(doc: CategoryRecord) {
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

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET() {
  try {
    const auth = await requireAdminFromDb()
    if (!auth.ok) return auth.response

    await connectToDatabase()
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean<CategoryRecord[]>()

    return NextResponse.json(
      categories.map((category) => serializeCategory(category)),
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
    const auth = await requireAdminFromDb()
    if (!auth.ok) return auth.response

    const data = await request.json()
    const slug = normalizeSlug(data.slug || data.name || '')
    const name = String(data.name || '').trim()
    const image = String(data.image || '').trim()
    const imagePublicId = String(data.imagePublicId || '').trim()
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

    const existing = await Category.findOne({ slug })
      .select('slug')
      .lean<{ slug: string }>()
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
      imagePublicId,
      imageAlt,
      sortOrder,
      isActive: data.isActive !== false,
      hideWhenEmpty: data.hideWhenEmpty !== false,
    })

    await invalidateCategoryCache(slug)

    writeAdminAuditEvent({
      action: AUDIT_ACTIONS.CREATE_CATEGORY,
      adminId: auth.adminId,
      metadata: {
        categorySlug: slug,
        name,
        isActive: data.isActive !== false,
      },
    })

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
