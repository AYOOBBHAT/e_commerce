import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { getServerSession } from '@/lib/auth'
import { invalidateCategoryCache } from '@/lib/actions/categories'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error reordering categories:', error)
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 },
    )
  }
}
