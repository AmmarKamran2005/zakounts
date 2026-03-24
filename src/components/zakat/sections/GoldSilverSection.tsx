"use client";

import { useEffect } from "react";
import { useFieldArray, useWatch, Control, Controller, useFormContext } from "react-hook-form";
import { Gem, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./SectionWrapper";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface GoldSilverSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

const METAL_TYPES = ["Gold", "Silver"] as const;
const selectClass = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function GoldSilverSection({ control, settings }: GoldSilverSectionProps) {
  const { setValue } = useFormContext<ZakatFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "goldSilverItems" });
  const watchedItems = useWatch({ control, name: "goldSilverItems" });
  const total = (watchedItems || []).reduce((sum, item) => sum + (item?.total || 0), 0);

  useEffect(() => {
    (watchedItems || []).forEach((item, index) => {
      if (!item) return;
      const expectedPrice = item.type === "Gold" ? settings.goldPrice : settings.silverPrice;
      if (item.pricePerGram !== expectedPrice && item.pricePerGram === (item.type === "Gold" ? settings.silverPrice : settings.goldPrice)) {
        setValue(`goldSilverItems.${index}.pricePerGram`, expectedPrice);
      }
      const calculatedTotal = (item.weight || 0) * (item.pricePerGram || 0);
      if (calculatedTotal !== item.total) {
        setValue(`goldSilverItems.${index}.total`, calculatedTotal);
      }
    });
  }, [watchedItems, setValue, settings.goldPrice, settings.silverPrice]);

  return (
    <SectionWrapper
      title="Gold & Silver"
      total={total}
      icon={<Gem className="h-5 w-5" />}
      onAdd={() => append({ type: "Gold" as const, name: "", weight: 0, pricePerGram: settings.goldPrice, total: 0 })}
      addLabel="Add Gold/Silver Item"
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No gold or silver items added yet. Click below to add one.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-[0.7fr_1.2fr_0.8fr_0.8fr_auto_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Type</span>
            <span>Description</span>
            <span>Weight (grams)</span>
            <span>Price / gram</span>
            <span>Total</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => {
          const item = watchedItems?.[index];
          const itemTotal = (item?.weight || 0) * (item?.pricePerGram || 0);

          return (
            <div key={field.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[0.7fr_1.2fr_0.8fr_0.8fr_auto] gap-3 flex-1">
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Type</Label>
                  <Controller control={control} name={`goldSilverItems.${index}.type`}
                    render={({ field }) => (
                      <select className={selectClass} value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          const newPrice = e.target.value === "Gold" ? settings.goldPrice : settings.silverPrice;
                          setValue(`goldSilverItems.${index}.pricePerGram`, newPrice);
                        }}>
                        {METAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Description</Label>
                  <Controller control={control} name={`goldSilverItems.${index}.name`}
                    render={({ field }) => (
                      <Input type="text" placeholder="e.g. Jewelry, Coins" value={field.value || ""} onChange={field.onChange} className="h-10" />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Weight (grams)</Label>
                  <Controller control={control} name={`goldSilverItems.${index}.weight`}
                    render={({ field }) => (
                      <Input type="number" placeholder="0" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Price / gram (PKR)</Label>
                  <Controller control={control} name={`goldSilverItems.${index}.pricePerGram`}
                    render={({ field }) => (
                      <Input type="number" placeholder="0" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
                    )}
                  />
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="text-xs font-mono whitespace-nowrap">
                    = {formatPKR(itemTotal)}
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
