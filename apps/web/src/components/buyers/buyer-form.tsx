"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { BuyerInput } from "@capella/shared/buyers/buyer.types";
import { createBuyer, updateBuyer } from "@/lib/api/buyers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BuyerFormProps = {
  buyerId?: number;
  initialValues?: Partial<BuyerInput>;
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

export function BuyerForm({
  buyerId,
  initialValues,
  submitLabel = "حفظ",
  onCancel,
  onSuccess,
}: BuyerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    const payload: BuyerInput = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      where: normalizeOptionalField(formData.get("where")),
      notes: normalizeOptionalField(formData.get("notes")),
    };

    try {
      if (buyerId) {
        await updateBuyer(buyerId, payload);
        toast.success("تم تحديث بيانات المشتري بنجاح");
      } else {
        await createBuyer(payload);
        toast.success("تم إضافة المشتري بنجاح");
      }
      router.refresh();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حفظ المشتري. حاول مجددًا.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field id="name" label="الاسم" required hint="اسم العميل أو جهة الشراء كما يظهر في الفواتير.">
        <Input id="name" name="name" placeholder="شركة النيل للتجارة" defaultValue={initialValues?.name} required />
      </Field>

      <Field id="phone" label="الهاتف" required hint="مع رمز الدولة، مثال: ‎+20 …">
        <Input id="phone" name="phone" dir="ltr" placeholder="+20 100 000 0000" defaultValue={initialValues?.phone} required />
      </Field>

      <Field id="where" label="الموقع" hint="المدينة أو المنطقة أو عنوان الفرع.">
        <Input id="where" name="where" placeholder="القاهرة، مصر" defaultValue={initialValues?.where} />
      </Field>

      <Field id="notes" label="الملاحظات" hint="معلومات تشغيلية: مواعيد التسليم، حدود الائتمان، طريقة الدفع…">
        <Textarea id="notes" name="notes" placeholder="عميل جملة. يفضّل التسليم صباحًا." defaultValue={initialValues?.notes} />
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
