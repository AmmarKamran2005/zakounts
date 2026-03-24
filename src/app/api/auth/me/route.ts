import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { authenticateRequest, unauthorized, success, serverError } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
    });

    if (!user) return Response.json({ success: false, error: 'User not found' }, { status: 404 });

    return success(user);
  } catch (err) {
    return serverError(err);
  }
}
