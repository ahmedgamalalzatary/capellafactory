"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SolidAsset, SolidAssetInput } from "@capella/shared/solid-assets/solid-asset.types";
import { createSolidAsset, updateSolidAsset } from "@/lib/api/solid-assets";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SolidAssetFormProps = {
  assetId?: number;
  initialValues?: Partial<SolidAsset>;
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
        {required ? <span className="ms-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SolidAssetForm({
  assetId,
  initialValues,
  submitLabel = "حفظ",
  onCancel,
  onSuccess,
}: SolidAssetFormProps) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      const payload: SolidAssetInput = {
        name: String(formData.get("name") ?? "").trim(),
        qty: Number(formData.get("qty") ?? 0),
        priceOfOne: Number(formData.get("priceOfOne") ?? 0),
      };

      try {
        if (assetId) {
          await updateSolidAsset(assetId, payload);
          toast.success("تم تحديث الأصل بنجاح");
        } else {
          await createSolidAsset(payload);
          toast.success("تم إضافة الأصل بنجاح");
        }
        router.refresh();
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "فشل حفظ الأصل. حاول مجددًا.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field id="name" label="اسم الأصل" required hint="الاسم الواضح للأصل الثابت داخل المكان.">
        <Input id="name" name="name" placeholder="مكتب إداري" defaultValue={initialValues?.name} required />
      </Field>

      <Field id="qty" label="الكمية" required hint="الكمية تقبل أرقامًا صحيحة فقط مثل 1 أو 2 أو 3.">
        <Input id="qty" name="qty" type="number" min="1" step="1" defaultValue={initialValues?.qty} required />
      </Field>

      <Field id="priceOfOne" label="سعر الواحدة" required hint="سعر القطعة الواحدة، وسيتم حساب الإجمالي تلقائيًا.">
        <Input
          id="priceOfOne"
          name="priceOfOne"
          type="number"
          min="0.001"
          step="0.001"
          defaultValue={initialValues?.priceOfOne}
          required
        />
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
            {isSubmitting ? "جارٍ الحفظ…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
