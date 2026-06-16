"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";
import type { SalesInvoiceInput } from "@capella/shared/sales-invoices/sales-invoice.types";
import { createSalesInvoice } from "@/lib/api/sales-invoices";
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
} from "@/components/purchases/datetime-fields";

type SalesInvoiceFormProps = {
  buyers: Buyer[];
  products: Product[];
  onCancel?: () => void;
  onSuccess?: () => void;
};

type DraftLine = {
  productId: number;
  quantity: string;
  sellingUnitPrice: string;
};

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

function createEmptyLine(products: Product[], usedProductIds: number[] = []): DraftLine {
  const product = products.find((item) => !usedProductIds.includes(item.id)) ?? products[0];
  return {
    productId: product?.id ?? 0,
    quantity: "",
    sellingUnitPrice: "",
  };
}

export function SalesInvoiceForm({ buyers, products, onCancel, onSuccess }: SalesInvoiceFormProps) {
  const router = useRouter();
  const now = new Date();
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([createEmptyLine(products)]);
  const [occurredAtDate, setOccurredAtDate] = useState(getLocalDateInputValue(now));
  const [occurredAtTime, setOccurredAtTime] = useState(getLocalTimeInputValue(now));
  const [buyerId, setBuyerId] = useState(String(buyers[0]?.id ?? ""));
  const [notes, setNotes] = useState("");

  function resetForm() {
    const next = new Date();
    setLines([createEmptyLine(products)]);
    setOccurredAtDate(getLocalDateInputValue(next));
    setOccurredAtTime(getLocalTimeInputValue(next));
    setBuyerId(String(buyers[0]?.id ?? ""));
    setNotes("");
  }

  function updateLine(index: number, updater: (line: DraftLine) => DraftLine) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? updater(line) : line)));
  }

  function addLine() {
    setLines((current) => [
      ...current,
      createEmptyLine(
        products,
        current.map((line) => line.productId),
      ),
    ]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function onSubmit() {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      try {
        const payload: SalesInvoiceInput = {
          occurredAt: buildIsoDateTime(occurredAtDate, occurredAtTime),
          buyerId: Number(buyerId || 0),
          notes: notes.trim() || undefined,
          lines: lines.map((line) => ({
            productId: Number(line.productId),
            quantity: Number(line.quantity),
            sellingUnitPrice: Number(line.sellingUnitPrice),
          })),
        };

        await createSalesInvoice(payload);
        toast.success("تم حفظ فاتورة المبيعات");
        resetForm();
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل حفظ فاتورة المبيعات.");
      }
    });
  }

  const invoiceTotal = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity || 0);
    const sellingUnitPrice = Number(line.sellingUnitPrice || 0);
    return sum + quantity * sellingUnitPrice;
  }, 0);

  return (
    <form action={onSubmit} className="grid gap-5">
      <PurchaseDateTimeFields
        dateId="occurredAtDate"
        timeId="occurredAtTime"
        label="وقت البيع الفعلي"
        hint="لا يمكن حفظ فاتورة مبيعات بتاريخ سابق."
        defaultDate={getLocalDateInputValue(now)}
        dateValue={occurredAtDate}
        onDateChange={setOccurredAtDate}
        timeValue={occurredAtTime}
        onTimeChange={setOccurredAtTime}
      />

      <Field id="buyerId" label="المشتري" required>
        <select
          id="buyerId"
          name="buyerId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={buyerId}
          onChange={(event) => setBuyerId(event.target.value)}
          required
        >
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.name} - {buyer.phone}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">المنتجات المباعة</h3>
            <p className="text-xs text-muted-foreground">
              كل منتج يظهر مرة واحدة فقط. الإجمالي يحسب تلقائيًا من الكمية وسعر البيع.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            + منتج
          </Button>
        </div>

        {lines.map((line, index) => {
          const product = products.find((item) => item.id === line.productId) ?? products[0];
          const quantity = Number(line.quantity || 0);
          const sellingUnitPrice = Number(line.sellingUnitPrice || 0);
          const lineTotal = quantity * sellingUnitPrice;

          return (
            <div key={index} className="grid gap-3 rounded-lg border p-3">
              <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.9fr]">
                <div className="grid gap-1.5">
                  <Label>المنتج</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={line.productId}
                    onChange={(event) =>
                      updateLine(index, (current) => ({
                        ...current,
                        productId: Number(event.target.value),
                      }))
                    }
                  >
                    {products.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        disabled={
                          item.id !== line.productId &&
                          lines.some((other) => other.productId === item.id)
                        }
                      >
                        {item.name} - متاح {item.stockQuantity.toFixed(0)}
                      </option>
                    ))}
                  </select>
                  {product ? (
                    <p className="text-[11px] text-muted-foreground">
                      تكلفة حالية مشتقة: {product.averageUnitCost.toFixed(6)}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(index, (current) => ({ ...current, quantity: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label>سعر البيع للوحدة</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={line.sellingUnitPrice}
                    onChange={(event) =>
                      updateLine(index, (current) => ({
                        ...current,
                        sellingUnitPrice: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  إجمالي البند:{" "}
                  <span className="font-semibold text-foreground">{formatAmount(lineTotal)}</span>
                </p>
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

      <div className="rounded-2xl border bg-muted/40 px-4 py-3">
        <p className="text-[11px] font-medium text-muted-foreground">إجمالي الفاتورة</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatAmount(invoiceTotal)}</p>
      </div>

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

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}
