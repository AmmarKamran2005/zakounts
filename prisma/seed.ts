import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient, Role, ZakatItemCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.zakatItem.deleteMany();
  await prisma.zakatRecord.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@zakat.com',
      password: adminPassword,
      role: Role.ADMIN,
      isVerified: true,
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
  console.log('Created admin:', admin.email);

  const userPassword = await bcrypt.hash('User123!', 12);
  const user = await prisma.user.create({
    data: {
      name: 'Ahmed Khan',
      email: 'user@zakat.com',
      password: userPassword,
      role: Role.USER,
      isVerified: true,
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
  console.log('Created user:', user.email);

  const settings = { srRate: 74.0, usdRate: 278.0, cadRate: 200.0, goldPrice: 21000.0, silverPrice: 250.0, nisabType: 'gold' as const };
  const GOLD_NISAB_GRAMS = 87.48;

  // Legacy flat records (years 2021-2024)
  const legacyRecords = [
    { yearHijri: '1442', yearGregorian: 2021, zakatDate: new Date('2021-04-13'), cash: 300000, bank: 700000, goldGrams: 30, silverGrams: 100, businessAssets: 150000, otherAssets: 0, srAmount: 2000, usdAmount: 500, cadAmount: 0, liabilities: 200000 },
    { yearHijri: '1443', yearGregorian: 2022, zakatDate: new Date('2022-04-02'), cash: 400000, bank: 900000, goldGrams: 40, silverGrams: 150, businessAssets: 200000, otherAssets: 50000, srAmount: 3000, usdAmount: 1000, cadAmount: 500, liabilities: 300000 },
    { yearHijri: '1444', yearGregorian: 2023, zakatDate: new Date('2023-03-23'), cash: 500000, bank: 1200000, goldGrams: 50, silverGrams: 200, businessAssets: 300000, otherAssets: 100000, srAmount: 5000, usdAmount: 2000, cadAmount: 1000, liabilities: 400000 },
    { yearHijri: '1445', yearGregorian: 2024, zakatDate: new Date('2024-03-11'), cash: 600000, bank: 1500000, goldGrams: 55, silverGrams: 250, businessAssets: 400000, otherAssets: 150000, srAmount: 8000, usdAmount: 3000, cadAmount: 2000, liabilities: 350000 },
  ];

  for (const r of legacyRecords) {
    const srValuePKR = r.srAmount * settings.srRate;
    const usdValuePKR = r.usdAmount * settings.usdRate;
    const cadValuePKR = r.cadAmount * settings.cadRate;
    const goldValuePKR = r.goldGrams * settings.goldPrice;
    const silverValuePKR = r.silverGrams * settings.silverPrice;

    const totalAssets = r.cash + r.bank + r.businessAssets + r.otherAssets + srValuePKR + usdValuePKR + cadValuePKR + goldValuePKR + silverValuePKR;
    const netAssets = totalAssets - r.liabilities;
    const nisabValue = GOLD_NISAB_GRAMS * settings.goldPrice;
    const zakatDue = netAssets >= nisabValue ? Math.round(netAssets * 0.025 * 100) / 100 : 0;

    await prisma.zakatRecord.create({
      data: {
        userId: user.id,
        yearHijri: r.yearHijri,
        yearGregorian: r.yearGregorian,
        zakatDate: r.zakatDate,
        cash: r.cash,
        bank: r.bank,
        goldGrams: r.goldGrams,
        silverGrams: r.silverGrams,
        businessAssets: r.businessAssets,
        otherAssets: r.otherAssets,
        srAmount: r.srAmount,
        usdAmount: r.usdAmount,
        cadAmount: r.cadAmount,
        liabilities: r.liabilities,
        totalAssets: Math.round(totalAssets * 100) / 100,
        netAssets: Math.round(netAssets * 100) / 100,
        zakatDue,
        nisabValue: Math.round(nisabValue * 100) / 100,
        nisabType: settings.nisabType,
        srRate: settings.srRate,
        usdRate: settings.usdRate,
        cadRate: settings.cadRate,
        goldPrice: settings.goldPrice,
        silverPrice: settings.silverPrice,
      },
    });
  }

  // 2025 record WITH line items (new system demo)
  const itemsData: Array<{ category: ZakatItemCategory; name: string; type?: string; currency?: string; amount: number; quantity?: number; unitPrice?: number; zakatApplicable?: boolean }> = [
    { category: 'CASH', name: 'Cash in hand', amount: 350000 },
    { category: 'CASH', name: 'Cash with family', amount: 200000 },
    { category: 'CASH', name: 'Cash in wallet', amount: 50000 },
    { category: 'BANK', name: 'HBL Savings', type: 'Savings', currency: 'PKR', amount: 1200000 },
    { category: 'BANK', name: 'Meezan Current', type: 'Current', currency: 'PKR', amount: 600000 },
    { category: 'BANK', name: 'TD Bank Canada', type: 'Foreign', currency: 'CAD', amount: 5000 },
    { category: 'INVESTMENT', name: 'Al Meezan Mutual Fund', quantity: 1000, unitPrice: 150, amount: 150000 },
    { category: 'INVESTMENT', name: 'PSX Shares - ENGRO', quantity: 500, unitPrice: 350, amount: 175000 },
    { category: 'GOLD_SILVER', name: 'Gold Jewelry', type: 'Gold', quantity: 60, unitPrice: 21000, amount: 1260000 },
    { category: 'GOLD_SILVER', name: 'Silver Coins', type: 'Silver', quantity: 300, unitPrice: 250, amount: 75000 },
    { category: 'PROPERTY', name: 'Gulshan Plot', type: 'Plot', zakatApplicable: true, amount: 5000000 },
    { category: 'PROPERTY', name: 'Family Home', type: 'House', zakatApplicable: false, amount: 15000000 },
    { category: 'CURRENCY', name: 'Saudi Riyal', currency: 'SR', amount: 10000 },
    { category: 'CURRENCY', name: 'US Dollar', currency: 'USD', amount: 5000 },
    { category: 'CURRENCY', name: 'Canadian Dollar', currency: 'CAD', amount: 3000 },
    { category: 'LIABILITY', name: 'Car Loan', amount: 300000 },
    { category: 'LIABILITY', name: 'Credit Card Payable', amount: 200000 },
  ];

  // Calculate totals from items
  let cashTotal = 0, bankTotal = 0, goldGrams = 0, silverGrams = 0;
  let businessTotal = 0, otherTotal = 0;
  let srTotal = 0, usdTotal = 0, cadTotal = 0, liabTotal = 0;

  for (const item of itemsData) {
    switch (item.category) {
      case 'CASH': cashTotal += item.amount; break;
      case 'BANK': {
        if (item.currency === 'CAD') bankTotal += item.amount * settings.cadRate;
        else if (item.currency === 'USD') bankTotal += item.amount * settings.usdRate;
        else if (item.currency === 'SR') bankTotal += item.amount * settings.srRate;
        else bankTotal += item.amount;
        break;
      }
      case 'INVESTMENT': businessTotal += (item.quantity && item.unitPrice) ? item.quantity * item.unitPrice : item.amount; break;
      case 'GOLD_SILVER': {
        if (item.type === 'Gold') goldGrams += item.quantity ?? 0;
        else silverGrams += item.quantity ?? 0;
        break;
      }
      case 'PROPERTY': if (item.zakatApplicable !== false) otherTotal += item.amount; break;
      case 'CURRENCY': {
        if (item.currency === 'SR') srTotal += item.amount;
        else if (item.currency === 'USD') usdTotal += item.amount;
        else if (item.currency === 'CAD') cadTotal += item.amount;
        break;
      }
      case 'LIABILITY': liabTotal += item.amount; break;
    }
  }

  const srValuePKR = srTotal * settings.srRate;
  const usdValuePKR = usdTotal * settings.usdRate;
  const cadValuePKR = cadTotal * settings.cadRate;
  const goldValuePKR = goldGrams * settings.goldPrice;
  const silverValuePKR = silverGrams * settings.silverPrice;
  const totalAssets = cashTotal + bankTotal + businessTotal + otherTotal + srValuePKR + usdValuePKR + cadValuePKR + goldValuePKR + silverValuePKR;
  const netAssets = totalAssets - liabTotal;
  const nisabValue = GOLD_NISAB_GRAMS * settings.goldPrice;
  const zakatDue = netAssets >= nisabValue ? Math.round(netAssets * 0.025 * 100) / 100 : 0;

  await prisma.zakatRecord.create({
    data: {
      userId: user.id,
      yearHijri: '1446',
      yearGregorian: 2025,
      zakatDate: new Date('2025-03-01'),
      cash: cashTotal,
      bank: bankTotal,
      goldGrams,
      silverGrams,
      businessAssets: businessTotal,
      otherAssets: otherTotal,
      srAmount: srTotal,
      usdAmount: usdTotal,
      cadAmount: cadTotal,
      liabilities: liabTotal,
      totalAssets: Math.round(totalAssets * 100) / 100,
      netAssets: Math.round(netAssets * 100) / 100,
      zakatDue,
      nisabValue: Math.round(nisabValue * 100) / 100,
      nisabType: settings.nisabType,
      srRate: settings.srRate,
      usdRate: settings.usdRate,
      cadRate: settings.cadRate,
      goldPrice: settings.goldPrice,
      silverPrice: settings.silverPrice,
      items: {
        createMany: {
          data: itemsData.map(item => ({
            category: item.category,
            name: item.name,
            type: item.type || null,
            currency: item.currency || null,
            amount: item.amount,
            quantity: item.quantity ?? null,
            unitPrice: item.unitPrice ?? null,
            zakatApplicable: item.zakatApplicable ?? true,
          })),
        },
      },
    },
  });

  console.log(`Created ${legacyRecords.length} legacy records + 1 record with ${itemsData.length} line items`);
  console.log('\nSeed completed!');
  console.log('  Admin: admin@zakat.com / Admin123!');
  console.log('  User:  user@zakat.com / User123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
