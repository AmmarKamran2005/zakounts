"use client";

import { useFieldArray, useWatch, Control, Controller } from "react-hook-form";
import { Coins, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionWrapper } from "./SectionWrapper";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface ForeignCurrenciesSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

const selectClass = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function getRate(currency: string, settings: Settings): number {
  switch (currency) {
    case "SR": return settings.srRate;
    case "USD": return settings.usdRate;
    case "CAD": return settings.cadRate;
    default: return 0;
  }
}

export function ForeignCurrenciesSection({ control, settings }: ForeignCurrenciesSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "foreignCurrencies" });
  const watchedItems = useWatch({ control, name: "foreignCurrencies" });
  const total = (watchedItems || []).reduce((sum, item) => {
    return sum + (item?.amount || 0) * getRate(item?.currency || "SR", settings);
  }, 0);

  return (
    <SectionWrapper
      title="Foreign Currencies"
      total={total}
      icon={<Coins className="h-5 w-5" />}
      onAdd={() => append({ currency: "SR" as const, amount: 0 })}
      addLabel="Add Currency"
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No foreign currencies added yet. Click below to add one.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_auto_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Currency</span>
            <span>Amount</span>
            <span>PKR Equivalent</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => {
          const watched = watchedItems?.[index];
          const amount = watched?.amount || 0;
          const rate = getRate(watched?.currency || "SR", settings);
          const pkrEquivalent = amount * rate;

          return (
            <div key={field.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 flex-1">
                <div>
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Currency</Label>
                  <Controller control={control} name={`foreignCurrencies.${index}.currency`}
                    render={({ field }) => (
                      <select className={selectClass} value={field.value} onChange={field.onChange}>
                        <option value="SR">SR (Saudi Riyal)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="CAD">CAD (Canadian Dollar)</option>
                      </select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Amount</Label>
                  <Controller control={control} name={`foreignCurrencies.${index}.amount`}
                    render={({ field }) => (
                      <Input type="number" placeholder="0" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
                    )}
                  />
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="text-xs font-mono whitespace-nowrap">
                    ≈ {formatPKR(pkrEquivalent)}
                  </Badge>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
