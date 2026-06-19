"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { IngredientPurchaseUnit } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Product } from "@capella/shared/products/product.types";
import type { ProductionBatchInput } from "@capella/shared/production-batches/production-batch.types";
import { createProductionBatch } from "@/lib/api/production-batches";
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
} from "@/components/purchases/datetime-fields";

type ProductionBatchFormProps = {
  products: Product[];
  ingredients: Ingredient[];
  onCancel?: () => void;
  onSuccess?: () => void;
};

type DraftLine = {
  ingredientId: number;
  quantity: string;
  unit: IngredientPurchaseUnit;
};

type ProductionBatchDraft = {
  occurredAtDate: string;
  occurredAtTime: string;
  productId: string;
  producedQuantity: string;
  notes: string;
  lines: DraftLine[];
};

const productionBatchDraftKey = "capella:draft:production-batch";

const unitOptionsByFamily: Record<Ingredient["unitFamily"], IngredientPurchaseUnit[]> = {
  weight: ["kg", "g"],
  volume: ["L", "ml"],
  count: ["piece"],
};

function isDraftLine(value: unknown): value is DraftLine {
  const candidate = value as Partial<DraftLine> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.ingredientId === "number" &&
    typeof candidate.quantity === "string" &&
    (candidate.unit === "kg" ||
      candidate.unit === "g" ||
      candidate.unit === "L" ||
      candidate.unit === "ml" ||
      candidate.unit === "piece")
  );
}

function isProductionBatchDraft(value: unknown): value is ProductionBatchDraft {
  const candidate = value as Partial<ProductionBatchDraft> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.occurredAtDate === "string" &&
    typeof candidate.occurredAtTime === "string" &&
    typeof candidate.productId === "string" &&
    typeof candidate.producedQuantity === "string" &&
    typeof candidate.notes === "string" &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every(isDraftLine)
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
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
    </div>
  );
}

function createEmptyLine(ingredients: Ingredient[], usedIngredientIds: number[] = []): DraftLine {
  const ingredient =
    ingredients.find((item) => !usedIngredientIds.includes(item.id)) ?? ingredients[0];
  return {
    ingredientId: ingredient?.id ?? 0,
    quantity: "",
    unit: ingredient ? unitOptionsByFamily[ingredient.unitFamily][0] : "kg",
  };
}

export function ProductionBatchForm({
  products,
  ingredients,
  onCancel,
  onSuccess,
}: ProductionBatchFormProps) {
  const router = useRouter();
  const now = new Date();
  const initialDraft = loadLocalDraft<ProductionBatchDraft>(
    productionBatchDraftKey,
    isProductionBatchDraft,
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
  const [productId, setProductId] = useState(initialDraft?.productId ?? String(products[0]?.id ?? ""));
  const [producedQuantity, setProducedQuantity] = useState(initialDraft?.producedQuantity ?? "");
  const [notes, setNotes] = useState(initialDraft?.notes ?? "");

  useEffect(() => {
    saveLocalDraft<ProductionBatchDraft>(productionBatchDraftKey, {
      occurredAtDate,
      occurredAtTime,
      productId,
      producedQuantity,
      notes,
      lines,
    });
  }, [lines, notes, occurredAtDate, occurredAtTime, productId, producedQuantity]);

  // Cleared only after a successful save. On a rejected submit we deliberately
  // leave every field untouched so the user can fix the problem and retry.
  function resetForm(clearDraft = false) {
    const next = new Date();
    setLines([createEmptyLine(ingredients)]);
    setOccurredAtDate(getLocalDateInputValue(next));
    setOccurredAtTime(getLocalTimeInputValue(next));
    setProductId(String(products[0]?.id ?? ""));
    setProducedQuantity("");
    setNotes("");

    if (clearDraft) {
      clearLocalDraft(productionBatchDraftKey);
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
    setLines((current) => [
      ...current,
      createEmptyLine(
        ingredients,
        current.map((line) => line.ingredientId),
      ),
    ]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function onSubmit() {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      try {
        const payload: ProductionBatchInput = {
          occurredAt: buildIsoDateTime(occurredAtDate, occurredAtTime),
          productId: Number(productId || 0),
          producedQuantity: Number(producedQuantity || 0),
          notes: notes.trim() || undefined,
          lines: lines.map((line) => ({
            ingredientId: Number(line.ingredientId),
            quantity: Number(line.quantity),
            unit: line.unit,
          })),
        };

        await createProductionBatch(payload);
        toast.success("تم حفظ تشغيلة الإنتاج");
        resetForm(true);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل حفظ التشغيلة.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <PurchaseDateTimeFields
        dateId="occurredAtDate"
        timeId="occurredAtTime"
        label="وقت الإنتاج الفعلي"
        hint="اختر تاريخ ووقت التشغيلة حتى يتم ترتيب حركات المخزون زمنيًا."
        defaultDate={getLocalDateInputValue(now)}
        dateValue={occurredAtDate}
        onDateChange={setOccurredAtDate}
        timeValue={occurredAtTime}
        onTimeChange={setOccurredAtTime}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Field id="productId" label="المنتج النهائي" required>
          <SearchableSelect
            value={productId}
            onChange={setProductId}
            options={products.map((product) => ({
              value: String(product.id),
              label: product.name,
            }))}
          />
        </Field>

        <Field id="producedQuantity" label="الكمية المنتجة" required>
          <Input
            id="producedQuantity"
            name="producedQuantity"
            type="number"
            min="0.001"
            step="0.001"
            value={producedQuantity}
            onChange={(event) => setProducedQuantity(event.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">الخامات المستهلكة</h3>
            <p className="text-xs text-muted-foreground">
              كل خامة تظهر مرة واحدة فقط داخل نفس التشغيلة.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            + خامة
          </Button>
        </div>

        {lines.map((line, index) => {
          const ingredient = ingredients.find((item) => item.id === line.ingredientId) ?? ingredients[0];
          const allowedUnits = ingredient ? unitOptionsByFamily[ingredient.unitFamily] : ["kg"];

          return (
            <div key={index} className="grid gap-3 rounded-lg border p-3">
              <div className="grid gap-3 md:grid-cols-3">
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
                      disabled:
                        item.id !== line.ingredientId &&
                        lines.some((other) => other.ingredientId === item.id),
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
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                  حذف البند
                </Button>
              </div>
            </div>
          );
        })}
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
            {isSubmitting ? "جارٍ الحفظ…" : "حفظ التشغيلة"}
          </Button>
        </div>
      </div>
    </form>
  );
}
