import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { generateOTP, hashOTP } from '@/lib/server/otp';
import { sendOTPEmail } from '@/lib/server/email';
import { success, badRequest, notFound, serverError } from '@/lib/server/auth';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid email');

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return notFound('Email not found');
    if (user.isVerified) return badRequest('Email is already verified');

    if (user.otpCooldown && user.otpCooldown > new Date()) {
      const waitSec = Math.ceil((user.otpCooldown.getTime() - Date.now()) / 1000);
      return Response.json({ success: false, error: `Please wait ${waitSec} seconds before requesting a new OTP` }, { status: 429 });
    }

    const otp = generateOTP();
    const otpHashed = await hashOTP(otp);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: otpHashed,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        otpCooldown: new Date(Date.now() + 60 * 1000),
      },
    });

    await sendOTPEmail(email, otp);

    return success({ message: 'New OTP sent to your email' });
  } catch (err) {
    return serverError(err);
  }
}
