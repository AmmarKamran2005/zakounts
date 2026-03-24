import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { authenticateRequest, unauthorized, badRequest, success, serverError } from '@/lib/server/auth';

const updateSettingsSchema = z.object({
  srRate: z.number().positive().optional(),
  usdRate: z.number().positive().optional(),
  cadRate: z.number().positive().optional(),
  goldPrice: z.number().positive().optional(),
  silverPrice: z.number().positive().optional(),
  nisabType: z.enum(['gold', 'silver']).optional(),
});

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const settings = await prisma.settings.upsert({
      where: { userId: payload.id },
      update: {},
      create: {
        userId: payload.id,
        srRate: 74.0,
        usdRate: 278.0,
        cadRate: 200.0,
        goldPrice: 21000.0,
        silverPrice: 250.0,
        nisabType: 'gold',
      },
    });

    return success(settings);
  } catch (err) {
    return serverError(err);
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const data = parsed.data;

    const settings = await prisma.settings.upsert({
      where: { userId: payload.id },
      update: data,
      create: {
        userId: payload.id,
        srRate: data.srRate ?? 74.0,
        usdRate: data.usdRate ?? 278.0,
        cadRate: data.cadRate ?? 200.0,
        goldPrice: data.goldPrice ?? 21000.0,
        silverPrice: data.silverPrice ?? 250.0,
        nisabType: data.nisabType ?? 'gold',
      },
    });

    return success(settings);
  } catch (err) {
    return serverError(err);
  }
}
