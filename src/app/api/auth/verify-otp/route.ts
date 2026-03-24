import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { verifyOTPHash } from '@/lib/server/otp';
import { generateAccessToken, generateRefreshToken, type TokenPayload } from '@/lib/server/jwt';
import { success, badRequest, serverError } from '@/lib/server/auth';

const verifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyOTPSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const { email, otp } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return badRequest('Invalid email or OTP');
    if (user.isVerified) return badRequest('Email is already verified');
    if (!user.otpHash || !user.otpExpiry) return badRequest('No OTP requested. Please register again.');
    if (user.otpExpiry < new Date()) return badRequest('OTP has expired. Please request a new one.');

    const isValid = await verifyOTPHash(otp, user.otpHash);
    if (!isValid) return badRequest('Invalid OTP');

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpHash: null, otpExpiry: null, otpCooldown: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const response = Response.json({ success: true, data: { accessToken, refreshToken, user: verified } });
    response.headers.set('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
    return response;
  } catch (err) {
    return serverError(err);
  }
}
