import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { authenticateRequest, unauthorized, forbidden, success, serverError } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();
    if (payload.role !== 'ADMIN') return forbidden();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { zakatRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(users);
  } catch (err) {
    return serverError(err);
  }
}
