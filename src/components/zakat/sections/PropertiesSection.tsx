"use client";

import { useFieldArray, useWatch, Control, Controller } from "react-hook-form";
import { Home, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SectionWrapper } from "./SectionWrapper";
import type { ZakatFormData } from "@/schemas/zakat.schema";
import type { Settings } from "@/types";

interface PropertiesSectionProps {
  control: Control<ZakatFormData>;
  settings: Settings;
}

const selectClass = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function PropertiesSection({ control, settings }: PropertiesSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "properties" });
  const watchedItems = useWatch({ control, name: "properties" });
  const total = (watchedItems || []).reduce(
    (sum, item) => sum + (item?.zakatApplicable ? (item?.value || 0) : 0), 0
  );

  return (
    <SectionWrapper
      title="Properties & Real Estate"
      total={total}
      icon={<Home className="h-5 w-5" />}
      onAdd={() => append({ name: "", type: "Plot" as const, zakatApplicable: true, value: 0 })}
      addLabel="Add Property"
    >
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No properties added yet. Click below to add one.
          </p>
        )}
        {fields.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_40px] gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Property Name</span>
            <span>Type</span>
            <span>Zakat Applicable</span>
            <span>Estimated Value (PKR)</span>
            <span></span>
          </div>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr_1fr] gap-3 flex-1">
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Property Name</Label>
                <Controller control={control} name={`properties.${index}.name`}
                  render={({ field }) => (
                    <Input type="text" placeholder="e.g. Gulshan Plot" value={field.value || ""} onChange={field.onChange} className="h-10" />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Type</Label>
                <Controller control={control} name={`properties.${index}.type`}
                  render={({ field }) => (
                    <select className={selectClass} value={field.value} onChange={field.onChange}>
                      <option value="Plot">Plot</option>
                      <option value="House">House</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Zakat Applicable</Label>
                <Controller control={control} name={`properties.${index}.zakatApplicable`}
                  render={({ field }) => (
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={field.value} onCheckedChange={field.onChange} size="sm" />
                      <Badge variant={field.value ? "default" : "secondary"} className="text-xs">
                        {field.value ? "Yes" : "No"}
                      </Badge>
                    </div>
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground lg:hidden mb-1 block">Estimated Value (PKR)</Label>
                <Controller control={control} name={`properties.${index}.value`}
                  render={({ field }) => (
                    <Input type="number" placeholder="0" value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className="h-10" />
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
