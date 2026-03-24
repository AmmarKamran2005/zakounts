"use client";

import { useEffect } from "react";
import { useFieldArray, useWatch, Control, Controller, useFormContext } from "react-hook-form";
import { TrendingUp, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./SectionWrapper";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface InvestmentsSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

export function InvestmentsSection({ control, settings }: InvestmentsSectionProps) {
  const { setValue } = useFormContext<ZakatFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "investments" });
  const watchedItems = useWatch({ control, name: "investments" });
  const total = (watchedItems || []).reduce((sum, item) => sum + (item?.totalValue || 0), 0);

  useEffect(() => {
    (watchedItems || []).forEach((item, index) => {
      if (item?.quantity && item?.unitPrice) {
        const calculated = item.quantity * item.unitPrice;
        if (calculated !== item.totalValue) {
          setValue(`investments.${index}.totalValue`, calculated);
        }
      }
    });
  }, [watchedItems, setValue]);

  return (
    <SectionWrapper
      title="Investments & Shares"
      total={total}
      icon={<TrendingUp className="h-5 w-5" />}
      onAdd={() => append({ name: "", quantity: undefined, unitPrice: undefined, totalValue: 0 })}
      addLabel="Add Investment"
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No investments added yet. Click below to add one.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-[1.5fr_0.8fr_0.8fr_1fr_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Investment Name</span>
            <span>Quantity</span>
            <span>Value/Unit</span>
            <span>Total Value (PKR)</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr_1fr] gap-3 flex-1">
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Investment Name</Label>
                <Controller control={control} name={`investments.${index}.name`}
                  render={({ field }) => (
                    <Input type="text" placeholder="e.g. Mutual Fund, Shares" value={field.value || ""} onChange={field.onChange} className="h-10" />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Quantity</Label>
                <Controller control={control} name={`investments.${index}.quantity`}
                  render={({ field }) => (
                    <Input type="number" placeholder="Qty (optional)" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="h-10" />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Value / Unit</Label>
                <Controller control={control} name={`investments.${index}.unitPrice`}
                  render={({ field }) => (
                    <Input type="number" placeholder="Price (optional)" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="h-10" />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Total Value (PKR)</Label>
                <Controller control={control} name={`investments.${index}.totalValue`}
                  render={({ field }) => (
                    <Input type="number" placeholder="Total value" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
                  )}
                />
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
