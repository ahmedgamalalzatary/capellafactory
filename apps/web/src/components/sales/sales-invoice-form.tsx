"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";
import type { SalesInvoiceInput } from "@capella/shared/sales-invoices/sales-invoice.types";
import { createSalesInvoice } from "@/lib/api/sales-invoices";
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
  draftId?: string | null;
  initialDraft?: SalesInvoiceDraft | null;
  draftStorageKey?: string;
  onDraftsChange?: () => void;
  onCancel?: () => void;
  onSuccess?: () => void;
};

type DraftLine = {
  productId: number;
  quantity: string;
  sellingUnitPrice: string;
};

export type SalesInvoiceDraft = {
  occurredAtDate: string;
  occurredAtTime: string;
  buyerId: string;
  notes: string;
  tax: DraftAdjustment;
  discount: DraftAdjustment;
  payments: DraftPaymentRow[];
  lines: DraftLine[];
};

export const salesInvoiceDraftStorageKey = "capella:drafts:sales-invoice";

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

export function isSalesInvoiceDraft(value: unknown): value is SalesInvoiceDraft {
  const candidate = value as Partial<SalesInvoiceDraft> | null;

  return (
    typeof value === "object" &&
    value !== null &&
    typeof candidate?.occurredAtDate === "string" &&
    typeof candidate.occurredAtTime === "string" &&
    typeof candidate.buyerId === "string" &&
    typeof candidate.notes === "string" &&
    typeof candidate.tax === "object" &&
    candidate.tax !== null &&
    typeof candidate.discount === "object" &&
    candidate.discount !== null &&
    Array.isArray(candidate.payments) &&
    Array.isArray(candidate.lines)
  );
}

export function createEmptySalesInvoiceDraft(
  products: Product[],
  buyers: Buyer[],
  now = new Date(),
): SalesInvoiceDraft {
  return {
    occurredAtDate: getLocalDateInputValue(now),
    occurredAtTime: getLocalTimeInputValue(now),
    buyerId: String(buyers[0]?.id ?? ""),
    notes: "",
    tax: createInactiveAdjustment(),
    discount: createInactiveAdjustment(),
    payments: [createEmptyPaymentRow()],
    lines: [createEmptyLine(products)],
  };
}

function isSalesInvoiceDraftEmpty(draft: SalesInvoiceDraft, products: Product[], buyers: Buyer[]) {
  const emptyDraft = createEmptySalesInvoiceDraft(products, buyers, new Date("2024-01-01T00:00:00Z"));
  const line = draft.lines[0];
  const emptyLine = emptyDraft.lines[0];

  return (
    draft.occurredAtDate.length > 0 &&
    draft.occurredAtTime.length > 0 &&
    draft.buyerId === emptyDraft.buyerId &&
    draft.notes === "" &&
    draft.tax.state === "inactive" &&
    draft.discount.state === "inactive" &&
    draft.payments.length === 1 &&
    draft.payments[0]?.amount === "" &&
    draft.payments[0]?.paymentMethod === "cod" &&
    draft.lines.length === 1 &&
    line?.productId === emptyLine?.productId &&
    line?.quantity === "" &&
    line?.sellingUnitPrice === ""
  );
}

export function getSalesInvoiceDraftLabel(draft: SalesInvoiceDraft, buyers: Buyer[]) {
  return buyers.find((buyer) => String(buyer.id) === draft.buyerId)?.name ?? "مسودة فاتورة مبيعات";
}

export function SalesInvoiceForm({
  buyers,
  products,
  draftId = null,
  initialDraft,
  draftStorageKey = salesInvoiceDraftStorageKey,
  onDraftsChange,
  onCancel,
  onSuccess,
}: SalesInvoiceFormProps) {
  const router = useRouter();
  const now = new Date();
  const submitLock = useRef(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const seedDraft = initialDraft ?? createEmptySalesInvoiceDraft(products, buyers, now);
  const [lines, setLines] = useState<DraftLine[]>(
    seedDraft.lines.length ? seedDraft.lines : [createEmptyLine(products)],
  );
  const [occurredAtDate, setOccurredAtDate] = useState(seedDraft.occurredAtDate);
  const [occurredAtTime, setOccurredAtTime] = useState(seedDraft.occurredAtTime);
  const [buyerId, setBuyerId] = useState(seedDraft.buyerId);
  const [notes, setNotes] = useState(seedDraft.notes);
  const [tax, setTax] = useState<DraftAdjustment>(seedDraft.tax);
  const [discount, setDiscount] = useState<DraftAdjustment>(seedDraft.discount);
  const [payments, setPayments] = useState<DraftPaymentRow[]>(
    seedDraft.payments.length ? seedDraft.payments : [createEmptyPaymentRow()],
  );

  useEffect(() => {
    const currentDraft: SalesInvoiceDraft = {
      occurredAtDate,
      occurredAtTime,
      buyerId,
      notes,
      tax,
      discount,
      payments,
      lines,
    };

    if (isSalesInvoiceDraftEmpty(currentDraft, products, buyers)) {
      return;
    }

    const entry = saveLocalDraftEntry<SalesInvoiceDraft>(
      draftStorageKey,
      currentDraft,
      currentDraftId ?? undefined,
    );

    if (entry.id !== currentDraftId) {
      setCurrentDraftId(entry.id);
    }

    onDraftsChange?.();
  }, [
    buyerId,
    buyers,
    currentDraftId,
    discount,
    draftStorageKey,
    lines,
    notes,
    occurredAtDate,
    occurredAtTime,
    onDraftsChange,
    payments,
    products,
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
    const nextDraft = createEmptySalesInvoiceDraft(products, buyers);
    setCurrentDraftId(null);
    setLines(nextDraft.lines);
    setOccurredAtDate(nextDraft.occurredAtDate);
    setOccurredAtTime(nextDraft.occurredAtTime);
    setBuyerId(nextDraft.buyerId);
    setNotes(nextDraft.notes);
    setTax(nextDraft.tax);
    setDiscount(nextDraft.discount);
    setPayments(nextDraft.payments);
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

  function handleCancel() {
    if (currentDraftId) {
      setCancelDialogOpen(true);
      return;
    }

    resetForm();
    onCancel?.();
  }

  function confirmCancel() {
    removeCurrentDraft();
    resetForm();
    setCancelDialogOpen(false);
    onCancel?.();
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
        removeCurrentDraft();
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
    <>
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
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              إلغاء
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "جارٍ الحفظ…" : "حفظ الفاتورة"}
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
