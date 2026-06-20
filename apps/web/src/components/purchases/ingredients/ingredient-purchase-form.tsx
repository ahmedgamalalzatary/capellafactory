"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type {
  IngredientPurchaseInput,
  IngredientPurchaseUnit,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { PaymentMethod } from "@capella/shared/payments/payment.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { createIngredientPurchase } from "@/lib/api/ingredient-purchases";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/local-drafts";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  buildIsoDateTime,
  getLocalDateInputValue,
  getLocalTimeInputValue,
  PurchaseDateTimeFields,
} from "../datetime-fields";

type IngredientPurchaseFormProps = {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  onCancel?: () => void;
  onSuccess?: () => void;
};

type DraftLine = {
  ingredientId: number;
  quantity: string;
  unit: IngredientPurchaseUnit;
  lineTotal: string;
};

type IngredientPurchaseDraft = {
  occurredAtDate: string;
  occurredAtTime: string;
  supplierId: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  notes: string;
  lines: DraftLine[];
};

const ingredientPurchaseDraftKey = "capella:draft:ingredient-purchase";

const unitOptionsByFamily: Record<Ingredient["unitFamily"], IngredientPurchaseUnit[]> = {
  weight: ["kg", "g"],
  volume: ["L", "ml"],
  count: ["piece"],
};

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "visa", label: "Visa" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "cod", label: "COD" },
  { value: "instapay", label: "Instapay" },
];

function isDraftLine(value: unknown): value is DraftLine {
  const candidate = value as Partial<DraftLine> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.ingredientId === "number" &&
    typeof candidate.quantity === "string" &&
    typeof candidate.lineTotal === "string" &&
    (candidate.unit === "kg" ||
      candidate.unit === "g" ||
      candidate.unit === "L" ||
      candidate.unit === "ml" ||
      candidate.unit === "piece")
  );
}

