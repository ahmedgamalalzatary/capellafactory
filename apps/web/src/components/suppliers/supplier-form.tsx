"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SupplierInput } from "@capella/shared/suppliers/supplier.types";
import { createSupplier, updateSupplier } from "@/api-client/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SupplierFormProps = {
  supplierId?: number;
  initialValues?: Partial<SupplierInput>;
  submitLabel?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

function Field({
  id,
  label,
  code,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  code: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}{" "}
          {required ? (
            <span className="ml-1 text-[var(--ink)]">*</span>
          ) : (
            <span className="ml-1 text-[var(--muted-soft)]">opt</span>
          )}
        </Label>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--muted-soft)]">
          {code}
        </span>
      </div>
      {children}
      {hint ? (
        <p className="text-[11px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function SupplierForm({
  supplierId,
  initialValues,
  submitLabel = "Save Supplier",
  onCancel,
  onSuccess,
}: SupplierFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    const payload: SupplierInput = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      where: normalizeOptionalField(formData.get("where")),
      notes: String(formData.get("notes") ?? "").trim(),
    };

    try {
      if (supplierId) {
        await updateSupplier(supplierId, payload);
      } else {
        await createSupplier(payload);
      }

      router.refresh();
      onSuccess?.();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to save supplier",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field id="name" label="Name" code="F.01" required hint="Trading name as it appears on invoices.">
        <Input
          id="name"
          name="name"
          placeholder="Acme Manufacturing Co."
          defaultValue={initialValues?.name}
          required
        />
      </Field>

      <Field id="phone" label="Phone" code="F.02" required hint="Include country code, e.g. +44 …">
        <Input
          id="phone"
          name="phone"
          placeholder="+44 20 7946 0000"
          defaultValue={initialValues?.phone}
          required
        />
      </Field>

      <Field id="where" label="Where" code="F.03" hint="City, region, or warehouse identifier.">
        <Input
          id="where"
          name="where"
          placeholder="Manchester, UK"
          defaultValue={initialValues?.where}
        />
      </Field>

      <Field id="notes" label="Notes" code="F.04" required hint="Operational context: lead times, MOQ, payment terms…">
        <Textarea
          id="notes"
          name="notes"
          placeholder="Reliable on cast iron orders. Net‑30. 6 week lead time."
          defaultValue={initialValues?.notes}
          required
        />
      </Field>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            <span className="text-[var(--ink)]">*</span> required · writes to api on submit
          </p>
          {error ? <p className="text-[12px] text-red-700">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function normalizeOptionalField(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
}
