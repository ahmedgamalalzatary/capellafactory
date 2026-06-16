"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { PurchaseCorrectionInput } from "@capella/shared/purchase-corrections/purchase-correction.types";
import { createPurchaseCorrection } from "@/lib/api/purchase-corrections";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PurchaseCorrectionFormProps = {
  purchases: IngredientPurchase[];
  ingredients: Ingredient[];
  onCancel?: () => void;
  onSuccess?: () => void;
};

type DraftLine = {
  sourcePurchaseLineId: number;
  quantity: string;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
}

export function PurchaseCorrectionForm({
  purchases,
  ingredients,
  onCancel,
  onSuccess,
}: PurchaseCorrectionFormProps) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourcePurchaseId, setSourcePurchaseId] = useState<number>(purchases[0]?.id ?? 0);
  const [reason, setReason] = useState("");
  const [lineQuantities, setLineQuantities] = useState<Record<number, string>>({});

  const selectedPurchase = useMemo(
    () => purchases.find((purchase) => purchase.id === sourcePurchaseId) ?? purchases[0],
    [purchases, sourcePurchaseId],
  );
  const ingredientNames = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name])),
    [ingredients],
  );

  function updateLine(sourcePurchaseLineId: number, quantity: string) {
    setLineQuantities((current) => ({
      ...current,
      [sourcePurchaseLineId]: quantity,
    }));
  }

  async function onSubmit() {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      if (!selectedPurchase) {
        toast.error("اختر فاتورة شراء صالحة.");
        return;
      }

      const lines: DraftLine[] = selectedPurchase.lines
        .map((line) => ({
          sourcePurchaseLineId: line.id,
          quantity: lineQuantities[line.id] ?? "",
        }))
        .filter((line) => Number(line.quantity) > 0);

      if (!reason.trim()) {
        toast.error("سبب عكس الشراء مطلوب.");
        return;
      }

      if (lines.length === 0) {
        toast.error("أدخل كمية عكس واحدة على الأقل.");
        return;
      }

      const payload: PurchaseCorrectionInput = {
        sourcePurchaseId: selectedPurchase.id,
        reason: reason.trim(),
        lines: lines.map((line) => ({
          sourcePurchaseLineId: line.sourcePurchaseLineId,
          quantity: Number(line.quantity),
        })),
      };

      try {
        await createPurchaseCorrection(payload);
        toast.success("تم حفظ عكس الشراء");
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل حفظ عكس الشراء.");
      }
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="sourcePurchaseId">الفاتورة الأصلية</Label>
        <select
          id="sourcePurchaseId"
          value={sourcePurchaseId}
          onChange={(event) => {
            setSourcePurchaseId(Number(event.target.value));
            setLineQuantities({});
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {purchases.map((purchase) => (
            <option key={purchase.id} value={purchase.id}>
              {purchase.invoiceCode}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="reason">سبب العكس</Label>
        <Textarea
          id="reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="تم إدخال كمية أعلى من الحقيقة على الفاتورة الأصلية"
        />
      </div>

      <div className="grid gap-4 rounded-xl border p-4">
        <div>
          <h3 className="text-sm font-semibold">بنود الفاتورة الأصلية</h3>
          <p className="text-xs text-muted-foreground">
            أدخل فقط الكمية المطلوب عكسها. السعر والإجمالي محسوبان تلقائيًا من الفاتورة الأصلية.
          </p>
        </div>

        {selectedPurchase?.lines.map((line) => {
          const quantity = Number(lineQuantities[line.id] ?? 0);
          const lineTotal = quantity > 0 ? quantity * line.unitPrice : 0;

          return (
            <div key={line.id} className="grid gap-3 rounded-lg border p-3">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label>الخامة</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                    {ingredientNames.get(line.ingredientId) ?? `خامة #${line.ingredientId}`}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label>الكمية الأصلية</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                    {formatQuantity(line.quantity)} {line.unit}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label>كمية العكس</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={lineQuantities[line.id] ?? ""}
                    onChange={(event) => updateLine(line.id, event.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label>إجمالي العكس</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                    {formatAmount(lineTotal)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                سعر الوحدة الأصلي: {formatAmount(line.unitPrice)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          سيتم رفض الحفظ إذا تجاوزت الكميات المتبقية أو إذا أصبح المخزون بالسالب.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="button" size="sm" disabled={isSubmitting} onClick={onSubmit}>
            {isSubmitting ? "جارٍ الحفظ…" : "حفظ عكس الشراء"}
          </Button>
        </div>
      </div>
    </div>
  );
}
