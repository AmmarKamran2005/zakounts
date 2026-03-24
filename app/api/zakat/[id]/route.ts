import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { authenticateRequest, unauthorized, badRequest, notFound, success, serverError } from '@/lib/server/auth';
import { calculateZakat, calculateZakatFromItems, type CalcInput, type RatesInput } from '@/lib/server/zakatCalculator';

const zakatItemSchema = z.object({
  category: z.enum(['BANK', 'INVESTMENT', 'GOLD_SILVER', 'PROPERTY', 'CASH', 'CURRENCY', 'LIABILITY', 'LOAN_GIVEN']),
  name: z.string().default(''),
  type: z.string().optional(),
  currency: z.enum(['PKR', 'USD', 'SR', 'CAD']).optional(),
  amount: z.number().min(0).default(0),
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  zakatApplicable: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateZakatSchema = z.object({
  yearHijri: z.string().optional(),
  yearGregorian: z.number().int().optional(),
  cash: z.number().min(0).optional(),
  bank: z.number().min(0).optional(),
  goldGrams: z.number().min(0).optional(),
  silverGrams: z.number().min(0).optional(),
  businessAssets: z.number().min(0).optional(),
  otherAssets: z.number().min(0).optional(),
  srAmount: z.number().min(0).optional(),
  usdAmount: z.number().min(0).optional(),
  cadAmount: z.number().min(0).optional(),
  liabilities: z.number().min(0).optional(),
  zakatDate: z.string().optional(),
  zakatPaid: z.number().min(0).optional(),
  items: z.array(zakatItemSchema).optional(),
});

function mapItemForPrisma(item: z.infer<typeof zakatItemSchema>) {
  return {
    category: item.category as any,
    name: item.name || '',
    type: item.type ?? null,
    currency: item.currency ?? null,
    amount: item.amount || 0,
    quantity: item.quantity ?? null,
    unitPrice: item.unitPrice ?? null,
    zakatApplicable: item.zakatApplicable ?? true,
    metadata: item.metadata ? (item.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
  };
}

async function getUserSettings(userId: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings) throw new Error('Settings not found');
  return settings;
}

function buildRatesInput(s: { srRate: number; usdRate: number; cadRate: number; goldPrice: number; silverPrice: number; nisabType: string }): RatesInput {
  return { srRate: s.srRate, usdRate: s.usdRate, cadRate: s.cadRate, goldPrice: s.goldPrice, silverPrice: s.silverPrice, nisabType: s.nisabType as 'gold' | 'silver' };
}

type Params = { params: Promise<{ id: string }> };

// GET /api/zakat/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const { id } = await params;
    const record = await prisma.zakatRecord.findUnique({ where: { id }, include: { items: true } });
    if (!record || record.userId !== payload.id) return notFound('Record not found');

    return success(record);
  } catch (err) {
    return serverError(err);
  }
}

// PUT /api/zakat/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const { id } = await params;
    const existing = await prisma.zakatRecord.findUnique({ where: { id }, include: { items: true } });
    if (!existing || existing.userId !== payload.id) return notFound('Record not found');

    const body = await request.json();
    const parsed = updateZakatSchema.safeParse(body);
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const data = parsed.data;
    const settings = await getUserSettings(payload.id);
    const rates = buildRatesInput(settings);

    const hasItems = data.items && data.items.length > 0;

    let result: { totalAssets: number; netAssets: number; zakatDue: number; nisabValue: number };
    let flatFields: { cash: number; bank: number; goldGrams: number; silverGrams: number; businessAssets: number; otherAssets: number; srAmount: number; usdAmount: number; cadAmount: number; liabilities: number };

    if (hasItems) {
      await prisma.zakatItem.deleteMany({ where: { zakatRecordId: id } });
      const itemsResult = calculateZakatFromItems(data.items!, rates);
      result = itemsResult;
      flatFields = {
        cash: itemsResult.cash, bank: itemsResult.bank,
        goldGrams: itemsResult.goldGrams, silverGrams: itemsResult.silverGrams,
        businessAssets: itemsResult.businessAssets, otherAssets: itemsResult.otherAssets,
        srAmount: itemsResult.srAmount, usdAmount: itemsResult.usdAmount,
        cadAmount: itemsResult.cadAmount, liabilities: itemsResult.liabilities,
      };
    } else {
      flatFields = {
        cash: data.cash ?? existing.cash, bank: data.bank ?? existing.bank,
        goldGrams: data.goldGrams ?? existing.goldGrams, silverGrams: data.silverGrams ?? existing.silverGrams,
        businessAssets: data.businessAssets ?? existing.businessAssets,
        otherAssets: data.otherAssets ?? existing.otherAssets,
        srAmount: data.srAmount ?? existing.srAmount, usdAmount: data.usdAmount ?? existing.usdAmount,
        cadAmount: data.cadAmount ?? existing.cadAmount, liabilities: data.liabilities ?? existing.liabilities,
      };
      result = calculateZakat({
        ...flatFields, srRate: settings.srRate, usdRate: settings.usdRate, cadRate: settings.cadRate,
        goldPrice: settings.goldPrice, silverPrice: settings.silverPrice, nisabType: settings.nisabType as 'gold' | 'silver',
      });
    }

    const record = await prisma.zakatRecord.update({
      where: { id },
      data: {
        yearHijri: data.yearHijri ?? existing.yearHijri,
        yearGregorian: data.yearGregorian ?? existing.yearGregorian,
        zakatDate: data.zakatDate ? new Date(data.zakatDate) : existing.zakatDate,
        zakatPaid: data.zakatPaid ?? existing.zakatPaid,
        ...flatFields,
        totalAssets: result.totalAssets, netAssets: result.netAssets, zakatDue: result.zakatDue,
        nisabValue: result.nisabValue, nisabType: settings.nisabType,
        srRate: settings.srRate, usdRate: settings.usdRate, cadRate: settings.cadRate,
        goldPrice: settings.goldPrice, silverPrice: settings.silverPrice,
        ...(hasItems ? { items: { createMany: { data: data.items!.map(mapItemForPrisma) } } } : {}),
      },
      include: { items: true },
    });

    return success(record);
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/zakat/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const { id } = await params;
    const existing = await prisma.zakatRecord.findUnique({ where: { id } });
    if (!existing || existing.userId !== payload.id) return notFound('Record not found');

    await prisma.zakatRecord.delete({ where: { id } });
    return success({ message: 'Record deleted' });
  } catch (err) {
    return serverError(err);
  }
}
