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
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  buildIsoDateTime,
  getLocalDateInputValue,
  getLocalTimeInputValue,
  PurchaseDateTimeFields,
} from "@/components/purchases/datetime-fields";
import {
  buildPaymentInputs,
  createEmptyPaymentRow,
  createInactiveAdjustment,
  DocumentFinancialSection,
  formatAmount,
  type DraftAdjustment,
  type DraftPaymentRow,
} from "@/components/purchases/document-financial-section";

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
  const [tax, setTax] = useState<DraftAdjustment>(createInactiveAdjustment());
  const [discount, setDiscount] = useState<DraftAdjustment>(createInactiveAdjustment());
  const [payments, setPayments] = useState<DraftPaymentRow[]>([createEmptyPaymentRow()]);

  function resetForm() {
    const next = new Date();
    setLines([createEmptyLine(products)]);
    setOccurredAtDate(getLocalDateInputValue(next));
    setOccurredAtTime(getLocalTimeInputValue(next));
    setBuyerId(String(buyers[0]?.id ?? ""));
    setNotes("");
    setTax(createInactiveAdjustment());
    setDiscount(createInactiveAdjustment());
    setPayments([createEmptyPaymentRow()]);
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
        <SearchableSelect
          value={buyerId}
          onChange={setBuyerId}
          options={buyers.map((buyer) => ({
            value: String(buyer.id),
            label: `${buyer.name} - ${buyer.phone}`,
            searchText: `${buyer.name} ${buyer.phone}`,
          }))}
        />
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
                  <SearchableSelect
                    value={String(line.productId)}
                    onChange={(nextValue) =>
                      updateLine(index, (current) => ({
                        ...current,
                        productId: Number(nextValue),
                      }))
                    }
                    options={products.map((item) => ({
                      value: String(item.id),
                      label: `${item.name} - متاح ${item.stockQuantity.toFixed(0)}`,
                      searchText: item.name,
                      disabled:
                        item.id !== line.productId &&
                        lines.some((other) => other.productId === item.id),
                    }))}
                  />
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

      <DocumentFinancialSection
        baseTotal={invoiceTotal}
        totalLabel="إجمالي الفاتورة"
        tax={tax}
        discount={discount}
        payments={payments}
        onTaxChange={setTax}
        onDiscountChange={setDiscount}
        onPaymentsChange={setPayments}
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
            {isSubmitting ? "جارٍ الحفظ…" : "حفظ الفاتورة"}
          </Button>
        </div>
      </div>
    </form>
  );
}
