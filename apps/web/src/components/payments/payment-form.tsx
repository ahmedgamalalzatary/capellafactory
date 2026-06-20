"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdditionalPaymentInput, PaymentMethod } from "@capella/shared/payments/payment.types";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildIsoDateTime,
  getLocalDateInputValue,
  getLocalTimeInputValue,
  PurchaseDateTimeFields,
} from "@/components/purchases/datetime-fields";

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "visa", label: "Visa" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "cod", label: "COD" },
  { value: "instapay", label: "Instapay" },
];

type PaymentFormProps = {
  remainingAmount: number;
  onSubmitPayment: (input: AdditionalPaymentInput) => Promise<unknown>;
  onCancel?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function PaymentForm({
  remainingAmount,
  onSubmitPayment,
  onCancel,
  onSuccess,
  submitLabel = "تسجيل الدفعة",
}: PaymentFormProps) {
  const router = useRouter();
  const now = new Date();
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paidAtDate, setPaidAtDate] = useState(getLocalDateInputValue(now));
  const [paidAtTime, setPaidAtTime] = useState(getLocalTimeInputValue(now));

  async function handleSubmit() {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      const paymentAmount = Number(amount || 0);

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        toast.error("أدخل مبلغ دفعة أكبر من صفر.");
        return;
      }

      if (paymentAmount > remainingAmount) {
        toast.error("قيمة الدفعة أكبر من المبلغ المتبقي.");
        return;
      }

      try {
        await onSubmitPayment({
          amount: paymentAmount,
          paymentMethod,
          paidAt: buildIsoDateTime(paidAtDate, paidAtTime),
        });
        toast.success("تم تسجيل الدفعة");
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل تسجيل الدفعة.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4">
      <div className="rounded-xl border bg-muted/30 px-4 py-3">
        <p className="text-[11px] font-medium text-muted-foreground">المبلغ المتبقي</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatAmount(remainingAmount)}</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="amount">
          المبلغ المدفوع
          <span className="ms-1 text-destructive">*</span>
        </Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.001"
          max={remainingAmount}
          step="0.001"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="paymentMethod">
          طريقة الدفع
          <span className="ms-1 text-destructive">*</span>
        </Label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
          required
        >
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <PurchaseDateTimeFields
        dateId="paidAtDate"
        timeId="paidAtTime"
        label="وقت الدفع"
        hint="سجّل وقت الدفع الفعلي لهذه الدفعة."
        defaultDate={getLocalDateInputValue(now)}
        dateValue={paidAtDate}
        onDateChange={setPaidAtDate}
        timeValue={paidAtTime}
        onTimeChange={setPaidAtTime}
      />

      <div className="mt-2 flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> حقول مطلوبة
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الحفظ…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}
