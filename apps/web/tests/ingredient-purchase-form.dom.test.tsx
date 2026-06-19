import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";

// --- mocks for the form's side-effect dependencies ---
const createIngredientPurchase = vi.fn();
const routerRefresh = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/api/ingredient-purchases", () => ({
  createIngredientPurchase: (...args: unknown[]) => createIngredientPurchase(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}));

import { IngredientPurchaseForm } from "@/components/purchases/ingredients/ingredient-purchase-form";

const suppliers: Supplier[] = [
  { id: 3, name: "مورد أ" } as Supplier,
  { id: 7, name: "مورد ب" } as Supplier,
];

const ingredients: Ingredient[] = [
  { id: 11, name: "دقيق", unitFamily: "weight" } as Ingredient,
  { id: 12, name: "سكر", unitFamily: "weight" } as Ingredient,
];

function renderForm() {
  return render(
    <IngredientPurchaseForm suppliers={suppliers} ingredients={ingredients} />,
  );
}

describe("IngredientPurchaseForm (behavioral)", () => {
  beforeEach(() => {
    createIngredientPurchase.mockReset().mockResolvedValue(undefined);
    routerRefresh.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("submits the entered line TOTAL, not the unit price", async () => {
    const user = userEvent.setup();
    renderForm();

    // Line-item number inputs (quantity, then total) in DOM order.
    const [quantity, lineTotal] = screen.getAllByRole("spinbutton");
    // 8 units for a total of 100 → unit price would be 12.5. We must NOT send 12.5.
    await user.type(quantity, "8");
    await user.type(lineTotal, "100");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createIngredientPurchase).toHaveBeenCalledTimes(1));

    const payload = createIngredientPurchase.mock.calls[0][0];
    expect(payload.lines).toHaveLength(1);
    expect(payload.lines[0]).toMatchObject({
      ingredientId: 11,
      quantity: 8,
      unit: "kg",
      lineTotal: 100, // <-- the total, NOT 12.5
    });
    expect(payload.supplierId).toBe(3); // first supplier is the default
    expect(toastSuccess).toHaveBeenCalled();
  });

  test("uses the chosen supplier from the select", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "مورد أ" }));
    await user.click(screen.getByRole("option", { name: "مورد ب" }));
    const [quantity, lineTotal] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "2");
    await user.type(lineTotal, "50");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createIngredientPurchase).toHaveBeenCalledTimes(1));
    expect(createIngredientPurchase.mock.calls[0][0].supplierId).toBe(7);
  });

  test("adds a second line above the existing first row", async () => {
    const user = userEvent.setup();
    renderForm();

    const inputs = screen.getAllByRole("spinbutton");
    await user.type(inputs[0], "3");
    await user.type(inputs[1], "30");

    await user.click(screen.getByRole("button", { name: "+ بند" }));

    const updatedInputs = screen.getAllByRole("spinbutton");
    expect(updatedInputs).toHaveLength(4);
    expect(updatedInputs[0]).toHaveValue(null);
    expect(updatedInputs[1]).toHaveValue(null);
    expect(updatedInputs[2]).toHaveValue(3);
    expect(updatedInputs[3]).toHaveValue(30);

    await user.type(updatedInputs[0], "4");
    await user.type(updatedInputs[1], "80");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createIngredientPurchase).toHaveBeenCalledTimes(1));
    const { lines } = createIngredientPurchase.mock.calls[0][0];
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ quantity: 4, lineTotal: 80 });
    expect(lines[1]).toMatchObject({ quantity: 3, lineTotal: 30 });
  });

  test("filters ingredients while typing and selects the matching result", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "دقيق" }));
    await user.type(screen.getByPlaceholderText("ابحث..."), "سكر");
    await user.click(screen.getByRole("option", { name: "سكر" }));

    const [quantity, lineTotal] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "2");
    await user.type(lineTotal, "50");
    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createIngredientPurchase).toHaveBeenCalledTimes(1));
    expect(createIngredientPurchase.mock.calls[0][0].lines[0].ingredientId).toBe(12);
  });

  test("shows a read-only invoice total summed from all line totals", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByText("إجمالي الفاتورة")).toBeInTheDocument();
    expect(screen.getByText("0.000")).toBeInTheDocument();

    let inputs = screen.getAllByRole("spinbutton");
    await user.type(inputs[1], "30");
    expect(screen.getByText("30.000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ بند" }));

    inputs = screen.getAllByRole("spinbutton");
    await user.type(inputs[1], "80");
    expect(screen.getByText("110.000")).toBeInTheDocument();
  });
});
