export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export type ZakatItemCategory = 'BANK' | 'INVESTMENT' | 'GOLD_SILVER' | 'PROPERTY' | 'CASH' | 'CURRENCY' | 'LIABILITY' | 'LOAN_GIVEN';

export interface ZakatItem {
  id?: string;
  zakatRecordId?: string;
  category: ZakatItemCategory;
  name: string;
  type?: string;
  currency?: 'PKR' | 'USD' | 'SR' | 'CAD';
  amount: number;
  quantity?: number;
  unitPrice?: number;
  zakatApplicable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ZakatRecord {
  id: string;
  userId: string;
  yearHijri: string;
  yearGregorian: number;
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
  totalAssets: number;
  netAssets: number;
  zakatDue: number;
  zakatPaid: number;
  nisabValue: number;
  nisabType: string;
  srRate: number;
  usdRate: number;
  cadRate: number;
  goldPrice: number;
  silverPrice: number;
  zakatDate?: string;
  createdAt: string;
  updatedAt: string;
  items?: ZakatItem[];
}

export interface Settings {
  id: string;
  userId: string;
  srRate: number;
  usdRate: number;
  cadRate: number;
  goldPrice: number;
  silverPrice: number;
  nisabType: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface AdminUser extends User {
  _count: { zakatRecords: number };
}
