"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, FilePlus, FolderOpen, Calendar, ArrowRight, Check, Loader2 } from "lucide-react";
import { formatPKR } from "@/lib/zakatCalculator";
import { apiRecordToFormData } from "@/lib/zakatTransform";
import api from "@/lib/api";
import { toast } from "sonner";
import type { ZakatRecord } from "@/types";
import type { ZakatFormData } from "@/schemas/zakat.schema";

type InitChoice = "previous" | "fresh" | "history";

interface RecordInitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: ZakatRecord[];
  loading: boolean;
  onSelect: (prefill: ZakatFormData | null, sourceRecord?: ZakatRecord | null) => void;
}

function incrementHijriYear(hijri: string): string {
  const num = parseInt(hijri, 10);
  return isNaN(num) ? "" : String(num + 1);
}

function buildPrefillFromRecord(source: ZakatRecord): ZakatFormData {
  const hasItems = source.items && source.items.length > 0;

  let formData: ZakatFormData;

  if (hasItems) {
    formData = apiRecordToFormData(source);
  } else {
    // Legacy record — map flat fields to section arrays
    formData = {
      yearHijri: source.yearHijri,
      yearGregorian: source.yearGregorian,
      zakatDate: undefined,
      cashHoldings: source.cash > 0 ? [{ description: "Cash", amount: source.cash }] : [],
      bankAccounts: source.bank > 0 ? [{ name: "Bank", type: "Savings" as const, currency: "PKR" as const, amount: source.bank }] : [],
      investments: source.businessAssets > 0 ? [{ name: "Business Assets", totalValue: source.businessAssets }] : [],
      goldSilverItems: [
        ...(source.goldGrams > 0 ? [{ type: "Gold" as const, name: "Gold", weight: source.goldGrams, pricePerGram: source.goldPrice, total: source.goldGrams * source.goldPrice }] : []),
        ...(source.silverGrams > 0 ? [{ type: "Silver" as const, name: "Silver", weight: source.silverGrams, pricePerGram: source.silverPrice, total: source.silverGrams * source.silverPrice }] : []),
      ],
      properties: source.otherAssets > 0 ? [{ name: "Other Assets", type: "Plot" as const, zakatApplicable: true, value: source.otherAssets }] : [],
      foreignCurrencies: [
        ...(source.srAmount > 0 ? [{ currency: "SR" as const, amount: source.srAmount }] : []),
        ...(source.usdAmount > 0 ? [{ currency: "USD" as const, amount: source.usdAmount }] : []),
        ...(source.cadAmount > 0 ? [{ currency: "CAD" as const, amount: source.cadAmount }] : []),
      ],
      liabilities: source.liabilities > 0 ? [{ description: "Liabilities", amount: source.liabilities }] : [],
      loansGiven: [],
      zakatPaid: 0,
    };
  }

  // Smart defaults: increment year, clear date
  formData.yearHijri = incrementHijriYear(formData.yearHijri);
  formData.yearGregorian = source.yearGregorian + 1;
  formData.zakatDate = undefined;

  return formData;
}

export function RecordInitModal({
  open,
  onOpenChange,
  records,
  loading,
  onSelect,
}: RecordInitModalProps) {
  const [choice, setChoice] = useState<InitChoice | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const latestRecord = records.length > 0 ? records[0] : null; // records are sorted desc by createdAt

  // Fetch full record with items from the API
  const fetchFullRecord = async (id: string): Promise<ZakatRecord> => {
    const { data } = await api.get(`/zakat/${id}`);
    return data.data;
  };

  const handleConfirm = async () => {
    if (choice === "fresh") {
      onSelect(null);
      setChoice(null);
      setSelectedHistoryId(null);
      onOpenChange(false);
      return;
    }

    setConfirming(true);
    try {
      let sourceId: string | null = null;
      if (choice === "previous" && latestRecord) {
        sourceId = latestRecord.id;
      } else if (choice === "history" && selectedHistoryId) {
        sourceId = selectedHistoryId;
      }

      if (sourceId) {
        const fullRecord = await fetchFullRecord(sourceId);
        onSelect(buildPrefillFromRecord(fullRecord), fullRecord);
      }
    } catch {
      toast.error("Failed to load record data");
    } finally {
      setConfirming(false);
      setChoice(null);
      setSelectedHistoryId(null);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setChoice(null);
    setSelectedHistoryId(null);
    onOpenChange(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="space-y-4 p-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">How would you like to start?</DialogTitle>
          <DialogDescription>
            Choose how to initialize your new Zakat record
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Option 1: Continue from Previous */}
          {latestRecord && (
            <OptionCard
              selected={choice === "previous"}
              onClick={() => { setChoice("previous"); setSelectedHistoryId(null); }}
              icon={<RefreshCw className="h-5 w-5" />}
              iconColor="text-blue-600 bg-blue-100 dark:bg-blue-900/40"
              title="Continue from Previous Record"
              description="Reuse your last year's data and make adjustments"
              badge={
                <Badge variant="secondary" className="text-xs font-mono">
                  {latestRecord.yearHijri} AH • {formatPKR(latestRecord.zakatDue)}
                </Badge>
              }
            />
          )}

          {/* Option 2: Start Fresh */}
          <OptionCard
            selected={choice === "fresh"}
            onClick={() => { setChoice("fresh"); setSelectedHistoryId(null); }}
            icon={<FilePlus className="h-5 w-5" />}
            iconColor="text-green-600 bg-green-100 dark:bg-green-900/40"
            title="Start Fresh"
            description="Create a completely new zakat record from scratch"
          />

          {/* Option 3: Choose from History */}
          {records.length > 1 && (
            <OptionCard
              selected={choice === "history"}
              onClick={() => setChoice("history")}
              icon={<FolderOpen className="h-5 w-5" />}
              iconColor="text-purple-600 bg-purple-100 dark:bg-purple-900/40"
              title="Choose from History"
              description="Select any previous record to duplicate"
            />
          )}

          {/* History picker (shown when "Choose from History" selected) */}
          {choice === "history" && (
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-muted/30">
              {records.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedHistoryId(rec.id)}
                  className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all border ${
                    selectedHistoryId === rec.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-transparent hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{rec.yearHijri} AH / {rec.yearGregorian} CE</p>
                      <p className="text-xs text-muted-foreground">
                        Zakat: {formatPKR(rec.zakatDue)} • Assets: {formatPKR(rec.totalAssets)}
                      </p>
                    </div>
                  </div>
                  {selectedHistoryId === rec.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!choice || (choice === "history" && !selectedHistoryId) || confirming}
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Option Card ──────────────────────────────────────

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
}

function OptionCard({ selected, onClick, icon, iconColor, title, description, badge }: OptionCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "hover:border-muted-foreground/30"
      }`}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          {badge && <div className="mt-2">{badge}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
