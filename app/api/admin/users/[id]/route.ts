import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import {
  guardLastAdminDelete,
  guardLastAdminDemote,
  guardSelfDelete,
  guardSelfDemote,
  parseRoleUpdate,
  requireAdminFromDb,
} from '@/lib/admin/users-access';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const user = await User.findById(params.id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = parseRoleUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const target = await User.findById(params.id).select('-password');
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetId = target._id.toString();

    if (parsed.role === target.role) {
      return NextResponse.json(target);
    }

    const selfDemoteResponse = guardSelfDemote(targetId, auth.adminId, parsed.role);
    if (selfDemoteResponse) return selfDemoteResponse;

    const lastAdminDemoteResponse = await guardLastAdminDemote(
      target.role,
      parsed.role,
    );
    if (lastAdminDemoteResponse) return lastAdminDemoteResponse;

    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: { role: parsed.role } },
      { new: true },
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const target = await User.findById(params.id);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetId = target._id.toString();

    const selfDeleteResponse = guardSelfDelete(targetId, auth.adminId);
    if (selfDeleteResponse) return selfDeleteResponse;

    const lastAdminDeleteResponse = await guardLastAdminDelete(target.role);
    if (lastAdminDeleteResponse) return lastAdminDeleteResponse;

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
