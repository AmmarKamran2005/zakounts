"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, type SettingsFormData } from "@/schemas/settings.schema";
import { useSettings } from "@/hooks/useSettings";
import { formatPKR } from "@/lib/zakatCalculator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;

export default function SettingsPage() {
  const { settings, loading, updateSettings, fetchRates } = useSettings();
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      srRate: 74,
      usdRate: 278,
      cadRate: 200,
      goldPrice: 21000,
      silverPrice: 250,
      nisabType: "gold",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        srRate: settings.srRate,
        usdRate: settings.usdRate,
        cadRate: settings.cadRate,
        goldPrice: settings.goldPrice,
        silverPrice: settings.silverPrice,
        nisabType: settings.nisabType as "gold" | "silver",
      });
    }
  }, [settings, form]);

  const watchedValues = form.watch();
  const nisabValue =
    watchedValues.nisabType === "gold"
      ? GOLD_NISAB_GRAMS * (watchedValues.goldPrice || 0)
      : SILVER_NISAB_GRAMS * (watchedValues.silverPrice || 0);

  async function onSubmit(values: SettingsFormData) {
    setSaving(true);
    try {
      await updateSettings(values);
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleFetchRates() {
    setFetching(true);
    try {
      const rates = await fetchRates();
      if (rates.srRate) form.setValue("srRate", rates.srRate);
      if (rates.usdRate) form.setValue("usdRate", rates.usdRate);
      if (rates.cadRate) form.setValue("cadRate", rates.cadRate);
      if (rates.goldPrice) form.setValue("goldPrice", rates.goldPrice);
      if (rates.silverPrice) form.setValue("silverPrice", rates.silverPrice);
      toast.success("Rates fetched from API");
    } catch {
      toast.error("Failed to fetch rates — please enter manually");
    } finally {
      setFetching(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure exchange rates and Nisab preferences</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exchange Rates & Prices</CardTitle>
              <CardDescription>These rates are used for Zakat calculations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleFetchRates} disabled={fetching}>
              {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Fetch Latest
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="srRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SAR to PKR Rate</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usdRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>USD to PKR Rate</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cadRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAD to PKR Rate</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goldPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gold Price (PKR/gram)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="silverPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Silver Price (PKR/gram)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nisabType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nisab Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gold" id="gold" />
                          <label htmlFor="gold" className="text-sm">Gold (87.48g)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="silver" id="silver" />
                          <label htmlFor="silver" className="text-sm">Silver (612.36g)</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current Nisab ({watchedValues.nisabType === "gold" ? "Gold" : "Silver"}):{" "}
                  <span className="font-semibold text-foreground">{formatPKR(nisabValue)}</span>
                </p>
              </div>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
