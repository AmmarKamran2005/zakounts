import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { generateAccessToken, generateRefreshToken, type TokenPayload } from '@/lib/server/jwt';
import { badRequest, serverError } from '@/lib/server/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ success: false, error: 'Invalid email or password' }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return Response.json({ success: false, error: 'Invalid email or password' }, { status: 401 });

    if (!user.isVerified) {
      return Response.json({ success: false, error: 'Please verify your email first. Check your inbox for the OTP.' }, { status: 403 });
    }

    const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const response = Response.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });

    response.headers.set('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
    return response;
  } catch (err) {
    return serverError(err);
  }
}
