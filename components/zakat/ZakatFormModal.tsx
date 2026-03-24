"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { zakatFormSchema, type ZakatFormData } from "@/schemas/zakat.schema";
import { useSettings } from "@/hooks/useSettings";
import { useDraft } from "@/hooks/useDraft";
import { calculateZakatFromFormData, formatPKR } from "@/lib/zakatCalculator";
import { formDataToApiPayload, apiRecordToFormData } from "@/lib/zakatTransform";
import { getCurrentHijriYear, getCurrentGregorianYear } from "@/lib/hijri";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { ZakatRecord } from "@/types";

import { CashHoldingsSection } from "./sections/CashHoldingsSection";
import { BankAccountsSection } from "./sections/BankAccountsSection";
import { InvestmentsSection } from "./sections/InvestmentsSection";
import { GoldSilverSection } from "./sections/GoldSilverSection";
import { PropertiesSection } from "./sections/PropertiesSection";
import { ForeignCurrenciesSection } from "./sections/ForeignCurrenciesSection";
import { LiabilitiesSection } from "./sections/LiabilitiesSection";
import { LoanGivenSection } from "./sections/LoanGivenSection";
import { CategorySummary } from "./CategorySummary";

interface ZakatFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: ZakatRecord | null;
  prefillData?: ZakatFormData | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export function ZakatFormModal({ open, onOpenChange, record, prefillData, onSubmit }: ZakatFormModalProps) {
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: ZakatFormData = prefillData
    ? prefillData
    : record?.items && record.items.length > 0
      ? apiRecordToFormData(record)
      : {
          yearHijri: record?.yearHijri || getCurrentHijriYear(),
          yearGregorian: record?.yearGregorian || getCurrentGregorianYear(),
          zakatDate: undefined,
          zakatPaid: 0,
          cashHoldings: [],
          bankAccounts: [],
          investments: [],
          goldSilverItems: [],
          properties: [],
          foreignCurrencies: [],
          liabilities: [],
          loansGiven: [],
        };

  const form = useForm<ZakatFormData>({
    resolver: zodResolver(zakatFormSchema),
    defaultValues,
  });

  const { clearDraft } = useDraft(record ? `zakat-edit-${record.id}` : "zakat-new", form);

  useEffect(() => {
    if (prefillData) {
      form.reset(prefillData);
    } else if (record) {
      if (record.items && record.items.length > 0) {
        form.reset(apiRecordToFormData(record));
      } else {
        form.reset({
          yearHijri: record.yearHijri,
          yearGregorian: record.yearGregorian,
          zakatDate: record.zakatDate ? new Date(record.zakatDate).toISOString().split('T')[0] : undefined,
          cashHoldings: [{ description: "Cash", amount: record.cash }],
          bankAccounts: record.bank > 0 ? [{ name: "Bank", type: "Savings" as const, currency: "PKR" as const, amount: record.bank }] : [],
          investments: record.businessAssets > 0 ? [{ name: "Business Assets", totalValue: record.businessAssets }] : [],
          goldSilverItems: [
            ...(record.goldGrams > 0 ? [{ type: "Gold" as const, name: "Gold", weight: record.goldGrams, pricePerGram: record.goldPrice, total: record.goldGrams * record.goldPrice }] : []),
            ...(record.silverGrams > 0 ? [{ type: "Silver" as const, name: "Silver", weight: record.silverGrams, pricePerGram: record.silverPrice, total: record.silverGrams * record.silverPrice }] : []),
          ],
          properties: record.otherAssets > 0 ? [{ name: "Other Assets", type: "Plot" as const, zakatApplicable: true, value: record.otherAssets }] : [],
          foreignCurrencies: [
            ...(record.srAmount > 0 ? [{ currency: "SR" as const, amount: record.srAmount }] : []),
            ...(record.usdAmount > 0 ? [{ currency: "USD" as const, amount: record.usdAmount }] : []),
            ...(record.cadAmount > 0 ? [{ currency: "CAD" as const, amount: record.cadAmount }] : []),
          ],
          liabilities: record.liabilities > 0 ? [{ description: "Liabilities", amount: record.liabilities }] : [],
          loansGiven: [],
          zakatPaid: record.zakatPaid || 0,
        });
      }
    }
  }, [record, prefillData, form]);

  const watchedValues = form.watch();

  const calcResult = settings
    ? calculateZakatFromFormData(watchedValues, settings)
    : null;

  async function handleSubmit(values: ZakatFormData) {
    if (!settings) {
      toast.error("Please configure your settings first");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = formDataToApiPayload(values, settings);
      await onSubmit(payload);
      clearDraft();
      form.reset();
      onOpenChange(false);
      toast.success(record ? "Record updated" : "Record created");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[92vw] lg:max-w-6xl max-h-[95vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {record ? "Edit Zakat Record" : "New Zakat Record"}
          </DialogTitle>
          <DialogDescription>
            Add your assets across different categories. Zakat is calculated live as you enter values.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-2">
            {/* Period Section */}
            <div className="rounded-xl border bg-muted/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Zakat Period</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearHijri" className="text-sm font-medium">Hijri Year</Label>
                  <Input
                    id="yearHijri"
                    {...form.register("yearHijri")}
                    placeholder="e.g. 1446"
                    className="h-10"
                  />
                  {form.formState.errors.yearHijri && (
                    <p className="text-xs text-destructive">{form.formState.errors.yearHijri.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearGregorian" className="text-sm font-medium">Gregorian Year</Label>
                  <Input
                    id="yearGregorian"
                    type="number"
                    {...form.register("yearGregorian", { valueAsNumber: true })}
                    placeholder="e.g. 2025"
                    className="h-10"
                  />
                  {form.formState.errors.yearGregorian && (
                    <p className="text-xs text-destructive">{form.formState.errors.yearGregorian.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zakatDate" className="text-sm font-medium">Zakat Date</Label>
                  <Input
                    id="zakatDate"
                    type="date"
                    {...form.register("zakatDate")}
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground">Optional — date of zakat calculation</p>
                </div>
              </div>
            </div>

            {/* Asset Sections */}
            {settings && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assets</h3>
                <CashHoldingsSection control={form.control} settings={settings} />
                <BankAccountsSection control={form.control} settings={settings} />
                <InvestmentsSection control={form.control} settings={settings} />
                <GoldSilverSection control={form.control} settings={settings} />
                <PropertiesSection control={form.control} settings={settings} />
                <ForeignCurrenciesSection control={form.control} settings={settings} />
                <LoanGivenSection control={form.control} settings={settings} />

                <Separator className="my-4" />

                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deductions</h3>
                <LiabilitiesSection control={form.control} settings={settings} />
              </div>
            )}

            {/* Zakat Paid + Calculation Summary */}
            {calcResult && (
              <>
                <Separator className="my-4" />

                {/* Zakat Paid Input */}
                <div className="rounded-xl border bg-muted/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-foreground">Zakat Paid Till Date (Optional)</span>
                  </div>
                  <div className="max-w-xs">
                    <Input
                      type="number"
                      placeholder="0"
                      {...form.register("zakatPaid", { valueAsNumber: true })}
                      className="h-10"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Enter amount already paid — will be subtracted from calculated zakat
                    </p>
                  </div>
                </div>

                <CategorySummary
                  categoryTotals={calcResult.categoryTotals}
                  calcResult={calcResult}
                  zakatPaid={watchedValues.zakatPaid || 0}
                />
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {record ? "Update Record" : "Create Record"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
