"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPKR } from "@/lib/zakatCalculator";
import type { CategoryTotals, CalcResult } from "@/lib/zakatCalculator";
import {
  Banknote,
  Building2,
  TrendingUp,
  Gem,
  Home,
  Coins,
  MinusCircle,
  Calculator,
  HandCoins,
  AlertTriangle,
} from "lucide-react";

interface CategorySummaryProps {
  categoryTotals: CategoryTotals;
  calcResult: CalcResult;
  zakatPaid?: number;
}

export function CategorySummary({ categoryTotals, calcResult, zakatPaid = 0 }: CategorySummaryProps) {
  const finalPayable = Math.max(0, calcResult.zakatDue - zakatPaid);
  const overpaid = zakatPaid > calcResult.zakatDue && zakatPaid > 0;

  const categories = [
    { label: "Cash Holdings", value: categoryTotals.cashTotal, icon: Banknote, color: "text-green-600" },
    { label: "Bank Accounts", value: categoryTotals.bankTotal, icon: Building2, color: "text-blue-600" },
    { label: "Investments", value: categoryTotals.investmentTotal, icon: TrendingUp, color: "text-purple-600" },
    { label: "Gold & Silver", value: categoryTotals.goldSilverTotal, icon: Gem, color: "text-yellow-600" },
    { label: "Properties", value: categoryTotals.propertyTotal, icon: Home, color: "text-orange-600" },
    { label: "Foreign Currencies", value: categoryTotals.currencyTotal, icon: Coins, color: "text-cyan-600" },
    ...(categoryTotals.loanGivenTotal > 0 ? [{ label: "Loans Given", value: categoryTotals.loanGivenTotal, icon: HandCoins, color: "text-teal-600" }] : []),
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-muted/30 to-muted/60">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Calculation Summary</h3>
        </div>

        {/* Category totals grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-2 p-2 rounded-lg bg-background/60">
              <cat.icon className={`h-4 w-4 ${cat.color} shrink-0`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                <p className="text-sm font-semibold">{formatPKR(cat.value)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Liabilities */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2">
            <MinusCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm text-destructive font-medium">Liabilities</span>
          </div>
          <span className="text-sm font-semibold text-destructive">
            - {formatPKR(categoryTotals.liabilityTotal)}
          </span>
        </div>

        <Separator />

        {/* Summary calculations */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Assets</span>
            <span className="font-semibold">{formatPKR(calcResult.totalAssets)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Net Assets</span>
            <span className="font-semibold">{formatPKR(calcResult.netAssets)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Nisab Threshold</span>
            <span className="font-semibold">{formatPKR(calcResult.nisabValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={calcResult.isAboveNisab ? "default" : "secondary"}>
              {calcResult.isAboveNisab ? "Above Nisab" : "Below Nisab"}
            </Badge>
          </div>

          <Separator />

          <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
            <span className="font-semibold text-sm">Calculated Zakat (2.5%)</span>
            <span className="font-bold text-lg text-primary">{formatPKR(calcResult.zakatDue)}</span>
          </div>

          {zakatPaid > 0 && (
            <>
              <div className="flex justify-between items-center px-3">
                <span className="text-sm text-muted-foreground">Zakat Paid Till Date</span>
                <span className="font-semibold text-sm text-orange-600">- {formatPKR(zakatPaid)}</span>
              </div>
              {overpaid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 dark:text-amber-400">Paid amount exceeds calculated zakat. No further zakat is due.</span>
                </div>
              )}
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-500/30">
                <span className="font-bold text-base">Final Payable Zakat</span>
                <span className="font-bold text-xl text-emerald-700 dark:text-emerald-400">{formatPKR(finalPayable)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
