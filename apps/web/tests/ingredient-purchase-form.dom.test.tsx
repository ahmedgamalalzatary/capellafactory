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

    // First combobox is the supplier select (others are per-line ingredient/unit).
    await user.selectOptions(screen.getAllByRole("combobox")[0], "7");
    const [quantity, lineTotal] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "2");
    await user.type(lineTotal, "50");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createIngredientPurchase).toHaveBeenCalledTimes(1));
    expect(createIngredientPurchase.mock.calls[0][0].supplierId).toBe(7);
  });

  test("adds a second line and submits both in the payload", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "+ بند" }));

    // After adding a line there are 4 number inputs: [qty1, total1, qty2, total2].
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(4);
    await user.type(inputs[0], "3");
    await user.type(inputs[1], "30");
    await user.type(inputs[2], "4");
    await user.type(inputs[3], "80");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createIngredientPurchase).toHaveBeenCalledTimes(1));
    const { lines } = createIngredientPurchase.mock.calls[0][0];
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ quantity: 3, lineTotal: 30 });
    expect(lines[1]).toMatchObject({ quantity: 4, lineTotal: 80 });
  });
});
