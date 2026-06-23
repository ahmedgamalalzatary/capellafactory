import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
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
import { SalesInvoiceDialog } from "@/components/sales/sales-invoice-dialog";

const products: Product[] = [
  { id: 5, name: "كيك", stockQuantity: 12, averageUnitCost: 3.5 } as Product,
  { id: 9, name: "بسكويت", stockQuantity: 4, averageUnitCost: 2.25 } as Product,
];

const ingredients: Ingredient[] = [
  { id: 11, name: "دقيق", unitFamily: "weight" } as Ingredient,
  { id: 12, name: "لبن", unitFamily: "volume" } as Ingredient,
];

const suppliers: Supplier[] = [
  { id: 3, name: "مورد أ" } as Supplier,
  { id: 7, name: "مورد ب" } as Supplier,
];

const buyers: Buyer[] = [
  { id: 5, name: "عميل أ", phone: "0100" } as Buyer,
  { id: 6, name: "عميل ب", phone: "0111" } as Buyer,
];

describe("Draft persistence in dialogs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("production batch restores a saved draft from the restore menu", async () => {
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

    expect(screen.getByRole("button", { name: /استرجاع/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /استرجاع/i }));
    await user.click(screen.getByRole("menuitem", { name: /كيك/ }));

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
    await user.click(screen.getByRole("button", { name: "حذف المسودة" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ التشغيلة" })).not.toBeInTheDocument(),
    );

    expect(screen.queryByRole("button", { name: /استرجاع/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));

    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("production batch shows restore after closing a draft and opens fresh by default", async () => {
    const user = userEvent.setup();
    render(<ProductionBatchDialog products={products} ingredients={ingredients} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));
    const [producedQuantity, lineQuantity] = screen.getAllByRole("spinbutton");
    await user.type(producedQuantity, "12");
    await user.type(lineQuantity, "5");
    await user.type(screen.getByLabelText(/ملاحظات/), "دفعة مساء");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ التشغيلة" })).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /استرجاع/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة تشغيلة إنتاج" }));

    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("ingredient purchase restores a saved draft from the restore menu", async () => {
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

    await user.click(screen.getByRole("button", { name: /استرجاع/i }));
    await user.click(screen.getByRole("menuitem", { name: /مورد ب/ }));

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
    await user.click(screen.getByRole("button", { name: "حذف المسودة" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ الفاتورة" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));

    expect(screen.getByRole("button", { name: "مورد أ" })).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("ingredient purchase shows restore after closing a draft and opens fresh by default", async () => {
    const user = userEvent.setup();
    render(<IngredientPurchaseDialog suppliers={suppliers} ingredients={ingredients} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));
    await user.click(screen.getByRole("button", { name: "مورد أ" }));
    await user.click(screen.getByRole("option", { name: "مورد ب" }));
    const [quantity, lineTotal] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "8");
    await user.type(lineTotal, "100");
    await user.type(screen.getByLabelText(/ملاحظات/), "فاتورة مورد ب");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ الفاتورة" })).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /استرجاع/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة خامات" }));

    expect(screen.getByRole("button", { name: "مورد أ" })).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("expense shows restore after closing a draft and opens fresh by default", async () => {
    const user = userEvent.setup();
    render(<ExpenseDialog />);

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    await user.selectOptions(screen.getByLabelText(/نوع المصروف/), "other");
    await user.type(screen.getByLabelText(/إجمالي المصروف/), "250");
    await user.type(screen.getByLabelText(/وصف النوع/), "صيانة");
    await user.type(screen.getByLabelText(/ملاحظات/), "لا تضعها من جديد");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "تسجيل المصروف" })).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /استرجاع/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    expect(screen.getByLabelText(/نوع المصروف/)).toHaveValue("rent");
    expect(screen.getByLabelText(/إجمالي المصروف/)).toHaveValue(null);
    expect(screen.queryByLabelText(/وصف النوع/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("expense cancel clears the active draft before closing", async () => {
    const user = userEvent.setup();
    render(<ExpenseDialog />);

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));
    await user.selectOptions(screen.getByLabelText(/نوع المصروف/), "other");
    await user.type(screen.getByLabelText(/إجمالي المصروف/), "250");
    await user.type(screen.getByLabelText(/وصف النوع/), "صيانة");
    await user.type(screen.getByLabelText(/ملاحظات/), "امسحني");

    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    await user.click(screen.getByRole("button", { name: "حذف المسودة" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "تسجيل المصروف" })).not.toBeInTheDocument(),
    );

    expect(screen.queryByRole("button", { name: /استرجاع/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    expect(screen.getByLabelText(/نوع المصروف/)).toHaveValue("rent");
    expect(screen.getByLabelText(/إجمالي المصروف/)).toHaveValue(null);
    expect(screen.queryByLabelText(/وصف النوع/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });

  test("expense dialog opens a fresh invoice and restores older saved drafts on demand", async () => {
    const user = userEvent.setup();
    render(<ExpenseDialog />);

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));
    await user.selectOptions(screen.getByLabelText(/نوع المصروف/), "other");
    await user.type(screen.getByLabelText(/إجمالي المصروف/), "250");
    await user.type(screen.getByLabelText(/وصف النوع/), "صيانة");
    await user.type(screen.getByLabelText(/ملاحظات/), "مسودة أولى");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "تسجيل المصروف" })).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /استرجاع/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة مصروف" }));

    expect(screen.getByLabelText(/نوع المصروف/)).toHaveValue("rent");
    expect(screen.getByLabelText(/إجمالي المصروف/)).toHaveValue(null);
    expect(screen.queryByLabelText(/وصف النوع/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "تسجيل المصروف" })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /استرجاع/i }));
    await user.click(screen.getByRole("menuitem", { name: /صيانة/ }));

    expect(screen.getByLabelText(/نوع المصروف/)).toHaveValue("other");
    expect(screen.getByLabelText(/إجمالي المصروف/)).toHaveValue(250);
    expect(screen.getByLabelText(/وصف النوع/)).toHaveValue("صيانة");
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("مسودة أولى");
  });

  test("sales shows restore after closing a draft and opens fresh by default", async () => {
    const user = userEvent.setup();
    render(<SalesInvoiceDialog buyers={buyers} products={products} />);

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة مبيعات" }));
    const [quantity, sellingUnitPrice] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "3");
    await user.type(sellingUnitPrice, "12.5");
    await user.type(screen.getByLabelText(/ملاحظات/), "عميل لاحق");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "حفظ الفاتورة" })).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /استرجاع/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ إضافة فاتورة مبيعات" }));

    const [freshQuantity, freshSellingUnitPrice] = screen.getAllByRole("spinbutton");
    expect(freshQuantity).toHaveValue(null);
    expect(freshSellingUnitPrice).toHaveValue(null);
    expect(screen.getByLabelText(/ملاحظات/)).toHaveValue("");
  });
});
