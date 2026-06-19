import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Ingredient } from "@capella/shared/ingredients/ingredient.types";
import type { Product } from "@capella/shared/products/product.types";

const createProductionBatch = vi.fn();
const routerRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/api/production-batches", () => ({
  createProductionBatch: (...args: unknown[]) => createProductionBatch(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

import { ProductionBatchForm } from "@/components/production/production-batch-form";

const products: Product[] = [
  { id: 5, name: "كيك" } as Product,
  { id: 9, name: "بسكويت" } as Product,
];

const ingredients: Ingredient[] = [
  { id: 11, name: "دقيق", unitFamily: "weight" } as Ingredient,
  { id: 12, name: "سكر", unitFamily: "weight" } as Ingredient,
];

function renderForm() {
  return render(<ProductionBatchForm products={products} ingredients={ingredients} />);
}

describe("ProductionBatchForm (behavioral)", () => {
  beforeEach(() => {
    createProductionBatch.mockReset().mockResolvedValue(undefined);
    routerRefresh.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  test("submits product, produced quantity, and ingredient lines", async () => {
    const user = userEvent.setup();
    renderForm();

    // spinbuttons in DOM order: [producedQuantity, line1 quantity]
    const [producedQuantity, lineQuantity] = screen.getAllByRole("spinbutton");
    await user.type(producedQuantity, "10");
    await user.type(lineQuantity, "25");

    await user.click(screen.getByRole("button", { name: "حفظ التشغيلة" }));

    await waitFor(() => expect(createProductionBatch).toHaveBeenCalledTimes(1));
    const payload = createProductionBatch.mock.calls[0][0];
    expect(payload).toMatchObject({
      productId: 5, // first product is the default
      producedQuantity: 10,
    });
    expect(payload.lines).toHaveLength(1);
    expect(payload.lines[0]).toMatchObject({ ingredientId: 11, quantity: 25, unit: "kg" });
    expect(toastSuccess).toHaveBeenCalled();
  });

  test("uses the chosen product and auto-picks a distinct ingredient for an added line", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "كيك" }));
    await user.click(screen.getByRole("option", { name: "بسكويت" }));
    await user.click(screen.getByRole("button", { name: "+ خامة" }));

    // [producedQuantity, line1 quantity, line2 quantity]
    const [producedQuantity, line1, line2] = screen.getAllByRole("spinbutton");
    await user.type(producedQuantity, "8");
    await user.type(line1, "5");
    await user.type(line2, "7");

    await user.click(screen.getByRole("button", { name: "حفظ التشغيلة" }));

    await waitFor(() => expect(createProductionBatch).toHaveBeenCalledTimes(1));
    const payload = createProductionBatch.mock.calls[0][0];
    expect(payload.productId).toBe(9);
    expect(payload.lines).toHaveLength(2);
    // The second line auto-selects the unused ingredient (12), never duplicating 11.
    expect(payload.lines.map((l: { ingredientId: number }) => l.ingredientId)).toEqual([11, 12]);
  });

  test("blocks duplicating an ingredient: already-used option is disabled on the second line", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "+ خامة" }));
    await user.click(screen.getByRole("button", { name: "سكر" }));

    const optionFor11 = screen.getByRole("option", { name: "دقيق" });
    expect(optionFor11).toBeDisabled();
  });

  test("keeps at least one ingredient line (removing the sole line is a no-op)", async () => {
    const user = userEvent.setup();
    renderForm();

    // Only one line → one line-quantity spinbutton besides producedQuantity (2 total).
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "حذف البند" }));
    // Still present — removeLine refuses to drop the last line.
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  });

  test("filters products and ingredients while typing and submits the chosen matches", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "كيك" }));
    await user.type(screen.getByPlaceholderText("ابحث..."), "بسكويت");
    await user.click(screen.getByRole("option", { name: "بسكويت" }));

    await user.click(screen.getByRole("button", { name: "دقيق" }));
    await user.type(screen.getByPlaceholderText("ابحث..."), "سكر");
    await user.click(screen.getByRole("option", { name: "سكر" }));

    const [producedQuantity, lineQuantity] = screen.getAllByRole("spinbutton");
    await user.type(producedQuantity, "8");
    await user.type(lineQuantity, "6");
    await user.click(screen.getByRole("button", { name: "حفظ التشغيلة" }));

    await waitFor(() => expect(createProductionBatch).toHaveBeenCalledTimes(1));
    const payload = createProductionBatch.mock.calls[0][0];
    expect(payload.productId).toBe(9);
    expect(payload.lines[0].ingredientId).toBe(12);
  });
});
