import { z } from 'zod';

// Individual item schemas per section
export const bankItemSchema = z.object({
  name: z.string().min(1, 'Bank name required'),
  type: z.enum(['Savings', 'Current', 'Foreign']),
  currency: z.enum(['PKR', 'USD', 'SR', 'CAD']),
  amount: z.number().min(0, 'Must be 0 or greater'),
});

export const investmentItemSchema = z.object({
  name: z.string().min(1, 'Investment name required'),
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  totalValue: z.number().min(0, 'Must be 0 or greater'),
});

export const goldSilverItemSchema = z.object({
  type: z.enum(['Gold', 'Silver']),
  name: z.string(),
  weight: z.number().min(0, 'Must be 0 or greater'),
  pricePerGram: z.number().min(0),
  total: z.number().min(0),
});

export const propertyItemSchema = z.object({
  name: z.string(),
  type: z.enum(['Plot', 'House', 'Commercial']),
  zakatApplicable: z.boolean(),
  value: z.number().min(0, 'Must be 0 or greater'),
});

export const cashItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.number().min(0, 'Must be 0 or greater'),
});

export const currencyItemSchema = z.object({
  currency: z.enum(['SR', 'USD', 'CAD']),
  amount: z.number().min(0, 'Must be 0 or greater'),
});

export const liabilityItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.number().min(0, 'Must be 0 or greater'),
});

export const loanGivenItemSchema = z.object({
  personName: z.string().min(1, 'Person name required'),
  description: z.string().optional(),
  currency: z.enum(['PKR', 'USD', 'SR', 'CAD']),
  amount: z.number().min(0, 'Must be 0 or greater'),
  includeInZakat: z.boolean(),
});

// Main form schema
export const zakatFormSchema = z.object({
  yearHijri: z.string().min(1, 'Hijri year is required'),
  yearGregorian: z.number().int().min(2000).max(2100),
  zakatDate: z.string().optional(),
  zakatPaid: z.number().min(0).optional(),
  bankAccounts: z.array(bankItemSchema),
  investments: z.array(investmentItemSchema),
  goldSilverItems: z.array(goldSilverItemSchema),
  properties: z.array(propertyItemSchema),
  cashHoldings: z.array(cashItemSchema),
  foreignCurrencies: z.array(currencyItemSchema),
  liabilities: z.array(liabilityItemSchema),
  loansGiven: z.array(loanGivenItemSchema),
});

export type ZakatFormData = z.infer<typeof zakatFormSchema>;
export type BankItem = z.infer<typeof bankItemSchema>;
export type InvestmentItem = z.infer<typeof investmentItemSchema>;
export type GoldSilverItem = z.infer<typeof goldSilverItemSchema>;
export type PropertyItem = z.infer<typeof propertyItemSchema>;
export type CashItem = z.infer<typeof cashItemSchema>;
export type CurrencyItem = z.infer<typeof currencyItemSchema>;
export type LiabilityItem = z.infer<typeof liabilityItemSchema>;
export type LoanGivenItem = z.infer<typeof loanGivenItemSchema>;
