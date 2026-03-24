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

export interface ItemsCalcResult extends CalcResult {
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
}

export interface ZakatItemInput {
  category: 'BANK' | 'INVESTMENT' | 'GOLD_SILVER' | 'PROPERTY' | 'CASH' | 'CURRENCY' | 'LIABILITY' | 'LOAN_GIVEN';
  name: string;
  type?: string;
  currency?: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  zakatApplicable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RatesInput {
  srRate: number;
  usdRate: number;
  cadRate: number;
  goldPrice: number;
  silverPrice: number;
  nisabType: 'gold' | 'silver';
}

const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;

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

function convertToPKR(amount: number, currency: string | undefined, rates: RatesInput): number {
  switch (currency) {
    case 'SR': return amount * rates.srRate;
    case 'USD': return amount * rates.usdRate;
    case 'CAD': return amount * rates.cadRate;
    case 'PKR':
    default: return amount;
  }
}

export function calculateZakatFromItems(items: ZakatItemInput[], rates: RatesInput): ItemsCalcResult {
  let cash = 0;
  let bank = 0;
  let goldGrams = 0;
  let silverGrams = 0;
  let businessAssets = 0;
  let otherAssets = 0;
  let srAmount = 0;
  let usdAmount = 0;
  let cadAmount = 0;
  let liabilities = 0;

  for (const item of items) {
    switch (item.category) {
      case 'CASH':
        cash += item.amount;
        break;

      case 'BANK':
        bank += convertToPKR(item.amount, item.currency, rates);
        break;

      case 'INVESTMENT': {
        const investValue = (item.quantity && item.unitPrice)
          ? item.quantity * item.unitPrice
          : item.amount;
        businessAssets += investValue;
        break;
      }

      case 'GOLD_SILVER': {
        const weight = item.quantity ?? item.amount;
        if (item.type === 'Gold') {
          goldGrams += weight;
        } else {
          silverGrams += weight;
        }
        if (item.unitPrice && item.unitPrice !== (item.type === 'Gold' ? rates.goldPrice : rates.silverPrice)) {
          const directValue = weight * item.unitPrice;
          const settingsValue = weight * (item.type === 'Gold' ? rates.goldPrice : rates.silverPrice);
          otherAssets += (directValue - settingsValue);
        }
        break;
      }

      case 'PROPERTY':
        if (item.zakatApplicable !== false) {
          otherAssets += item.amount;
        }
        break;

      case 'CURRENCY':
        if (item.currency === 'SR') srAmount += item.amount;
        else if (item.currency === 'USD') usdAmount += item.amount;
        else if (item.currency === 'CAD') cadAmount += item.amount;
        break;

      case 'LIABILITY':
        liabilities += item.amount;
        break;

      case 'LOAN_GIVEN':
        if (item.zakatApplicable !== false) {
          cash += convertToPKR(item.amount, item.currency, rates);
        }
        break;
    }
  }

  const calcResult = calculateZakat({
    cash, bank, goldGrams, silverGrams, businessAssets, otherAssets,
    srAmount, usdAmount, cadAmount, liabilities,
    ...rates,
  });

  return {
    ...calcResult,
    cash, bank, goldGrams, silverGrams, businessAssets, otherAssets,
    srAmount, usdAmount, cadAmount, liabilities,
  };
}
