import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { authenticateRequest, unauthorized, badRequest, success, serverError } from '@/lib/server/auth';
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

const createZakatSchema = z.object({
  yearHijri: z.string().min(1, 'Hijri year is required'),
  yearGregorian: z.number().int().min(2000).max(2100),
  cash: z.number().min(0).default(0),
  bank: z.number().min(0).default(0),
  goldGrams: z.number().min(0).default(0),
  silverGrams: z.number().min(0).default(0),
  businessAssets: z.number().min(0).default(0),
  otherAssets: z.number().min(0).default(0),
  srAmount: z.number().min(0).default(0),
  usdAmount: z.number().min(0).default(0),
  cadAmount: z.number().min(0).default(0),
  liabilities: z.number().min(0).default(0),
  zakatDate: z.string().optional(),
  zakatPaid: z.number().min(0).default(0),
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

function buildRatesInput(settings: { srRate: number; usdRate: number; cadRate: number; goldPrice: number; silverPrice: number; nisabType: string }): RatesInput {
  return {
    srRate: settings.srRate,
    usdRate: settings.usdRate,
    cadRate: settings.cadRate,
    goldPrice: settings.goldPrice,
    silverPrice: settings.silverPrice,
    nisabType: settings.nisabType as 'gold' | 'silver',
  };
}

function buildCalcInput(data: any, settings: any): CalcInput {
  return {
    cash: data.cash ?? 0, bank: data.bank ?? 0, goldGrams: data.goldGrams ?? 0,
    silverGrams: data.silverGrams ?? 0, businessAssets: data.businessAssets ?? 0,
    otherAssets: data.otherAssets ?? 0, srAmount: data.srAmount ?? 0,
    usdAmount: data.usdAmount ?? 0, cadAmount: data.cadAmount ?? 0, liabilities: data.liabilities ?? 0,
    srRate: settings.srRate, usdRate: settings.usdRate, cadRate: settings.cadRate,
    goldPrice: settings.goldPrice, silverPrice: settings.silverPrice,
    nisabType: settings.nisabType as 'gold' | 'silver',
  };
}

// GET /api/zakat — List records
export async function GET(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined;

    const where: Record<string, unknown> = { userId: payload.id };
    if (year) where.yearGregorian = year;
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.zakatDue = {};
      if (minAmount !== undefined) (where.zakatDue as Record<string, number>).gte = minAmount;
      if (maxAmount !== undefined) (where.zakatDue as Record<string, number>).lte = maxAmount;
    }

    const records = await prisma.zakatRecord.findMany({ where, orderBy: { createdAt: 'desc' } });
    return success(records);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/zakat — Create record
export async function POST(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return unauthorized();

    const body = await request.json();
    const parsed = createZakatSchema.safeParse(body);
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten().fieldErrors);

    const data = parsed.data;
    const settings = await getUserSettings(payload.id);
    const rates = buildRatesInput(settings);

    const hasItems = data.items && data.items.length > 0;

    let result: { totalAssets: number; netAssets: number; zakatDue: number; nisabValue: number };
    let flatFields: { cash: number; bank: number; goldGrams: number; silverGrams: number; businessAssets: number; otherAssets: number; srAmount: number; usdAmount: number; cadAmount: number; liabilities: number };

    if (hasItems) {
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
      result = calculateZakat(buildCalcInput(data, settings));
      flatFields = {
        cash: data.cash ?? 0, bank: data.bank ?? 0,
        goldGrams: data.goldGrams ?? 0, silverGrams: data.silverGrams ?? 0,
        businessAssets: data.businessAssets ?? 0, otherAssets: data.otherAssets ?? 0,
        srAmount: data.srAmount ?? 0, usdAmount: data.usdAmount ?? 0,
        cadAmount: data.cadAmount ?? 0, liabilities: data.liabilities ?? 0,
      };
    }

    const record = await prisma.zakatRecord.create({
      data: {
        userId: payload.id,
        yearHijri: data.yearHijri,
        yearGregorian: data.yearGregorian,
        zakatDate: data.zakatDate ? new Date(data.zakatDate) : null,
        zakatPaid: data.zakatPaid ?? 0,
        ...flatFields,
        totalAssets: result.totalAssets, netAssets: result.netAssets, zakatDue: result.zakatDue,
        nisabValue: result.nisabValue, nisabType: settings.nisabType,
        srRate: settings.srRate, usdRate: settings.usdRate, cadRate: settings.cadRate,
        goldPrice: settings.goldPrice, silverPrice: settings.silverPrice,
        ...(hasItems ? {
          items: { createMany: { data: data.items!.map(mapItemForPrisma) } },
        } : {}),
      },
      include: { items: true },
    });

    return success(record, 201);
  } catch (err) {
    return serverError(err);
  }
}
