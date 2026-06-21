"use client";

import type {
  AdjustmentState,
  AdjustmentType,
  DocumentPaymentInput,
} from "@capella/shared/payments/document-payment.types";
import type { PaymentMethod } from "@capella/shared/payments/payment.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DraftAdjustment = {
  state: AdjustmentState;
  type: AdjustmentType;
  value: string;
};

export type DraftPaymentRow = {
  amount: string;
  paymentMethod: PaymentMethod;
};

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "visa", label: "Visa" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "cod", label: "COD" },
  { value: "instapay", label: "Instapay" },
];

const adjustmentTypeOptions: Array<{ value: AdjustmentType; label: string }> = [
  { value: "amount", label: "مبلغ" },
  { value: "percentage", label: "نسبة %" },
];

export function createEmptyPaymentRow(): DraftPaymentRow {
  return {
    amount: "",
    paymentMethod: "cod",
  };
}

export function createInactiveAdjustment(): DraftAdjustment {
  return {
    state: "inactive",
    type: "amount",
    value: "0",
  };
}

export function DocumentFinancialSection({
  baseTotal,
  totalLabel,
  tax,
  discount,
  payments,
  onTaxChange,
  onDiscountChange,
  onPaymentsChange,
}: {
  baseTotal: number;
  totalLabel: string;
  tax: DraftAdjustment;
  discount: DraftAdjustment;
  payments: DraftPaymentRow[];
  onTaxChange: (value: DraftAdjustment) => void;
  onDiscountChange: (value: DraftAdjustment) => void;
  onPaymentsChange: (value: DraftPaymentRow[]) => void;
}) {
  const taxAmount = calculateAdjustmentAmount(baseTotal, tax);
  const totalAfterTax = baseTotal + taxAmount;
  const discountAmount = calculateAdjustmentAmount(totalAfterTax, discount);
  const finalTotal = Math.max(totalAfterTax - discountAmount, 0);
  const paidAmount = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const remainingAmount = Math.max(finalTotal - paidAmount, 0);

  function updatePayment(index: number, updater: (payment: DraftPaymentRow) => DraftPaymentRow) {
    onPaymentsChange(payments.map((payment, paymentIndex) => (paymentIndex === index ? updater(payment) : payment)));
  }

  function addPaymentRow() {
    onPaymentsChange([...payments, createEmptyPaymentRow()]);
  }

  function removePaymentRow(index: number) {
    onPaymentsChange(payments.length === 1 ? [createEmptyPaymentRow()] : payments.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-4 rounded-xl border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <AdjustmentEditor
          title="الضريبة"
          checkboxLabel="تفعيل الضريبة"
          typeLabel="نوع الضريبة"
          valueLabel="قيمة الضريبة"
          value={tax}
          onChange={onTaxChange}
        />
        <AdjustmentEditor
          title="الخصم"
          checkboxLabel="تفعيل الخصم"
          typeLabel="نوع الخصم"
          valueLabel="قيمة الخصم"
          value={discount}
          onChange={onDiscountChange}
        />
      </div>

      <div className="grid gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm">
        <SummaryRow label={totalLabel} value={baseTotal} />
        <SummaryRow label="قيمة الضريبة" value={taxAmount} />
        <SummaryRow label="بعد الضريبة" value={totalAfterTax} />
        <SummaryRow label="قيمة الخصم" value={discountAmount} />
        <SummaryRow label="الإجمالي النهائي" value={finalTotal} highlight />
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">الدفعات</p>
          <Button type="button" variant="outline" size="sm" onClick={addPaymentRow}>
            إضافة دفعة
          </Button>
        </div>

        {payments.map((payment, index) => (
          <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor={`paymentAmount-${index}`}>المدفوع</Label>
              <Input
                id={`paymentAmount-${index}`}
                type="number"
                min="0"
                max={finalTotal || undefined}
                step="0.001"
                value={payment.amount}
                onChange={(event) =>
                  updatePayment(index, (current) => ({ ...current, amount: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`paymentMethod-${index}`}>طريقة الدفع</Label>
              <select
                id={`paymentMethod-${index}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={payment.paymentMethod}
                onChange={(event) =>
                  updatePayment(index, (current) => ({
                    ...current,
                    paymentMethod: event.target.value as PaymentMethod,
                  }))
                }
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentRow(index)}>
                حذف
              </Button>
            </div>
          </div>
        ))}

        <div className="rounded-md bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">المتبقي: </span>
          <span className="font-semibold tabular-nums">{formatAmount(remainingAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function AdjustmentEditor({
  title,
  checkboxLabel,
  typeLabel,
  valueLabel,
  value,
  onChange,
}: {
  title: string;
  checkboxLabel: string;
  typeLabel: string;
  valueLabel: string;
  value: DraftAdjustment;
  onChange: (value: DraftAdjustment) => void;
}) {
  const isActive = value.state === "active";

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={isActive}
          aria-label={checkboxLabel}
          onChange={(event) =>
            onChange({
              ...value,
              state: event.target.checked ? "active" : "inactive",
              value: event.target.checked ? (Number(value.value) > 0 ? value.value : "") : "0",
            })
          }
        />
        <span>{title}</span>
      </label>

      {isActive ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>{typeLabel}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label={typeLabel}
              value={value.type}
              onChange={(event) =>
                onChange({
                  ...value,
                  type: event.target.value as AdjustmentType,
                })
              }
            >
              {adjustmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label>{valueLabel}</Label>
            <Input
              type="number"
              min="0"
              max={value.type === "percentage" ? "100" : undefined}
              step="0.001"
              aria-label={valueLabel}
              value={value.value}
              onChange={(event) =>
                onChange({
                  ...value,
                  value: event.target.value,
                })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={highlight ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{formatAmount(value)}</span>
    </div>
  );
}

function calculateAdjustmentAmount(baseTotal: number, adjustment: DraftAdjustment) {
  if (adjustment.state !== "active") {
    return 0;
  }

  const value = Number(adjustment.value) || 0;
  return adjustment.type === "percentage" ? (baseTotal * value) / 100 : value;
}

export function buildPaymentInputs(
  payments: DraftPaymentRow[],
  paidAt: string,
): DocumentPaymentInput[] {
  return payments
    .map((payment) => ({
      amount: Number(payment.amount) || 0,
      paymentMethod: payment.paymentMethod,
      paidAt,
    }))
    .filter((payment) => payment.amount > 0);
}

export function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}
