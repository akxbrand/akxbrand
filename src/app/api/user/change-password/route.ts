import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userDb } from '@/lib/db/user';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Input validation schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
});

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = passwordChangeSchema.parse(body);

    // Get user from database
    const user = await userDb.getByEmail(session.user.email);
    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password in database
    await userDb.updatePassword(user.id, hashedPassword);

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to change password' },
      { status: 500 }
    );
  }
}