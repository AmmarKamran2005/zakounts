import { ZakatFormData } from '@/schemas/zakat.schema';
import { Settings } from '@/types';

export interface CalcInput {
  cash: number;
  bank: number;
  goldGrams: number;
  silverGrams: number;
  businessAssets: number;
  otherAssets: number;
  srAmount: number;
  usdAmount: number;
  cadAmount: number;
  liabilities: number;
  srRate: number;
  usdRate: number;
  cadRate: number;
  goldPrice: number;
  silverPrice: number;
  nisabType: 'gold' | 'silver';
}

export interface CalcResult {
  totalAssets: number;
  netAssets: number;
  zakatDue: number;
  nisabValue: number;
  isAboveNisab: boolean;
}

export interface CategoryTotals {
  cashTotal: number;
  bankTotal: number;
  investmentTotal: number;
  goldSilverTotal: number;
  propertyTotal: number;
  currencyTotal: number;
  liabilityTotal: number;
  grandTotal: number;
}

const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;

function convertToPKR(amount: number, currency: string, rates: { srRate: number; usdRate: number; cadRate: number }): number {
  switch (currency) {
    case 'SR': return amount * rates.srRate;
    case 'USD': return amount * rates.usdRate;
    case 'CAD': return amount * rates.cadRate;
    case 'PKR':
    default: return amount;
  }
}

export function calculateZakat(input: CalcInput): CalcResult {
  const srValuePKR = input.srAmount * input.srRate;
  const usdValuePKR = input.usdAmount * input.usdRate;
  const cadValuePKR = input.cadAmount * input.cadRate;
  const goldValuePKR = input.goldGrams * input.goldPrice;
  const silverValuePKR = input.silverGrams * input.silverPrice;

  const totalAssets =
    input.cash +
    input.bank +
    input.businessAssets +
    input.otherAssets +
    srValuePKR +
    usdValuePKR +
    cadValuePKR +
    goldValuePKR +
    silverValuePKR;

  const netAssets = totalAssets - input.liabilities;

  const nisabValue =
    input.nisabType === 'gold'
      ? GOLD_NISAB_GRAMS * input.goldPrice
      : SILVER_NISAB_GRAMS * input.silverPrice;

  const isAboveNisab = netAssets >= nisabValue;
  const zakatDue = isAboveNisab ? Math.round(netAssets * 0.025 * 100) / 100 : 0;

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    netAssets: Math.round(netAssets * 100) / 100,
    zakatDue,
    nisabValue: Math.round(nisabValue * 100) / 100,
    isAboveNisab,
  };
}

/** Calculate zakat from the new form data structure */
export function calculateZakatFromFormData(formData: ZakatFormData, settings: Settings): CalcResult & { categoryTotals: CategoryTotals } {
  const rates = { srRate: settings.srRate, usdRate: settings.usdRate, cadRate: settings.cadRate };

  // Cash holdings
  const cashTotal = (formData.cashHoldings || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  // Bank accounts (convert currencies)
  const bankTotal = (formData.bankAccounts || []).reduce((sum, item) =>
    sum + convertToPKR(item.amount || 0, item.currency || 'PKR', rates), 0);

  // Investments
  const investmentTotal = (formData.investments || []).reduce((sum, item) => {
    const val = (item.quantity && item.unitPrice) ? item.quantity * item.unitPrice : (item.totalValue || 0);
    return sum + val;
  }, 0);

  // Gold & Silver
  let goldGrams = 0;
  let silverGrams = 0;
  const goldSilverTotal = (formData.goldSilverItems || []).reduce((sum, item) => {
    const weight = item.weight || 0;
    const price = item.pricePerGram || (item.type === 'Gold' ? settings.goldPrice : settings.silverPrice);
    if (item.type === 'Gold') goldGrams += weight;
    else silverGrams += weight;
    return sum + (weight * price);
  }, 0);

  // Properties (only zakat-applicable)
  const propertyTotal = (formData.properties || []).reduce((sum, item) =>
    sum + (item.zakatApplicable ? (item.value || 0) : 0), 0);

  // Foreign currencies
  let srAmount = 0, usdAmount = 0, cadAmount = 0;
  const currencyTotal = (formData.foreignCurrencies || []).reduce((sum, item) => {
    const amt = item.amount || 0;
    if (item.currency === 'SR') srAmount += amt;
    else if (item.currency === 'USD') usdAmount += amt;
    else if (item.currency === 'CAD') cadAmount += amt;
    return sum + convertToPKR(amt, item.currency, rates);
  }, 0);

  // Liabilities
  const liabilityTotal = (formData.liabilities || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  const grandTotal = cashTotal + bankTotal + investmentTotal + goldSilverTotal + propertyTotal + currencyTotal;

  const calcInput: CalcInput = {
    cash: cashTotal,
    bank: bankTotal,
    goldGrams: 0, // Already included in goldSilverTotal via bank
    silverGrams: 0,
    businessAssets: investmentTotal,
    otherAssets: propertyTotal,
    srAmount: 0, // Already included in currencyTotal
    usdAmount: 0,
    cadAmount: 0,
    liabilities: liabilityTotal,
    srRate: settings.srRate,
    usdRate: settings.usdRate,
    cadRate: settings.cadRate,
    goldPrice: settings.goldPrice,
    silverPrice: settings.silverPrice,
    nisabType: settings.nisabType as 'gold' | 'silver',
  };

  // Direct calculation since values are already in PKR
  const totalAssets = grandTotal;
  const netAssets = totalAssets - liabilityTotal;
  const nisabValue = settings.nisabType === 'gold'
    ? GOLD_NISAB_GRAMS * settings.goldPrice
    : SILVER_NISAB_GRAMS * settings.silverPrice;
  const isAboveNisab = netAssets >= nisabValue;
  const zakatDue = isAboveNisab ? Math.round(netAssets * 0.025 * 100) / 100 : 0;

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    netAssets: Math.round(netAssets * 100) / 100,
    zakatDue,
    nisabValue: Math.round(nisabValue * 100) / 100,
    isAboveNisab,
    categoryTotals: {
      cashTotal: Math.round(cashTotal * 100) / 100,
      bankTotal: Math.round(bankTotal * 100) / 100,
      investmentTotal: Math.round(investmentTotal * 100) / 100,
      goldSilverTotal: Math.round(goldSilverTotal * 100) / 100,
      propertyTotal: Math.round(propertyTotal * 100) / 100,
      currencyTotal: Math.round(currencyTotal * 100) / 100,
      liabilityTotal: Math.round(liabilityTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    },
  };
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
