"use client";

import { useFieldArray, useWatch, Control, Controller } from "react-hook-form";
import { Banknote, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./SectionWrapper";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface CashHoldingsSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

const PLACEHOLDERS = ["Cash in hand", "Cash with family", "Cash in wallet"];

export function CashHoldingsSection({ control, settings }: CashHoldingsSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "cashHoldings" });
  const watchedItems = useWatch({ control, name: "cashHoldings" });
  const total = (watchedItems || []).reduce((sum, item) => sum + (item?.amount || 0), 0);

  return (
    <SectionWrapper
      title="Cash Holdings"
      total={total}
      icon={<Banknote className="h-5 w-5" />}
      onAdd={() => append({ description: "", amount: 0 })}
      addLabel="Add Cash Item"
      defaultOpen
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No cash holdings added yet. Click below to add one.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Description</span>
            <span>Amount (PKR)</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-3 p-3 sm:p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3 flex-1">
              <div>
                <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Description</Label>
                <Controller
                  control={control}
                  name={`cashHoldings.${index}.description`}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder={PLACEHOLDERS[index % PLACEHOLDERS.length]}
                      value={field.value || ""}
                      onChange={field.onChange}
                      className="h-10"
                    />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">Amount (PKR)</Label>
                <Controller
                  control={control}
                  name={`cashHoldings.${index}.amount`}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="0"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      className="h-10"
                    />
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
