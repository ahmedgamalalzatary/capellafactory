"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SupplierInput } from "@capella/shared/suppliers/supplier.types";
import { createSupplier, updateSupplier } from "@/lib/api/suppliers";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
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
          <span className="ms-1 text-muted-foreground text-xs font-normal">
            (اختياري)
          </span>
        )}
      </Label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

export function SupplierForm({
  supplierId,
  initialValues,
  submitLabel = "حفظ",
  onCancel,
  onSuccess,
}: SupplierFormProps) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      const payload: SupplierInput = {
        name: String(formData.get("name") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        where: normalizeOptionalField(formData.get("where")),
        notes: normalizeOptionalField(formData.get("notes")),
      };

      try {
        if (supplierId) {
          await updateSupplier(supplierId, payload);
          toast.success("تم تحديث بيانات المورد بنجاح");
        } else {
          await createSupplier(payload);
          toast.success("تم إضافة المورد بنجاح");
        }
        router.refresh();
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "فشل حفظ المورد. حاول مجددًا.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field id="name" label="الاسم" required hint="الاسم التجاري كما يظهر في الفواتير.">
        <Input id="name" name="name" placeholder="شركة المصانع المتحدة" defaultValue={initialValues?.name} required />
      </Field>

      <Field id="phone" label="الهاتف" required hint="مع رمز الدولة، مثال: ‎+20 …">
        <Input id="phone" name="phone" dir="ltr" placeholder="+20 100 000 0000" defaultValue={initialValues?.phone} required />
      </Field>

      <Field id="where" label="الموقع" hint="المدينة أو المنطقة أو رقم المستودع.">
        <Input id="where" name="where" placeholder="القاهرة، مصر" defaultValue={initialValues?.where} />
      </Field>

      <Field id="notes" label="الملاحظات"  hint="معلومات تشغيلية: مدة التوريد، الحد الأدنى للطلب، شروط الدفع…">
        <Textarea id="notes" name="notes" placeholder="مورد موثوق. الدفع آجل 30 يومًا." defaultValue={initialValues?.notes} />
      </Field>

      <div className="flex items-center justify-between border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> حقول مطلوبة
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الحفظ…" : submitLabel}
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
