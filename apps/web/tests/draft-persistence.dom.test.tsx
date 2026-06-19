import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Product } from "@capella/shared/products/product.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ProductionBatchDialog } from "@/components/production/production-batch-dialog";
import { IngredientPurchaseDialog } from "@/components/purchases/ingredients/ingredient-purchase-dialog";
import { ExpenseDialog } from "@/components/purchases/expenses/expense-dialog";

const products: Product[] = [
  { id: 5, name: "كيك" } as Product,
  { id: 9, name: "بسكويت" } as Product,
];

const ingredients: Ingredient[] = [
  { id: 11, name: "دقيق", unitFamily: "weight" } as Ingredient,
  { id: 12, name: "لبن", unitFamily: "volume" } as Ingredient,
];

const suppliers: Supplier[] = [
  { id: 3, name: "مورد أ" } as Supplier,
  { id: 7, name: "مورد ب" } as Supplier,
];

describe("Draft persistence in dialogs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("production batch silently restores draft after closing and reopening the sheet", async () => {
    const user = userEvent.setup();
    render(<ProductionBatchDialog products={products} ingredients={ingredients} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));

    const [producedQuantity, lineQuantity] = screen.getAllByRole("spinbutton");
    await user.type(producedQuantity, "12");
    await user.type(lineQuantity, "5");
    await user.type(screen.getByLabelText(/ملاحظات/), "دفعة صباحية");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ التشغيلة" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));

    expect(screen.getByDisplayValue("12")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("دفعة صباحية")).toBeInTheDocument();
  });

  test("production batch cancel clears the draft before closing", async () => {
    const user = userEvent.setup();
    render(<ProductionBatchDialog products={products} ingredients={ingredients} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));
    await user.type(screen.getAllByRole("spinbutton")[0], "12");
    await user.type(screen.getByLabelText(/ملاحظات/), "يجب حذفها");

    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ التشغيلة" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));

    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("ingredient purchase silently restores draft after closing and reopening the sheet", async () => {
    const user = userEvent.setup();
    render(<IngredientPurchaseDialog suppliers={suppliers} ingredients={ingredients} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));

    await user.click(screen.getByRole("button", { name: "مورد أ" }));
    await user.click(screen.getByRole("option", { name: "مورد ب" }));
    const [quantity, lineTotal] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "8");
    await user.type(lineTotal, "100");
    await user.type(screen.getByLabelText(/ملاحظات/), "فاتورة مؤقتة");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ الفاتورة" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));

    expect(screen.getByRole("button", { name: "مورد ب" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("فاتورة مؤقتة")).toBeInTheDocument();
  });

  test("ingredient purchase cancel clears the draft before closing", async () => {
    const user = userEvent.setup();
    render(<IngredientPurchaseDialog suppliers={suppliers} ingredients={ingredients} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));
    await user.type(screen.getAllByRole("spinbutton")[0], "8");
    await user.type(screen.getByLabelText(/ملاحظات/), "امسحني");

    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ الفاتورة" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));

    expect(screen.getByRole("button", { name: "مورد أ" })).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("expense silently restores draft after closing and reopening the sheet", async () => {
    const user = userEvent.setup();
    render(<ExpenseDialog />);

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    await user.selectOptions(screen.getByRole("combobox"), "other");
    await user.type(screen.getByLabelText(/المبلغ/), "250");
    await user.type(screen.getByLabelText(/وصف النوع/), "صيانة");
    await user.type(screen.getByLabelText(/ملاحظات/), "لا تضعها من جديد");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "تسجيل المصروف" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    expect(screen.getByRole("combobox")).toHaveValue("other");
    expect(screen.getByLabelText(/المبلغ/)).toHaveValue(250);
    expect(screen.getByLabelText(/وصف النوع/)).toHaveValue("صيانة");
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("لا تضعها من جديد");
  });

  test("expense cancel clears the draft before closing", async () => {
    const user = userEvent.setup();
    render(<ExpenseDialog />);

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));
    await user.selectOptions(screen.getByRole("combobox"), "other");
    await user.type(screen.getByLabelText(/المبلغ/), "250");
    await user.type(screen.getByLabelText(/وصف النوع/), "صيانة");
    await user.type(screen.getByLabelText(/ملاحظات/), "امسحني");

    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "تسجيل المصروف" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    expect(screen.getByRole("combobox")).toHaveValue("rent");
    expect(screen.getByLabelText(/المبلغ/)).toHaveValue(null);
    expect(screen.queryByLabelText(/وصف النوع/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });
});
