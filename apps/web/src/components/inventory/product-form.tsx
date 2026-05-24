"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ProductInput } from "@capella/shared/products/product.types";
import { createProduct, updateProduct } from "@/lib/api/products";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductFormProps = {
  productId?: number;
  initialValues?: Partial<ProductInput>;
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
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

export function ProductForm({
  productId,
  initialValues,
  submitLabel = "حفظ",
  onCancel,
  onSuccess,
}: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    const payload: ProductInput = {
      name: String(formData.get("name") ?? "").trim(),
    };

    try {
      if (productId) {
        await updateProduct(productId, payload);
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        await createProduct(payload);
        toast.success("تم إضافة المنتج بنجاح");
      }

      router.refresh();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حفظ المنتج. حاول مجددًا.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field
        id="name"
        label="اسم المنتج"
        required
        hint="استخدم اسمًا نهائيًا واضحًا يظهر في الفواتير وفي شاشة الإنتاج لاحقًا."
      >
        <Input
          id="name"
          name="name"
          placeholder="شراب برتقال"
          defaultValue={initialValues?.name}
          required
        />
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
