"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ExpenseInput, ExpenseType } from "@capella/shared/expenses/expense.types";
import type { PaymentMethod } from "@capella/shared/payments/payment.types";
import { createExpense } from "@/lib/api/expenses";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/local-drafts";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildIsoDateTime,
  getLocalDateInputValue,
  getLocalTimeInputValue,
  PurchaseDateTimeFields,
} from "../datetime-fields";

type ExpenseFormProps = {
  onCancel?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
};

const expenseTypeOptions: Array<{ value: ExpenseType; label: string }> = [
  { value: "rent", label: "إيجار" },
  { value: "food", label: "أكل" },
  { value: "water", label: "مياه" },
  { value: "gas", label: "غاز" },
  { value: "electricity", label: "كهرباء" },
  { value: "internet", label: "إنترنت" },
  { value: "salary", label: "مرتبات" },
  { value: "other", label: "أخرى" },
];

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "visa", label: "Visa" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "cod", label: "COD" },
  { value: "instapay", label: "Instapay" },
];

type ExpenseDraft = {
  type: ExpenseType;
  amount: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  occurredAtDate: string;
  occurredAtTime: string;
  notes: string;
  employeeName: string;
  otherLabel: string;
};

const expenseDraftKey = "capella:draft:expense";

function isExpenseType(value: unknown): value is ExpenseType {
  return (
    value === "rent" ||
    value === "food" ||
    value === "water" ||
    value === "gas" ||
    value === "electricity" ||
    value === "internet" ||
    value === "salary" ||
    value === "other"
  );
}

