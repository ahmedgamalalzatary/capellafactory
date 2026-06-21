"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ExpenseInput, ExpenseType } from "@capella/shared/expenses/expense.types";
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
import {
  buildPaymentInputs,
  createEmptyPaymentRow,
  createInactiveAdjustment,
  DocumentFinancialSection,
  type DraftAdjustment,
  type DraftPaymentRow,
} from "../document-financial-section";

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

type ExpenseDraft = {
  type: ExpenseType;
  amount: string;
  occurredAtDate: string;
  occurredAtTime: string;
  notes: string;
  employeeName: string;
  otherLabel: string;
  tax: DraftAdjustment;
  discount: DraftAdjustment;
  payments: DraftPaymentRow[];
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
    typeof candidate.occurredAtDate === "string" &&
    typeof candidate.occurredAtTime === "string" &&
    typeof candidate.notes === "string" &&
    typeof candidate.employeeName === "string" &&
    typeof candidate.otherLabel === "string" &&
    isDraftAdjustment(candidate.tax) &&
    isDraftAdjustment(candidate.discount) &&
    Array.isArray(candidate.payments) &&
    candidate.payments.every(isDraftPaymentRow)
  );
}

function isDraftAdjustment(value: unknown): value is DraftAdjustment {
  const candidate = value as Partial<DraftAdjustment> | null;
  return (
    typeof value === "object" &&
    value !== null &&
    (candidate?.state === "active" || candidate?.state === "inactive") &&
    (candidate?.type === "amount" || candidate?.type === "percentage") &&
    typeof candidate?.value === "string"
  );
}

function isDraftPaymentRow(value: unknown): value is DraftPaymentRow {
  const candidate = value as Partial<DraftPaymentRow> | null;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.amount === "string" &&
    (candidate?.paymentMethod === "visa" ||
      candidate?.paymentMethod === "vodafone_cash" ||
      candidate?.paymentMethod === "cod" ||
      candidate?.paymentMethod === "instapay")
  );
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
  const [tax, setTax] = useState<DraftAdjustment>(
    initialDraft?.tax ?? createInactiveAdjustment(),
  );
  const [discount, setDiscount] = useState<DraftAdjustment>(
    initialDraft?.discount ?? createInactiveAdjustment(),
  );
  const [payments, setPayments] = useState<DraftPaymentRow[]>(
    initialDraft?.payments.length ? initialDraft.payments : [createEmptyPaymentRow()],
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

  useEffect(() => {
    saveLocalDraft<ExpenseDraft>(expenseDraftKey, {
      type: expenseType,
      amount,
      occurredAtDate,
      occurredAtTime,
      notes,
      employeeName,
      otherLabel,
      tax,
      discount,
      payments,
    });
  }, [
    amount,
    discount,
    employeeName,
    expenseType,
    notes,
    occurredAtDate,
    occurredAtTime,
    otherLabel,
    payments,
    tax,
  ]);

  function resetForm(clearDraft = false) {
    const next = new Date();
    setExpenseType("rent");
    setAmount("");
    setOccurredAtDate(getLocalDateInputValue(next));
    setOccurredAtTime(getLocalTimeInputValue(next));
    setNotes("");
    setEmployeeName("");
    setOtherLabel("");
    setTax(createInactiveAdjustment());
    setDiscount(createInactiveAdjustment());
    setPayments([createEmptyPaymentRow()]);

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
        taxState: tax.state,
        taxType: tax.state === "active" ? tax.type : undefined,
        taxValue: Number(tax.value) || 0,
        discountState: discount.state,
        discountType: discount.state === "active" ? discount.type : undefined,
        discountValue: Number(discount.value) || 0,
        payments: buildPaymentInputs(
          payments,
          buildIsoDateTime(occurredAtDate, occurredAtTime),
        ),
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

      <DocumentFinancialSection
        baseTotal={totalAmountValue}
        totalLabel="إجمالي المصروف"
        tax={tax}
        discount={discount}
        payments={payments}
        onTaxChange={setTax}
        onDiscountChange={setDiscount}
        onPaymentsChange={setPayments}
      />

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
