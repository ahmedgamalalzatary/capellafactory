"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ExpenseInput, ExpenseType } from "@capella/shared/expenses/expense.types";
import { createExpense } from "@/lib/api/expenses";
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
} from "./datetime-fields";

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
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>("rent");
  const [occurredAtTime, setOccurredAtTime] = useState(getLocalTimeInputValue(now));

  async function onSubmit(formData: FormData) {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      const payload: ExpenseInput = {
        type: String(formData.get("type") ?? "rent") as ExpenseType,
        amount: Number(formData.get("amount") ?? 0),
        occurredAt: buildIsoDateTime(formData.get("occurredAtDate"), formData.get("occurredAtTime")),
        notes: String(formData.get("notes") ?? "").trim() || undefined,
        employeeName: String(formData.get("employeeName") ?? "").trim() || undefined,
        otherLabel: String(formData.get("otherLabel") ?? "").trim() || undefined,
      };

      try {
        await createExpense(payload);
        toast.success("تم تسجيل المصروف بنجاح");
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

      <Field id="amount" label="المبلغ" required hint="أدخل القيمة المدفوعة فعليًا لهذا المصروف.">
        <Input id="amount" name="amount" type="number" min="0.001" step="0.001" required />
      </Field>

      <PurchaseDateTimeFields
        dateId="occurredAtDate"
        timeId="occurredAtTime"
        label="وقت الدفع الفعلي"
        hint="يسمح بإدخال تاريخ ووقت سابقين لأن المصروف لا يؤثر على المخزون."
        defaultDate={getLocalDateInputValue(now)}
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
          <Input id="employeeName" name="employeeName" placeholder="أحمد" required />
        </Field>
      ) : null}

      {expenseType === "other" ? (
        <Field
          id="otherLabel"
          label="وصف النوع"
          required
          hint="اكتب تسمية واضحة عندما لا يناسب المصروف أي نوع جاهز."
        >
          <Input id="otherLabel" name="otherLabel" placeholder="صيانة مفاجئة" required />
        </Field>
      ) : null}

      <Field
        id="notes"
        label="ملاحظات"
        hint="أضف أي شرح إضافي يفيد في المراجعة لاحقًا، مثل السبب أو المرجع الورقي."
      >
        <Textarea id="notes" name="notes" rows={4} placeholder="تفاصيل إضافية..." />
      </Field>

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