function isExpenseDraft(value: unknown): value is ExpenseDraft {
  const candidate = value as Partial<ExpenseDraft> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    isExpenseType(candidate?.type) &&
    typeof candidate.amount === "string" &&
    typeof candidate.paidAmount === "string" &&
    isPaymentMethod(candidate.paymentMethod) &&
    typeof candidate.occurredAtDate === "string" &&
    typeof candidate.occurredAtTime === "string" &&
    typeof candidate.notes === "string" &&
    typeof candidate.employeeName === "string" &&
    typeof candidate.otherLabel === "string"
  );
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "visa" || value === "vodafone_cash" || value === "cod" || value === "instapay";
}

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="ms-1 text-destructive">*</span>
        ) : (
          <span className="ms-1 text-xs font-normal text-muted-foreground">(اختياري)</span>
        )}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ExpenseForm({
  onCancel,
  onSuccess,
  submitLabel = "حفظ المصروف",
}: ExpenseFormProps) {
  const router = useRouter();
  const now = new Date();
  const initialDraft = loadLocalDraft<ExpenseDraft>(expenseDraftKey, isExpenseDraft);
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>(initialDraft?.type ?? "rent");
  const [amount, setAmount] = useState(initialDraft?.amount ?? "");
  const [paidAmount, setPaidAmount] = useState(initialDraft?.paidAmount ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialDraft?.paymentMethod ?? "cod",
  );
  const [occurredAtDate, setOccurredAtDate] = useState(
    initialDraft?.occurredAtDate ?? getLocalDateInputValue(now),
  );
  const [occurredAtTime, setOccurredAtTime] = useState(
    initialDraft?.occurredAtTime ?? getLocalTimeInputValue(now),
  );
  const [notes, setNotes] = useState(initialDraft?.notes ?? "");
  const [employeeName, setEmployeeName] = useState(initialDraft?.employeeName ?? "");
  const [otherLabel, setOtherLabel] = useState(initialDraft?.otherLabel ?? "");
  const totalAmountValue = Number(amount || 0);
  const paidAmountValue = Number(paidAmount || 0);
  const remainingAmount = Math.max(totalAmountValue - paidAmountValue, 0);
  const hasPayment = paidAmountValue > 0;

  useEffect(() => {
    saveLocalDraft<ExpenseDraft>(expenseDraftKey, {
      type: expenseType,
      amount,
      paidAmount,
      paymentMethod,
      occurredAtDate,
      occurredAtTime,
      notes,
      employeeName,
      otherLabel,
    });
  }, [
    amount,
    employeeName,
    expenseType,
    notes,
    occurredAtDate,
    occurredAtTime,
    otherLabel,
    paidAmount,
    paymentMethod,
  ]);

  function resetForm(clearDraft = false) {
    const next = new Date();
    setExpenseType("rent");
    setAmount("");
    setPaidAmount("");
    setPaymentMethod("cod");
    setOccurredAtDate(getLocalDateInputValue(next));
    setOccurredAtTime(getLocalTimeInputValue(next));
    setNotes("");
    setEmployeeName("");
    setOtherLabel("");

    if (clearDraft) {
      clearLocalDraft(expenseDraftKey);
    }
  }

  function handleCancel() {
    resetForm(true);
    onCancel?.();
  }

  async function onSubmit() {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      const payload: ExpenseInput = {
        type: expenseType,
        amount: totalAmountValue,
        paidAmount: paidAmountValue,
        paymentMethod: hasPayment ? paymentMethod : undefined,
        paidAt: hasPayment ? buildIsoDateTime(occurredAtDate, occurredAtTime) : undefined,
        occurredAt: buildIsoDateTime(occurredAtDate, occurredAtTime),
        notes: notes.trim() || undefined,
        employeeName: employeeName.trim() || undefined,
        otherLabel: otherLabel.trim() || undefined,
      };

      try {
        await createExpense(payload);
        toast.success("تم تسجيل المصروف بنجاح");
        resetForm(true);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل تسجيل المصروف. حاول مجددًا.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field id="type" label="نوع المصروف" required>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={expenseType}
          onChange={(event) => setExpenseType(event.target.value as ExpenseType)}
        >
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="amount" label="إجمالي المصروف" required hint="إجمالي قيمة المصروف قبل حساب المدفوع والمتبقي.">
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.001"
          step="0.001"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </Field>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
        <Field id="paidAmount" label="المدفوع" required hint="يمكن أن يكون صفر إذا لم يتم دفع أي مبلغ بعد.">
          <Input
            id="paidAmount"
            name="paidAmount"
            type="number"
            min="0"
            max={amount || undefined}
            step="0.001"
            value={paidAmount}
            onChange={(event) => setPaidAmount(event.target.value)}
            required
          />
        </Field>

        <div className="rounded-md bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">المتبقي: </span>
          <span className="font-semibold tabular-nums">{remainingAmount.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}</span>
        </div>

        {hasPayment ? (
          <Field id="paymentMethod" label="طريقة الدفع" required>
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
          </Field>
        ) : null}
      </div>

      <PurchaseDateTimeFields
        dateId="occurredAtDate"
        timeId="occurredAtTime"
        label="وقت الدفع الفعلي"
        hint="يسمح بإدخال تاريخ ووقت سابقين لأن المصروف لا يؤثر على المخزون."
        defaultDate={getLocalDateInputValue(now)}
        dateValue={occurredAtDate}
        onDateChange={setOccurredAtDate}
        timeValue={occurredAtTime}
        onTimeChange={setOccurredAtTime}
      />

      {expenseType === "salary" ? (
        <Field
          id="employeeName"
          label="اسم الموظف"
          required
          hint="اسم الموظف نص حر، ولا يرتبط بجدول موظفين في هذه المرحلة."
        >
          <Input
            id="employeeName"
            name="employeeName"
            placeholder="أحمد"
            value={employeeName}
            onChange={(event) => setEmployeeName(event.target.value)}
            required
          />
        </Field>
      ) : null}

      {expenseType === "other" ? (
        <Field
          id="otherLabel"
          label="وصف النوع"
          required
          hint="اكتب تسمية واضحة عندما لا يناسب المصروف أي نوع جاهز."
        >
          <Input
            id="otherLabel"
            name="otherLabel"
            placeholder="صيانة مفاجئة"
            value={otherLabel}
            onChange={(event) => setOtherLabel(event.target.value)}
            required
          />
        </Field>
      ) : null}

      <Field
        id="notes"
        label="ملاحظات"
        hint="أضف أي شرح إضافي يفيد في المراجعة لاحقًا، مثل السبب أو المرجع الورقي."
      >
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="تفاصيل إضافية..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <div className="mt-2 flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> حقول مطلوبة
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
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
