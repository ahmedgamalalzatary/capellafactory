"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ExpenseInput, ExpenseType } from "@capella/shared/expenses/expense.types";
import { createExpense } from "@/lib/api/expenses";
import { removeLocalDraftEntry, saveLocalDraftEntry } from "@/lib/local-drafts";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  draftId?: string | null;
  initialDraft?: ExpenseDraft | null;
  draftStorageKey?: string;
  onDraftsChange?: () => void;
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

export type ExpenseDraft = {
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

export const expenseDraftStorageKey = "capella:drafts:expense";

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

export function isExpenseDraft(value: unknown): value is ExpenseDraft {
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

export function createEmptyExpenseDraft(now = new Date()): ExpenseDraft {
  return {
    type: "rent",
    amount: "",
    occurredAtDate: getLocalDateInputValue(now),
    occurredAtTime: getLocalTimeInputValue(now),
    notes: "",
    employeeName: "",
    otherLabel: "",
    tax: createInactiveAdjustment(),
    discount: createInactiveAdjustment(),
    payments: [createEmptyPaymentRow()],
  };
}

export function isExpenseDraftEmpty(draft: ExpenseDraft) {
  return (
    draft.type === "rent" &&
    draft.amount === "" &&
    draft.notes === "" &&
    draft.employeeName === "" &&
    draft.otherLabel === "" &&
    draft.tax.state === "inactive" &&
    draft.discount.state === "inactive" &&
    draft.payments.length === 1 &&
    draft.payments[0]?.amount === "" &&
    draft.payments[0]?.paymentMethod === "cod"
  );
}

export function getExpenseDraftLabel(draft: ExpenseDraft) {
  const descriptor = draft.type === "other" ? draft.otherLabel.trim() : expenseTypeOptions.find((option) => option.value === draft.type)?.label;
  return descriptor || "مسودة مصروف";
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
  draftId = null,
  initialDraft,
  draftStorageKey = expenseDraftStorageKey,
  onDraftsChange,
  onCancel,
  onSuccess,
  submitLabel = "حفظ المصروف",
}: ExpenseFormProps) {
  const router = useRouter();
  const now = new Date();
  const submitLock = useRef(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const seedDraft = initialDraft ?? createEmptyExpenseDraft(now);
  const [expenseType, setExpenseType] = useState<ExpenseType>(seedDraft.type);
  const [amount, setAmount] = useState(seedDraft.amount);
  const [tax, setTax] = useState<DraftAdjustment>(
    seedDraft.tax,
  );
  const [discount, setDiscount] = useState<DraftAdjustment>(
    seedDraft.discount,
  );
  const [payments, setPayments] = useState<DraftPaymentRow[]>(
    seedDraft.payments.length ? seedDraft.payments : [createEmptyPaymentRow()],
  );
  const [occurredAtDate, setOccurredAtDate] = useState(seedDraft.occurredAtDate);
  const [occurredAtTime, setOccurredAtTime] = useState(seedDraft.occurredAtTime);
  const [notes, setNotes] = useState(seedDraft.notes);
  const [employeeName, setEmployeeName] = useState(seedDraft.employeeName);
  const [otherLabel, setOtherLabel] = useState(seedDraft.otherLabel);
  const totalAmountValue = Number(amount || 0);

  useEffect(() => {
    const currentDraft: ExpenseDraft = {
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
    };

    if (isExpenseDraftEmpty(currentDraft)) {
      return;
    }

    const entry = saveLocalDraftEntry<ExpenseDraft>(
      draftStorageKey,
      currentDraft,
      currentDraftId ?? undefined,
    );

    if (entry.id !== currentDraftId) {
      setCurrentDraftId(entry.id);
    }

    onDraftsChange?.();
  }, [
    amount,
    currentDraftId,
    discount,
    draftStorageKey,
    employeeName,
    expenseType,
    notes,
    onDraftsChange,
    occurredAtDate,
    occurredAtTime,
    otherLabel,
    payments,
    tax,
  ]);

  function removeCurrentDraft() {
    if (!currentDraftId) {
      return;
    }

    removeLocalDraftEntry(draftStorageKey, currentDraftId);
    onDraftsChange?.();
  }

  function resetForm() {
    const nextDraft = createEmptyExpenseDraft(new Date());
    setCurrentDraftId(null);
    setExpenseType(nextDraft.type);
    setAmount(nextDraft.amount);
    setOccurredAtDate(nextDraft.occurredAtDate);
    setOccurredAtTime(nextDraft.occurredAtTime);
    setNotes(nextDraft.notes);
    setEmployeeName(nextDraft.employeeName);
    setOtherLabel(nextDraft.otherLabel);
    setTax(nextDraft.tax);
    setDiscount(nextDraft.discount);
    setPayments(nextDraft.payments);
  }

  function confirmCancel() {
    removeCurrentDraft();
    resetForm();
    setCancelDialogOpen(false);
    onCancel?.();
  }

  function handleCancel() {
    if (currentDraftId) {
      setCancelDialogOpen(true);
      return;
    }

    resetForm();
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
        removeCurrentDraft();
        resetForm();
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل تسجيل المصروف. حاول مجددًا.");
      }
    });
  }

  return (
    <>
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

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف المسودة الحالية</DialogTitle>
            <DialogDescription>
              سيتم حذف هذه المسودة المحلية وإغلاق النموذج. لا يمكن التراجع عن هذه العملية.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              رجوع
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              حذف المسودة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
