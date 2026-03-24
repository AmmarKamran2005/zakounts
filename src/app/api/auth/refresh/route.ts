import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyRefreshToken, generateAccessToken, type TokenPayload } from '@/lib/server/jwt';
import { serverError } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      return Response.json({ success: false, error: 'Refresh token required' }, { status: 401 });
    }

    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return Response.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    const newPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(newPayload);

    return Response.json({ success: true, data: { accessToken } });
  } catch (err) {
    return serverError(err);
  }
}
