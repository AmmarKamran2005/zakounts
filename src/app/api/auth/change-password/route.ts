import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { authenticateRequest, unauthorized, badRequest, success, serverError } from '@/lib/server/auth';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[0-9]/),
});

export async function POST(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return Response.json({ success: false, error: 'User not found' }, { status: 404 });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return badRequest('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: payload.id },
      data: { password: hashedPassword },
    });

    return success({ message: 'Password changed successfully' });
  } catch (err) {
    return serverError(err);
  }
}
