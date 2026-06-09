import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { requireAdminFromDb } from '@/lib/admin/users-access'
import { invalidateCategoryCache } from '@/lib/actions/categories'
import { cleanupReplacedCategoryImage } from '@/lib/category-image-lifecycle'
import { getCategoryDeactivationWarning } from '@/lib/categories/admin-category-response'
import type { CategoryRecord } from '@/lib/category-types'
import {
  buildCategoryAuditFields,
  buildScalarChangedFields,
} from '@/lib/audit/admin-metadata'
import { writeAdminAuditEvent } from '@/lib/audit/write-audit-event'
import { AUDIT_ACTIONS } from '@/lib/audit/types'

type RouteContext = { params: { slug: string } }

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

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdminFromDb()
    if (!auth.ok) return auth.response

    await connectToDatabase()
    const category = await Category.findOne({ slug: params.slug }).lean<CategoryRecord>()
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(serializeCategory(category), {
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
    const auth = await requireAdminFromDb()
    if (!auth.ok) return auth.response

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

    const previousIsActive = existing.isActive
    const nextIsActive =
      typeof update.isActive === 'boolean' ? update.isActive : previousIsActive

    const beforeFields = buildCategoryAuditFields(existing.toObject())

    existing.set(update)
    await existing.save()

    const changedFields = buildScalarChangedFields(
      beforeFields,
      buildCategoryAuditFields(existing.toObject()),
      Object.keys(update),
    )

    writeAdminAuditEvent({
      action: AUDIT_ACTIONS.UPDATE_CATEGORY,
      adminId: auth.adminId,
      metadata: {
        categorySlug: params.slug,
        changedFields,
      },
    })

    await invalidateCategoryCache(params.slug)

    const warning = await getCategoryDeactivationWarning(
      params.slug,
      nextIsActive,
      previousIsActive,
    )

    const payload = serializeCategory(existing.toObject())
    if (warning) {
      return NextResponse.json(
        { ...payload, success: true, warning },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(payload, {
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
