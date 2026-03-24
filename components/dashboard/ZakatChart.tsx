"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ZakatRecord } from "@/types";

interface ZakatChartProps {
  records: ZakatRecord[];
  loading: boolean;
}

export function ZakatChart({ records, loading }: ZakatChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = [...records]
    .sort((a, b) => a.yearGregorian - b.yearGregorian)
    .map((r) => ({
      year: `${r.yearHijri} / ${r.yearGregorian}`,
      totalAssets: Math.round(r.totalAssets),
      netAssets: Math.round(r.netAssets),
      zakatDue: Math.round(r.zakatDue),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Yearly Zakat Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No records to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("en-PK").format(Number(value))
                }
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="totalAssets" name="Total Assets" fill="hsl(var(--chart-1, 220 70% 50%))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="zakatDue" name="Zakat Due" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
