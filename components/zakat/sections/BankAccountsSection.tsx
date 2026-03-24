"use client";

import { useFieldArray, useWatch, Control, Controller } from "react-hook-form";
import { Building2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./SectionWrapper";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface BankAccountsSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

const ACCOUNT_TYPES = ["Savings", "Current", "Foreign"] as const;
const CURRENCIES = ["PKR", "USD", "SR", "CAD"] as const;

function convertToPKR(amount: number, currency: string, settings: Settings): number {
  switch (currency) {
    case "USD": return amount * settings.usdRate;
    case "SR": return amount * settings.srRate;
    case "CAD": return amount * settings.cadRate;
    case "PKR": default: return amount;
  }
}

const selectClass = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function BankAccountsSection({ control, settings }: BankAccountsSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "bankAccounts" });
  const watchedItems = useWatch({ control, name: "bankAccounts" });
  const total = (watchedItems || []).reduce(
    (sum, item) => sum + convertToPKR(item?.amount || 0, item?.currency || "PKR", settings), 0
  );

  return (
    <SectionWrapper
      title="Bank Accounts"
      total={total}
      icon={<Building2 className="h-5 w-5" />}
      onAdd={() => append({ name: "", type: "Savings" as const, currency: "PKR" as const, amount: 0 })}
      addLabel="Add Bank Account"
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No bank accounts added yet. Click below to add one.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_auto_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Bank Name</span>
            <span>Account Type</span>
            <span>Currency</span>
            <span>Amount</span>
            <span>PKR Value</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => {
          const item = watchedItems?.[index];
          const pkrValue = convertToPKR(item?.amount || 0, item?.currency || "PKR", settings);
          const showPkrValue = item?.currency && item.currency !== "PKR";

          return (
            <div key={field.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_auto] gap-3 flex-1">
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Bank Name</Label>
                  <Controller control={control} name={`bankAccounts.${index}.name`}
                    render={({ field }) => (
                      <Input type="text" placeholder="e.g. HBL, Meezan" value={field.value || ""} onChange={field.onChange} className="h-10" />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Account Type</Label>
                  <Controller control={control} name={`bankAccounts.${index}.type`}
                    render={({ field }) => (
                      <select className={selectClass} value={field.value} onChange={field.onChange}>
                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Currency</Label>
                  <Controller control={control} name={`bankAccounts.${index}.currency`}
                    render={({ field }) => (
                      <select className={selectClass} value={field.value} onChange={field.onChange}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Amount</Label>
                  <Controller control={control} name={`bankAccounts.${index}.amount`}
                    render={({ field }) => (
                      <Input type="number" placeholder="0" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
                    )}
                  />
                </div>
                {showPkrValue && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs font-mono whitespace-nowrap">
                      ≈ {formatPKR(pkrValue)}
                    </Badge>
                  </div>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 mt-0 lg:mt-0" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
