import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createBuyer = vi.fn();
const updateBuyer = vi.fn();
const createSupplier = vi.fn();
const createProduct = vi.fn();
const routerRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));
vi.mock("@/lib/api/buyers", () => ({
  createBuyer: (...a: unknown[]) => createBuyer(...a),
  updateBuyer: (...a: unknown[]) => updateBuyer(...a),
}));
vi.mock("@/lib/api/suppliers", () => ({
  createSupplier: (...a: unknown[]) => createSupplier(...a),
  updateSupplier: vi.fn(),
}));
vi.mock("@/lib/api/products", () => ({
  createProduct: (...a: unknown[]) => createProduct(...a),
  updateProduct: vi.fn(),
}));

import { BuyerForm } from "@/components/buyers/buyer-form";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { ProductForm } from "@/components/inventory/product-form";

beforeEach(() => {
  for (const m of [createBuyer, updateBuyer, createSupplier, createProduct]) {
    m.mockReset().mockResolvedValue({ id: 1 });
  }
  routerRefresh.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe("BuyerForm", () => {
  test("create mode: submits the trimmed payload and omits blank optionals", async () => {
    const user = userEvent.setup();
    render(<BuyerForm />);

    await user.type(screen.getByLabelText(/الاسم/), "  شركة النيل  ");
    await user.type(screen.getByLabelText(/الهاتف/), "+20100");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(createBuyer).toHaveBeenCalledTimes(1));
    expect(createBuyer.mock.calls[0][0]).toEqual({
      name: "شركة النيل", // trimmed
      phone: "+20100",
      where: undefined, // blank optional -> undefined
      notes: undefined,
    });
    expect(toastSuccess).toHaveBeenCalled();
    expect(routerRefresh).toHaveBeenCalled();
  });

  test("edit mode: calls updateBuyer with the id, not createBuyer", async () => {
    const user = userEvent.setup();
    render(
      <BuyerForm
        buyerId={42}
        initialValues={{ name: "قديم", phone: "1" }}
        submitLabel="تحديث"
      />,
    );

    await user.click(screen.getByRole("button", { name: "تحديث" }));

    await waitFor(() => expect(updateBuyer).toHaveBeenCalledTimes(1));
    expect(updateBuyer.mock.calls[0][0]).toBe(42);
    expect(createBuyer).not.toHaveBeenCalled();
  });

  test("surfaces the api error as a toast", async () => {
    createBuyer.mockRejectedValue(new Error("phone taken"));
    const user = userEvent.setup();
    render(<BuyerForm />);

    await user.type(screen.getByLabelText(/الاسم/), "x");
    await user.type(screen.getByLabelText(/الهاتف/), "1");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("phone taken"));
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});

describe("SupplierForm", () => {
  test("create mode: submits name + phone and trims optionals", async () => {
    const user = userEvent.setup();
    render(<SupplierForm />);

    await user.type(screen.getByLabelText(/الاسم/), "مصنع");
    await user.type(screen.getByLabelText(/الهاتف/), "+2099");
    await user.type(screen.getByLabelText(/الموقع/), " طنطا ");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(createSupplier).toHaveBeenCalledTimes(1));
    expect(createSupplier.mock.calls[0][0]).toMatchObject({
      name: "مصنع",
      phone: "+2099",
      where: "طنطا", // trimmed, kept
    });
  });
});

describe("ProductForm", () => {
  test("create mode: submits only the product name", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(screen.getByLabelText(/اسم المنتج/), "شراب برتقال");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1));
    expect(createProduct.mock.calls[0][0]).toEqual({ name: "شراب برتقال" });
    expect(toastSuccess).toHaveBeenCalled();
  });
});