function isIngredientPurchaseDraft(value: unknown): value is IngredientPurchaseDraft {
  const candidate = value as Partial<IngredientPurchaseDraft> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.occurredAtDate === "string" &&
    typeof candidate.occurredAtTime === "string" &&
    typeof candidate.supplierId === "string" &&
    typeof candidate.paidAmount === "string" &&
    isPaymentMethod(candidate.paymentMethod) &&
    typeof candidate.notes === "string" &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every(isDraftLine)
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

function createEmptyLine(ingredients: Ingredient[]): DraftLine {
  const ingredient = ingredients[0];
  return {
    ingredientId: ingredient?.id ?? 0,
    quantity: "",
    unit: ingredient ? unitOptionsByFamily[ingredient.unitFamily][0] : "kg",
    lineTotal: "",
  };
}

export function IngredientPurchaseForm({
  suppliers,
  ingredients,
  onCancel,
  onSuccess,
}: IngredientPurchaseFormProps) {
  const router = useRouter();
  const now = new Date();
  const initialDraft = loadLocalDraft<IngredientPurchaseDraft>(
    ingredientPurchaseDraftKey,
    isIngredientPurchaseDraft,
  );
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>(
    initialDraft?.lines.length ? initialDraft.lines : [createEmptyLine(ingredients)],
  );
  const [occurredAtDate, setOccurredAtDate] = useState(
    initialDraft?.occurredAtDate ?? getLocalDateInputValue(now),
  );
  const [occurredAtTime, setOccurredAtTime] = useState(
    initialDraft?.occurredAtTime ?? getLocalTimeInputValue(now),
  );
  const [supplierId, setSupplierId] = useState(initialDraft?.supplierId ?? String(suppliers[0]?.id ?? ""));
  const [paidAmount, setPaidAmount] = useState(initialDraft?.paidAmount ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialDraft?.paymentMethod ?? "cod",
  );
  const [notes, setNotes] = useState(initialDraft?.notes ?? "");
  const invoiceTotal = lines.reduce((sum, line) => sum + (Number(line.lineTotal) || 0), 0);
  const paidAmountValue = Number(paidAmount || 0);
  const remainingAmount = Math.max(invoiceTotal - paidAmountValue, 0);
  const hasPayment = paidAmountValue > 0;

  useEffect(() => {
    saveLocalDraft<IngredientPurchaseDraft>(ingredientPurchaseDraftKey, {
      occurredAtDate,
      occurredAtTime,
      supplierId,
      paidAmount,
      paymentMethod,
      notes,
      lines,
    });
  }, [lines, notes, occurredAtDate, occurredAtTime, paidAmount, paymentMethod, supplierId]);

  function resetForm(clearDraft = false) {
    const next = new Date();
    setLines([createEmptyLine(ingredients)]);
    setOccurredAtDate(getLocalDateInputValue(next));
    setOccurredAtTime(getLocalTimeInputValue(next));
    setSupplierId(String(suppliers[0]?.id ?? ""));
    setPaidAmount("");
    setPaymentMethod("cod");
    setNotes("");

    if (clearDraft) {
      clearLocalDraft(ingredientPurchaseDraftKey);
    }
  }

  function handleCancel() {
    resetForm(true);
    onCancel?.();
  }

  function updateLine(index: number, updater: (line: DraftLine) => DraftLine) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? updater(line) : line)));
  }

  function addLine() {
    setLines((current) => [createEmptyLine(ingredients), ...current]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function onSubmit() {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      try {
        const parsedLines = lines.map((line) => ({
          ingredientId: Number(line.ingredientId),
          quantity: Number(line.quantity),
          unit: line.unit,
          lineTotal: Number(line.lineTotal),
        }));

        const hasInvalidLine = parsedLines.some(
          (line) =>
            !Number.isFinite(line.ingredientId) ||
            line.ingredientId <= 0 ||
            !Number.isFinite(line.quantity) ||
            line.quantity <= 0 ||
            !Number.isFinite(line.lineTotal) ||
            line.lineTotal <= 0,
        );

        if (hasInvalidLine) {
          toast.error("تأكد من صحة الكمية وإجمالي السعر لكل بند.");
          return;
        }

        const parsedSupplierId = Number(supplierId || 0);

        if (!Number.isFinite(parsedSupplierId) || parsedSupplierId <= 0) {
          toast.error("اختر موردًا صالحًا.");
          return;
        }

        const payload: IngredientPurchaseInput = {
          occurredAt: buildIsoDateTime(occurredAtDate, occurredAtTime),
          supplierId: parsedSupplierId,
          paidAmount: paidAmountValue,
          paymentMethod: hasPayment ? paymentMethod : undefined,
          paidAt: hasPayment ? buildIsoDateTime(occurredAtDate, occurredAtTime) : undefined,
          notes: notes.trim() || undefined,
          lines: parsedLines,
        };

        await createIngredientPurchase(payload);
        toast.success("تم حفظ فاتورة شراء الخامات");
        resetForm(true);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل حفظ الفاتورة.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <PurchaseDateTimeFields
        dateId="occurredAtDate"
        timeId="occurredAtTime"
        label="وقت الفاتورة الفعلي"
        hint="اختر تاريخ الفاتورة ووقتها الفعليين حتى تبقى حركة المخزون مرتبة زمنيًا."
        defaultDate={getLocalDateInputValue(now)}
        dateValue={occurredAtDate}
        onDateChange={setOccurredAtDate}
        timeValue={occurredAtTime}
        onTimeChange={setOccurredAtTime}
      />

      <Field
        id="supplierId"
        label="المورد المعتمد"
        required
        hint="لا يمكن حفظ فاتورة خامات بدون اختيار مورد محفوظ من قائمة الموردين."
      >
        <SearchableSelect
          value={supplierId}
          onChange={setSupplierId}
          options={suppliers.map((supplier) => ({
            value: String(supplier.id),
            label: supplier.name,
          }))}
        />
      </Field>

      <div className="grid gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">بنود الفاتورة</h3>
            <p className="text-xs text-muted-foreground">
              كل خامة تظهر مرة واحدة فقط داخل نفس الفاتورة.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            + بند
          </Button>
        </div>

        {lines.map((line, index) => {
          const ingredient = ingredients.find((item) => item.id === line.ingredientId) ?? ingredients[0];
          const allowedUnits = ingredient ? unitOptionsByFamily[ingredient.unitFamily] : ["kg"];
          const quantity = Number(line.quantity) || 0;
          const total = Number(line.lineTotal) || 0;
          const unitPrice = quantity > 0 ? total / quantity : 0;

          return (
            <div key={index} className="grid gap-3 rounded-lg border p-3">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label>الخامة</Label>
                  <SearchableSelect
                    value={String(line.ingredientId)}
                    onChange={(nextValue) => {
                      const nextIngredient = ingredients.find(
                        (item) => item.id === Number(nextValue),
                      );
                      updateLine(index, (current) => ({
                        ...current,
                        ingredientId: Number(nextValue),
                        unit: nextIngredient
                          ? unitOptionsByFamily[nextIngredient.unitFamily][0]
                          : current.unit,
                      }));
                    }}
                    options={ingredients.map((item) => ({
                      value: String(item.id),
                      label: item.name,
                    }))}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(index, (current) => ({ ...current, quantity: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label>الوحدة</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={line.unit}
                    onChange={(event) =>
                      updateLine(index, (current) => ({
                        ...current,
                        unit: event.target.value as IngredientPurchaseUnit,
                      }))
                    }
                  >
                    {allowedUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label>إجمالي السعر</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={line.lineTotal}
                    onChange={(event) =>
                      updateLine(index, (current) => ({ ...current, lineTotal: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>سعر الوحدة المحسوب: {unitPrice.toFixed(3)}</span>
                <span>إجمالي البند: {total.toFixed(3)}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                  حذف البند
                </Button>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium text-muted-foreground">إجمالي الفاتورة</span>
          <span className="font-semibold tabular-nums text-foreground">
            {invoiceTotal.toFixed(3)}
          </span>
        </div>

        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
          <Field
            id="paidAmount"
            label="المدفوع"
            required
            hint="يمكن أن يكون صفر إذا لم يتم دفع أي مبلغ عند تسجيل الفاتورة."
          >
            <Input
              id="paidAmount"
              name="paidAmount"
              type="number"
              min="0"
              max={invoiceTotal || undefined}
              step="0.001"
              value={paidAmount}
              onChange={(event) => setPaidAmount(event.target.value)}
              required
            />
          </Field>

          <div className="rounded-md bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground">المتبقي: </span>
            <span className="font-semibold tabular-nums">{remainingAmount.toFixed(3)}</span>
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
      </div>

      <Field id="notes" label="ملاحظات">
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
            {isSubmitting ? "جارٍ الحفظ…" : "حفظ الفاتورة"}
          </Button>
        </div>
      </div>
    </form>
  );
}
