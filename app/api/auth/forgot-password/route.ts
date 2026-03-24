import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { generateResetToken, hashToken } from '@/lib/server/otp';
import { sendResetEmail } from '@/lib/server/email';
import { success, badRequest, serverError } from '@/lib/server/auth';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid email');

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return success({ message: 'If this email is registered, a reset link has been sent.' });
    }

    const token = generateResetToken();
    const tokenHash = hashToken(token);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendResetEmail(email, token);

    return success({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    return serverError(err);
  }
}
