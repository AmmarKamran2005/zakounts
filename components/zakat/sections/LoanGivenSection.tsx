"use client";

import { useFieldArray, useWatch, Control, Controller } from "react-hook-form";
import { HandCoins, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SectionWrapper } from "./SectionWrapper";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface LoanGivenSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

const CURRENCIES = ["PKR", "USD", "SR", "CAD"] as const;

function convertToPKR(amount: number, currency: string, settings: Settings): number {
  switch (currency) {
    case "SR": return amount * settings.srRate;
    case "USD": return amount * settings.usdRate;
    case "CAD": return amount * settings.cadRate;
    default: return amount;
  }
}

export function LoanGivenSection({ control, settings }: LoanGivenSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "loansGiven" });
  const watchedItems = useWatch({ control, name: "loansGiven" });

  const total = (watchedItems || []).reduce((sum, item) => {
    if (!item?.includeInZakat) return sum;
    return sum + convertToPKR(item?.amount || 0, item?.currency || "PKR", settings);
  }, 0);

  return (
    <SectionWrapper
      title="Loans Given"
      total={total}
      icon={<HandCoins className="h-5 w-5" />}
      onAdd={() => append({ personName: "", description: "", currency: "PKR", amount: 0, includeInZakat: true })}
      addLabel="Add Loan"
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No loans given added yet. Track money you&apos;ve lent to others.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_0.8fr_0.5fr_0.7fr_80px_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Person Name</span>
            <span>Description</span>
            <span>Currency</span>
            <span>Amount</span>
            <span>Include</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => {
          const item = watchedItems?.[index];
          const pkrValue = item ? convertToPKR(item.amount || 0, item.currency || "PKR", settings) : 0;
          const isIncluded = item?.includeInZakat;

          return (
            <div key={field.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_0.8fr_0.5fr_0.7fr_80px] gap-3 flex-1">
                <div>
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Person Name</Label>
                  <Controller control={control} name={`loansGiven.${index}.personName`}
                    render={({ field }) => (
                      <Input type="text" placeholder="e.g. Ahmed" value={field.value || ""} onChange={field.onChange} className="h-10" />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Description</Label>
                  <Controller control={control} name={`loansGiven.${index}.description`}
                    render={({ field }) => (
                      <Input type="text" placeholder="Optional note" value={field.value || ""} onChange={field.onChange} className="h-10" />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Currency</Label>
                  <Controller control={control} name={`loansGiven.${index}.currency`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Amount</Label>
                  <Controller control={control} name={`loansGiven.${index}.amount`}
                    render={({ field }) => (
                      <Input type="number" placeholder="0" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
                    )}
                  />
                  {item?.currency && item.currency !== "PKR" && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ≈ PKR {pkrValue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:justify-center">
                  <Label className="text-xs text-muted-foreground sm:hidden">Include in Zakat</Label>
                  <Controller control={control} name={`loansGiven.${index}.includeInZakat`}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <Badge variant={field.value ? "default" : "secondary"} className="text-[10px]">
                          {field.value ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                  />
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 mt-0 sm:mt-0" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
