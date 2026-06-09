import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import User from '@/models/User'
import { getServerSession } from '@/lib/auth'
import type { IUser } from '@/models/User'

const ALLOWED_ROLES = ['user', 'admin'] as const
export type UserRole = (typeof ALLOWED_ROLES)[number]

type AdminAccessSuccess = {
  ok: true
  admin: IUser
  adminId: string
}

type AdminAccessFailure = {
  ok: false
  response: NextResponse
}

export async function requireAdminFromDb(): Promise<
  AdminAccessSuccess | AdminAccessFailure
> {
  const session = await getServerSession()
  if (!session?.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  await connectToDatabase()

  const admin = await User.findById(session.userId).select('-password')
  if (!admin || admin.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    admin,
    adminId: admin._id.toString(),
  }
}

export async function countAdmins(): Promise<number> {
  return User.countDocuments({ role: 'admin' })
}

export function parseRoleUpdate(
  body: unknown,
): { ok: true; role: UserRole } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' }
  }

  const keys = Object.keys(body as Record<string, unknown>)
  if (keys.length !== 1 || keys[0] !== 'role') {
    return {
      ok: false,
      error: 'Only role updates are permitted on this endpoint.',
    }
  }

  const role = (body as { role: unknown }).role
  if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role as UserRole)) {
    return { ok: false, error: 'Role must be "user" or "admin".' }
  }

  return { ok: true, role: role as UserRole }
}

export function guardSelfDelete(
  targetUserId: string,
  adminId: string,
): NextResponse | null {
  if (targetUserId === adminId) {
    return NextResponse.json(
      { error: 'You cannot delete your own admin account.' },
      { status: 403 },
    )
  }
  return null
}

export function guardSelfDemote(
  targetUserId: string,
  adminId: string,
  newRole: UserRole,
): NextResponse | null {
  if (targetUserId === adminId && newRole === 'user') {
    return NextResponse.json(
      { error: 'You cannot demote your own admin account.' },
      { status: 403 },
    )
  }
  return null
}

export async function guardLastAdminDelete(
  targetRole: string,
): Promise<NextResponse | null> {
  if (targetRole !== 'admin') return null

  const adminCount = await countAdmins()
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot delete the last admin account.' },
      { status: 409 },
    )
  }
  return null
}

export async function guardLastAdminDemote(
  currentRole: string,
  newRole: UserRole,
): Promise<NextResponse | null> {
  if (currentRole !== 'admin' || newRole !== 'user') return null

  const adminCount = await countAdmins()
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot demote the last admin account.' },
      { status: 409 },
    )
  }
  return null
}
