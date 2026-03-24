"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calculator, Calendar, TrendingUp } from "lucide-react";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatRecord } from "@/types";

interface StatsCardsProps {
  records: ZakatRecord[];
  loading: boolean;
  currentHijriYear: string;
}

export function StatsCards({ records, loading, currentHijriYear }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const latest = records[0];
  const totalAssets = latest?.totalAssets ?? 0;
  const zakatDue = latest?.zakatDue ?? 0;
  const isAboveNisab = latest ? latest.netAssets >= latest.nisabValue : false;
  const currentYear = new Date().getFullYear();

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPKR(totalAssets)}</div>
          <p className="text-xs text-muted-foreground mt-1">Latest record</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Zakat Due</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${zakatDue > 0 ? "text-amber-600" : "text-green-600"}`}>
            {formatPKR(zakatDue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">2.5% of net assets</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Current Year</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentHijriYear} AH</div>
          <p className="text-xs text-muted-foreground mt-1">{currentYear} CE</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Nisab Status</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={isAboveNisab ? "default" : "secondary"} className="text-sm">
            {isAboveNisab ? "Above Nisab" : "Below Nisab"}
          </Badge>
          {latest && (
            <p className="text-xs text-muted-foreground mt-2">
              Nisab: {formatPKR(latest.nisabValue)} ({latest.nisabType})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
