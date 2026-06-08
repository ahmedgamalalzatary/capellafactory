"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  IngredientInput,
  IngredientUnitFamily,
} from "@capella/shared/ingredients/ingredient.types";
import { createIngredient, updateIngredient } from "@/lib/api/ingredients";
import { runWithSubmitLock } from "@/lib/submit-lock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IngredientFormProps = {
  ingredientId?: number;
  initialValues?: Partial<IngredientInput>;
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

export function IngredientForm({
  ingredientId,
  initialValues,
  submitLabel = "حفظ",
  onCancel,
  onSuccess,
}: IngredientFormProps) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    await runWithSubmitLock(submitLock, setIsSubmitting, async () => {
      const payload: IngredientInput = {
        name: String(formData.get("name") ?? "").trim(),
        unitFamily: String(formData.get("unitFamily") ?? "weight") as IngredientUnitFamily,
      };

      try {
        if (ingredientId) {
          await updateIngredient(ingredientId, payload);
          toast.success("تم تحديث بيانات الخام بنجاح");
        } else {
          await createIngredient(payload);
          toast.success("تم إضافة الخام بنجاح");
        }

        router.refresh();
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "فشل حفظ الخام. حاول مجددًا.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-5">
      <Field
        id="name"
        label="اسم الخام"
        required
        hint="استخدم اسمًا موحدًا للمادة نفسها حتى لو اختلف المورد أو السعر."
      >
        <Input
          id="name"
          name="name"
          placeholder="سكر أبيض"
          defaultValue={initialValues?.name}
          required
        />
      </Field>

      <Field
        id="unitFamily"
        label="عائلة الوحدة"
        required
        hint="الوزن يتحول داخليًا إلى جرام، الحجم إلى مليلتر، والعدّ إلى قطعة."
      >
        <select
          id="unitFamily"
          name="unitFamily"
          defaultValue={initialValues?.unitFamily ?? "weight"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="weight">وزن</option>
          <option value="volume">حجم</option>
          <option value="count">عدد</option>
        </select>
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
