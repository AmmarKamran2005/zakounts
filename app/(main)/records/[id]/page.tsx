"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useZakatRecord } from "@/hooks/useZakat";
import { useAuth } from "@/providers/AuthProvider";
import { generateZakatPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { CalculationBreakdown } from "@/components/zakat/CalculationBreakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Banknote, Building2, TrendingUp, Gem, Home, Coins, MinusCircle, HandCoins, FileDown, Printer, Loader2 } from "lucide-react";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatItem } from "@/types";

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CASH: { label: "Cash Holdings", icon: Banknote, color: "text-green-600" },
  BANK: { label: "Bank Accounts", icon: Building2, color: "text-blue-600" },
  INVESTMENT: { label: "Investments", icon: TrendingUp, color: "text-purple-600" },
  GOLD_SILVER: { label: "Gold & Silver", icon: Gem, color: "text-yellow-600" },
  PROPERTY: { label: "Properties", icon: Home, color: "text-orange-600" },
  CURRENCY: { label: "Foreign Currencies", icon: Coins, color: "text-cyan-600" },
  LOAN_GIVEN: { label: "Loans Given", icon: HandCoins, color: "text-teal-600" },
  LIABILITY: { label: "Liabilities", icon: MinusCircle, color: "text-red-600" },
};

function groupItemsByCategory(items: ZakatItem[]): Record<string, ZakatItem[]> {
  const groups: Record<string, ZakatItem[]> = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return groups;
}

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { record, loading, error } = useZakatRecord(id);
  const { user } = useAuth();
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!record || !user) return;
    setPdfLoading(true);
    try {
      generateZakatPDF(record, user.name);
      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || "Record not found"}</p>
        <Link href="/records">
          <Button variant="outline" className="mt-4">Back to Records</Button>
        </Link>
      </div>
    );
  }

  const hasItems = record.items && record.items.length > 0;
  const grouped = hasItems ? groupItemsByCategory(record.items!) : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/records">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Zakat Record — {record.yearHijri} AH
            </h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {record.yearGregorian} CE
            </p>
            {record.zakatDate && (
              <p className="text-muted-foreground text-sm">
                Zakat Date: {new Date(record.zakatDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asset Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasItems ? (
              /* Items-based detail view */
              <div className="space-y-4">
                {['CASH', 'BANK', 'INVESTMENT', 'GOLD_SILVER', 'PROPERTY', 'CURRENCY', 'LOAN_GIVEN'].map(cat => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  const config = categoryConfig[cat];
                  const Icon = config.icon;
                  const catTotal = items.reduce((sum, i) => {
                    if (cat === 'PROPERTY' && i.zakatApplicable === false) return sum;
                    return sum + (i.amount || 0);
                  }, 0);

                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <h4 className="text-sm font-semibold">{config.label}</h4>
                        </div>
                        <span className="text-sm font-semibold">{formatPKR(catTotal)}</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.name}
                              {item.currency && item.currency !== 'PKR' && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">{item.currency}</Badge>
                              )}
                              {item.zakatApplicable === false && (
                                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">N/A</Badge>
                              )}
                            </span>
                            <span className="font-mono text-sm">{formatPKR(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  );
                })}

                {/* Liabilities */}
                {grouped['LIABILITY'] && grouped['LIABILITY'].length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MinusCircle className="h-4 w-4 text-red-600" />
                        <h4 className="text-sm font-semibold">Liabilities</h4>
                      </div>
                      <span className="text-sm font-semibold text-destructive">
                        -{formatPKR(record.liabilities)}
                      </span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {grouped['LIABILITY'].map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="font-mono text-destructive">{formatPKR(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Legacy flat field view */
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cash in Hand</p>
                  <p className="font-semibold">{formatPKR(record.cash)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Bank Balance</p>
                  <p className="font-semibold">{formatPKR(record.bank)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Gold</p>
                  <p className="font-semibold">{record.goldGrams}g</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Silver</p>
                  <p className="font-semibold">{record.silverGrams}g</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Business Assets</p>
                  <p className="font-semibold">{formatPKR(record.businessAssets)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Other Assets</p>
                  <p className="font-semibold">{formatPKR(record.otherAssets)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Saudi Riyal</p>
                  <p className="font-semibold">SR {record.srAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">US Dollar</p>
                  <p className="font-semibold">$ {record.usdAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Canadian Dollar</p>
                  <p className="font-semibold">CAD {record.cadAmount.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Liabilities</span>
                <span className="font-semibold text-destructive">{formatPKR(record.liabilities)}</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Calculated Zakat (2.5%)</span>
                <p className="text-xl font-bold">{formatPKR(record.zakatDue)}</p>
              </div>

              {(record.zakatPaid > 0) && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Zakat Paid Till Date</span>
                  <span className="font-semibold text-orange-600">- {formatPKR(record.zakatPaid)}</span>
                </div>
              )}

              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                <span className="font-bold">
                  {record.zakatPaid > 0 ? "Final Payable Zakat" : "Zakat Due"}
                </span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatPKR(Math.max(0, record.zakatDue - (record.zakatPaid || 0)))}
                  </p>
                  <Badge variant={record.netAssets >= record.nisabValue ? "default" : "secondary"}>
                    {record.netAssets >= record.nisabValue ? "Above Nisab" : "Below Nisab"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <CalculationBreakdown record={record} />
      </div>
    </div>
  );
}
