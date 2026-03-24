"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOTPSchema, type VerifyOTPFormData } from "@/schemas/auth.schema";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <VerifyOTPForm />
    </Suspense>
  );
}

function VerifyOTPForm() {
  const { verifyOTP, resendOTP } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const form = useForm<VerifyOTPFormData>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(values: VerifyOTPFormData) {
    if (!email) {
      toast.error("Email is missing. Please go back and sign up again.");
      return;
    }
    setIsLoading(true);
    try {
      await verifyOTP(email, values.otp);
      toast.success("Email verified successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    try {
      await resendOTP(email);
      toast.success("OTP resent! Check your email.");
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit OTP to {email || "your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-2xl tracking-[0.5em] font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || isResending}
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {canResend ? "Resend OTP" : `Resend OTP in ${countdown}s`}
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        🔒 Your data is encrypted and secure
      </p>
    </div>
  );
}
