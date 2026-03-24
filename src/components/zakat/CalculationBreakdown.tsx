"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatRecord, ZakatItem } from "@/types";

interface CalculationBreakdownProps {
  record: ZakatRecord;
}

function groupItems(items: ZakatItem[]) {
  const groups: Record<string, ZakatItem[]> = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return groups;
}

const categoryLabels: Record<string, string> = {
  CASH: "Cash Holdings",
  BANK: "Bank Accounts",
  INVESTMENT: "Investments",
  GOLD_SILVER: "Gold & Silver",
  PROPERTY: "Properties",
  CURRENCY: "Foreign Currencies",
  LIABILITY: "Liabilities",
};

export function CalculationBreakdown({ record }: CalculationBreakdownProps) {
  const hasItems = record.items && record.items.length > 0;
  const isAboveNisab = record.netAssets >= record.nisabValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calculation Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasItems ? (
          <ItemsBreakdown items={record.items!} record={record} />
        ) : (
          <FlatBreakdown record={record} />
        )}

        <Separator />

        <div className="flex justify-between text-sm font-semibold">
          <span>Total Assets</span>
          <span className="font-mono">{formatPKR(record.totalAssets)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Less: Liabilities</span>
          <span className="font-mono text-destructive">-{formatPKR(record.liabilities)}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Net Assets</span>
          <span className="font-mono">{formatPKR(record.netAssets)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Nisab ({record.nisabType === "gold" ? "Gold: 87.48g" : "Silver: 612.36g"})
          </span>
          <span className="font-mono">{formatPKR(record.nisabValue)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Net Assets {isAboveNisab ? "≥" : "<"} Nisab</span>
          <Badge variant={isAboveNisab ? "default" : "secondary"}>
            {isAboveNisab ? "Zakat Applicable" : "Exempt"}
          </Badge>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Zakat Due (2.5%)</span>
          <span className={`font-mono ${record.zakatDue > 0 ? "text-amber-600" : "text-green-600"}`}>
            {formatPKR(record.zakatDue)}
          </span>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Exchange Rates Used</h4>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>SAR to PKR: {record.srRate}</span>
            <span>USD to PKR: {record.usdRate}</span>
            <span>CAD to PKR: {record.cadRate}</span>
            <span>Gold/gram: {formatPKR(record.goldPrice)}</span>
            <span>Silver/gram: {formatPKR(record.silverPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Breakdown using line items */
function ItemsBreakdown({ items, record }: { items: ZakatItem[]; record: ZakatRecord }) {
  const grouped = groupItems(items);
  const assetCategories = ['CASH', 'BANK', 'INVESTMENT', 'GOLD_SILVER', 'PROPERTY', 'CURRENCY'];

  return (
    <div className="space-y-4">
      {assetCategories.map(cat => {
        const catItems = grouped[cat];
        if (!catItems || catItems.length === 0) return null;
        return (
          <div key={cat}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">{categoryLabels[cat]}</h4>
            {catItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-0.5">
                <span className="text-muted-foreground">
                  {item.name}
                  {item.currency && item.currency !== 'PKR' && (
                    <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">{item.currency}</Badge>
                  )}
                  {item.quantity && item.unitPrice && (
                    <span className="text-xs"> ({item.quantity} × {formatPKR(item.unitPrice)})</span>
                  )}
                  {item.zakatApplicable === false && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">Not Applicable</Badge>
                  )}
                </span>
                <span className="font-mono">{formatPKR(item.amount)}</span>
              </div>
            ))}
          </div>
        );
      })}

      {grouped['LIABILITY'] && grouped['LIABILITY'].length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Liabilities</h4>
          {grouped['LIABILITY'].map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-0.5">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-mono text-destructive">-{formatPKR(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Legacy breakdown for records without line items */
function FlatBreakdown({ record }: { record: ZakatRecord }) {
  const goldValue = record.goldGrams * record.goldPrice;
  const silverValue = record.silverGrams * record.silverPrice;
  const srValue = record.srAmount * record.srRate;
  const usdValue = record.usdAmount * record.usdRate;
  const cadValue = record.cadAmount * record.cadRate;

  const lines = [
    { label: "Cash in Hand", value: record.cash },
    { label: "Bank Balance", value: record.bank },
    { label: `Gold: ${record.goldGrams}g × ${formatPKR(record.goldPrice)}/g`, value: goldValue },
    { label: `Silver: ${record.silverGrams}g × ${formatPKR(record.silverPrice)}/g`, value: silverValue },
    { label: "Business Assets", value: record.businessAssets },
    { label: "Other Assets", value: record.otherAssets },
    { label: `SAR: ${record.srAmount.toLocaleString()} × ${record.srRate}`, value: srValue },
    { label: `USD: ${record.usdAmount.toLocaleString()} × ${record.usdRate}`, value: usdValue },
    { label: `CAD: ${record.cadAmount.toLocaleString()} × ${record.cadRate}`, value: cadValue },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground">Asset Details</h4>
      {lines.map((line, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{line.label}</span>
          <span className="font-mono">{formatPKR(line.value)}</span>
        </div>
      ))}
    </div>
  );
}
