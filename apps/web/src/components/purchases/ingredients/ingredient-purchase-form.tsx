"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type {
  IngredientPurchaseInput,
  IngredientPurchaseUnit,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { createIngredientPurchase } from "@/lib/api/ingredient-purchases";
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

const unitOptionsByFamily: Record<Ingredient["unitFamily"], IngredientPurchaseUnit[]> = {
  weight: ["kg", "g"],
  volume: ["L", "ml"],
  count: ["piece"],
};

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
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([createEmptyLine(ingredients)]);
  const [occurredAtTime, setOccurredAtTime] = useState(getLocalTimeInputValue(now));

  function updateLine(index: number, updater: (line: DraftLine) => DraftLine) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? updater(line) : line)));
  }

  function addLine() {
    setLines((current) => [...current, createEmptyLine(ingredients)]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function onSubmit(formData: FormData) {
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

        const supplierId = Number(formData.get("supplierId") ?? 0);

        if (!Number.isFinite(supplierId) || supplierId <= 0) {
          toast.error("اختر موردًا صالحًا.");
          return;
        }

        const payload: IngredientPurchaseInput = {
          occurredAt: buildIsoDateTime(formData.get("occurredAtDate"), formData.get("occurredAtTime")),
          supplierId,
          notes: String(formData.get("notes") ?? "").trim() || undefined,
          lines: parsedLines,
        };

        await createIngredientPurchase(payload);
        toast.success("تم حفظ فاتورة شراء الخامات");
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
        timeValue={occurredAtTime}
        onTimeChange={setOccurredAtTime}
      />

      <Field
        id="supplierId"
        label="المورد المعتمد"
        required
        hint="لا يمكن حفظ فاتورة خامات بدون اختيار مورد محفوظ من قائمة الموردين."
      >
        <select
          id="supplierId"
          name="supplierId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={suppliers[0]?.id ?? ""}
          required
        >
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={line.ingredientId}
                    onChange={(event) => {
                      const nextIngredient = ingredients.find(
                        (item) => item.id === Number(event.target.value),
                      );
                      updateLine(index, (current) => ({
                        ...current,
                        ingredientId: Number(event.target.value),
                        unit: nextIngredient
                          ? unitOptionsByFamily[nextIngredient.unitFamily][0]
                          : current.unit,
                      }));
                    }}
                  >
                    {ingredients.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
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
      </div>

      <Field id="notes" label="ملاحظات">
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
            {isSubmitting ? "جارٍ الحفظ…" : "حفظ الفاتورة"}
          </Button>
        </div>
      </div>
    </form>
  );
}
