import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { requireAdminFromDb } from '@/lib/admin/users-access'
import { invalidateCategoryCache } from '@/lib/actions/categories'
import { writeAdminAuditEvent } from '@/lib/audit/write-audit-event'
import { AUDIT_ACTIONS } from '@/lib/audit/types'

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminFromDb()
    if (!auth.ok) return auth.response

    const { slugs } = await request.json()
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json(
        { error: 'slugs array is required' },
        { status: 400 },
      )
    }

    await connectToDatabase()

    await Promise.all(
      slugs.map((slug: string, sortOrder: number) =>
        Category.updateOne({ slug }, { $set: { sortOrder } }),
      ),
    )

    await invalidateCategoryCache()

    writeAdminAuditEvent({
      action: AUDIT_ACTIONS.REORDER_CATEGORIES,
      adminId: auth.adminId,
      metadata: {
        categoryOrder: slugs as string[],
      },
    })

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error reordering categories:', error)
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 },
    )
  }
}
