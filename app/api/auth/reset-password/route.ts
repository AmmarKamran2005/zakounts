import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { hashToken } from '@/lib/server/otp';
import { success, badRequest, serverError } from '@/lib/server/auth';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8).regex(/[0-9]/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const { email, token, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return badRequest('Invalid email or token');
    if (!user.resetTokenHash || !user.resetTokenExpiry) return badRequest('No reset token found. Please request a new one.');
    if (user.resetTokenExpiry < new Date()) return badRequest('Reset token has expired. Please request a new one.');

    const tokenHash = hashToken(token);
    if (tokenHash !== user.resetTokenHash) return badRequest('Invalid reset token');

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetTokenHash: null, resetTokenExpiry: null },
    });

    return success({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    return serverError(err);
  }
}
