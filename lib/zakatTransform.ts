import { ZakatFormData } from '@/schemas/zakat.schema';
import { ZakatItem, ZakatRecord, Settings } from '@/types';

/** Transform form section data into flat API items array */
export function formDataToApiPayload(formData: ZakatFormData, settings: Settings) {
  const items: Omit<ZakatItem, 'id' | 'zakatRecordId'>[] = [];

  // Cash holdings
  for (const item of formData.cashHoldings || []) {
    items.push({
      category: 'CASH',
      name: item.description,
      amount: item.amount || 0,
    });
  }

  // Bank accounts
  for (const item of formData.bankAccounts || []) {
    items.push({
      category: 'BANK',
      name: item.name,
      type: item.type,
      currency: item.currency as 'PKR' | 'USD' | 'SR' | 'CAD',
      amount: item.amount || 0,
    });
  }

  // Investments
  for (const item of formData.investments || []) {
    items.push({
      category: 'INVESTMENT',
      name: item.name,
      amount: item.totalValue || 0,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  }

  // Gold & Silver
  for (const item of formData.goldSilverItems || []) {
    items.push({
      category: 'GOLD_SILVER',
      name: item.name || `${item.type} Item`,
      type: item.type,
      amount: item.total || 0,
      quantity: item.weight,
      unitPrice: item.pricePerGram,
    });
  }

  // Properties
  for (const item of formData.properties || []) {
    items.push({
      category: 'PROPERTY',
      name: item.name,
      type: item.type,
      amount: item.value || 0,
      zakatApplicable: item.zakatApplicable,
    });
  }

  // Foreign currencies
  for (const item of formData.foreignCurrencies || []) {
    items.push({
      category: 'CURRENCY',
      name: `${item.currency}`,
      currency: item.currency as 'PKR' | 'USD' | 'SR' | 'CAD',
      amount: item.amount || 0,
    });
  }

  // Liabilities
  for (const item of formData.liabilities || []) {
    items.push({
      category: 'LIABILITY',
      name: item.description,
      amount: item.amount || 0,
    });
  }

  // Loans given
  for (const item of formData.loansGiven || []) {
    items.push({
      category: 'LOAN_GIVEN' as any,
      name: item.personName,
      type: item.description || undefined,
      currency: item.currency as 'PKR' | 'USD' | 'SR' | 'CAD',
      amount: item.amount || 0,
      zakatApplicable: item.includeInZakat,
    });
  }

  return {
    yearHijri: formData.yearHijri,
    yearGregorian: formData.yearGregorian,
    zakatDate: formData.zakatDate || undefined,
    zakatPaid: formData.zakatPaid || 0,
    items,
  };
}

/** Transform API record items back into form section data for editing */
export function apiRecordToFormData(record: ZakatRecord): ZakatFormData {
  const items = record.items || [];

  const cashHoldings = items
    .filter(i => i.category === 'CASH')
    .map(i => ({ description: i.name || 'Cash', amount: i.amount || 0 }));

  const bankAccounts = items
    .filter(i => i.category === 'BANK')
    .map(i => ({
      name: i.name || '',
      type: (i.type as 'Savings' | 'Current' | 'Foreign') || 'Savings',
      currency: (i.currency as 'PKR' | 'USD' | 'SR' | 'CAD') || 'PKR',
      amount: i.amount || 0,
    }));

  const investments = items
    .filter(i => i.category === 'INVESTMENT')
    .map(i => ({
      name: i.name || '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalValue: i.amount || 0,
    }));

  const goldSilverItems = items
    .filter(i => i.category === 'GOLD_SILVER')
    .map(i => ({
      type: (i.type as 'Gold' | 'Silver') || 'Gold',
      name: i.name || '',
      weight: i.quantity || 0,
      pricePerGram: i.unitPrice || 0,
      total: i.amount || 0,
    }));

  const properties = items
    .filter(i => i.category === 'PROPERTY')
    .map(i => ({
      name: i.name || '',
      type: (i.type as 'Plot' | 'House' | 'Commercial') || 'Plot',
      zakatApplicable: i.zakatApplicable ?? true,
      value: i.amount || 0,
    }));

  const foreignCurrencies = items
    .filter(i => i.category === 'CURRENCY')
    .map(i => ({
      currency: (i.currency as 'SR' | 'USD' | 'CAD') || 'SR',
      amount: i.amount || 0,
    }));

  const liabilities = items
    .filter(i => i.category === 'LIABILITY')
    .map(i => ({ description: i.name || 'Liability', amount: i.amount || 0 }));

  const loansGiven = items
    .filter(i => i.category === 'LOAN_GIVEN')
    .map(i => ({
      personName: i.name || '',
      description: i.type || '',
      currency: (i.currency as 'PKR' | 'USD' | 'SR' | 'CAD') || 'PKR',
      amount: i.amount || 0,
      includeInZakat: i.zakatApplicable ?? true,
    }));

  return {
    yearHijri: record.yearHijri,
    yearGregorian: record.yearGregorian,
    zakatDate: record.zakatDate ? new Date(record.zakatDate).toISOString().split('T')[0] : undefined,
    zakatPaid: record.zakatPaid || 0,
    cashHoldings,
    bankAccounts,
    investments,
    goldSilverItems,
    properties,
    foreignCurrencies,
    liabilities,
    loansGiven,
  };
}
