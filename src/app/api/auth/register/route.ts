import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { generateOTP, hashOTP } from '@/lib/server/otp';
import { sendOTPEmail } from '@/lib/server/email';
import { success, badRequest, serverError } from '@/lib/server/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpHashed = await hashOTP(otp);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        otpHash: otpHashed,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        otpCooldown: new Date(Date.now() + 60 * 1000),
        settings: {
          create: {
            srRate: 74.0,
            usdRate: 278.0,
            cadRate: 200.0,
            goldPrice: 21000.0,
            silverPrice: 250.0,
            nisabType: 'gold',
          },
        },
      },
    });

    await sendOTPEmail(email, otp);

    return success({ message: 'OTP sent to your email', email }, 201);
  } catch (err) {
    return serverError(err);
  }
}
