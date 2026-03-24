"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { formatPKR } from "@/lib/zakatCalculator";
import type { ZakatRecord } from "@/types";

interface RecentEntriesProps {
  records: ZakatRecord[];
  loading: boolean;
}

export function RecentEntries({ records, loading }: RecentEntriesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const recent = records.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Entries</CardTitle>
        <Link href="/records">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No records yet</p>
        ) : (
          <div className="space-y-3">
            {recent.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    {record.yearHijri} AH / {record.yearGregorian} CE
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Net: {formatPKR(record.netAssets)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatPKR(record.zakatDue)}</p>
                  <Badge variant={record.netAssets >= record.nisabValue ? "default" : "secondary"} className="text-xs">
                    {record.netAssets >= record.nisabValue ? "Payable" : "Exempt"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
