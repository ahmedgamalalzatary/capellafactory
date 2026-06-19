import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { IngredientPurchase } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";

const createPurchaseCorrection = vi.fn();
const routerRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/api/purchase-corrections", () => ({
  createPurchaseCorrection: (...args: unknown[]) => createPurchaseCorrection(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

import { PurchaseCorrectionForm } from "@/components/purchases/purchase-correction/purchase-correction-form";

const ingredients: Ingredient[] = [
  { id: 11, name: "دقيق", unitFamily: "weight" } as Ingredient,
];

const purchases: IngredientPurchase[] = [
  {
    id: 1,
    invoiceCode: "INV-001",
    lines: [{ id: 101, ingredientId: 11, quantity: 5, unit: "kg", unitPrice: 10 }],
  } as IngredientPurchase,
  {
    id: 2,
    invoiceCode: "INV-ABC",
    lines: [{ id: 202, ingredientId: 11, quantity: 3, unit: "kg", unitPrice: 12 }],
  } as IngredientPurchase,
];

function renderForm() {
  return render(<PurchaseCorrectionForm purchases={purchases} ingredients={ingredients} />);
}

describe("PurchaseCorrectionForm (behavioral)", () => {
  beforeEach(() => {
    createPurchaseCorrection.mockReset().mockResolvedValue(undefined);
    routerRefresh.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  test("filters purchase invoice codes while typing and submits the chosen invoice", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "INV-001" }));
    await user.type(screen.getByPlaceholderText("ابحث..."), "ABC");
    await user.click(screen.getByRole("option", { name: "INV-ABC" }));

    await user.type(screen.getByLabelText("سبب العكس"), "مرتجع");
    await user.type(screen.getByRole("spinbutton"), "2");
    await user.click(screen.getByRole("button", { name: "حفظ عكس الشراء" }));

    await waitFor(() => expect(createPurchaseCorrection).toHaveBeenCalledTimes(1));
    expect(createPurchaseCorrection.mock.calls[0][0]).toMatchObject({
      sourcePurchaseId: 2,
      reason: "مرتجع",
      lines: [{ sourcePurchaseLineId: 202, quantity: 2 }],
    });
  });
});
