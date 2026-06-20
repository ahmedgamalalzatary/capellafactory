import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import type { Product } from "@capella/shared/products/product.types";

const createSalesInvoice = vi.fn();
const routerRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/api/sales-invoices", () => ({
  createSalesInvoice: (...args: unknown[]) => createSalesInvoice(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

import { SalesInvoiceForm } from "@/components/sales/sales-invoice-form";

const buyers: Buyer[] = [
  { id: 7, name: "شركة النيل", phone: "0100" } as Buyer,
  { id: 8, name: "دلتا", phone: "0111" } as Buyer,
];

const products: Product[] = [
  { id: 5, name: "كيك", stockQuantity: 12, averageUnitCost: 3.5 } as Product,
  { id: 9, name: "بسكويت", stockQuantity: 4, averageUnitCost: 2.25 } as Product,
];

function renderForm() {
  return render(<SalesInvoiceForm buyers={buyers} products={products} />);
}

describe("SalesInvoiceForm (behavioral)", () => {
  beforeEach(() => {
    createSalesInvoice.mockReset().mockResolvedValue(undefined);
    routerRefresh.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  test("submits a saved buyer and derives line totals from quantity and selling price", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /شركة النيل/ }));
    await user.click(screen.getByRole("option", { name: /دلتا - 0111/ }));
    const [quantity, sellingUnitPrice] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "3");
    await user.type(sellingUnitPrice, "12.5");
    await user.type(screen.getByLabelText(/المدفوع/), "0");

    expect(screen.getAllByText("37.500").length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createSalesInvoice).toHaveBeenCalledTimes(1));
    const payload = createSalesInvoice.mock.calls[0][0];
    expect(payload).toMatchObject({ buyerId: 8 });
    expect(payload.lines).toEqual([{ productId: 5, quantity: 3, sellingUnitPrice: 12.5 }]);
    expect(toastSuccess).toHaveBeenCalled();
  });

  test("adding a second line auto-picks a different product and prevents duplicates", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "+ منتج" }));
    await user.click(screen.getAllByRole("button", { name: /بسكويت - متاح 4/ })[0]);
    expect(screen.getByRole("option", { name: /كيك - متاح 12/ })).toBeDisabled();

    const spinbuttons = screen.getAllByRole("spinbutton");
    await user.type(spinbuttons[0], "1");
    await user.type(spinbuttons[1], "10");
    await user.type(spinbuttons[2], "2");
    await user.type(spinbuttons[3], "20");
    await user.type(screen.getByLabelText(/المدفوع/), "0");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createSalesInvoice).toHaveBeenCalledTimes(1));
    const payload = createSalesInvoice.mock.calls[0][0];
    expect(payload.lines.map((line: { productId: number }) => line.productId)).toEqual([5, 9]);
  });

  test("keeps entered values when the API rejects the invoice", async () => {
    const user = userEvent.setup();
    createSalesInvoice.mockRejectedValueOnce(new Error("stock low"));
    renderForm();

    const notes = screen.getByLabelText(/ملاحظات/);
    const [quantity, sellingUnitPrice] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "2");
    await user.type(sellingUnitPrice, "50");
    await user.type(screen.getByLabelText(/المدفوع/), "0");
    await user.type(notes, "urgent");

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("stock low"));
    expect(quantity).toHaveValue(2);
    expect(sellingUnitPrice).toHaveValue(50);
    expect(notes).toHaveValue("urgent");
  });

  test("filters buyers and products while typing and submits the chosen matches", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /شركة النيل/ }));
    await user.type(screen.getByPlaceholderText("ابحث..."), "دلتا");
    await user.click(screen.getByRole("option", { name: /دلتا - 0111/ }));

    await user.click(screen.getByRole("button", { name: /كيك/ }));
    await user.type(screen.getByPlaceholderText("ابحث..."), "بسكويت");
    await user.click(screen.getByRole("option", { name: /بسكويت - متاح 4/ }));

    const [quantity, sellingUnitPrice] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "3");
    await user.type(sellingUnitPrice, "12");
    await user.type(screen.getByLabelText(/المدفوع/), "0");
    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createSalesInvoice).toHaveBeenCalledTimes(1));
    const payload = createSalesInvoice.mock.calls[0][0];
    expect(payload.buyerId).toBe(8);
    expect(payload.lines[0].productId).toBe(9);
  });

  test("submits partial payment details and shows remaining amount", async () => {
    const user = userEvent.setup();
    renderForm();

    const [quantity, sellingUnitPrice] = screen.getAllByRole("spinbutton");
    await user.type(quantity, "4");
    await user.type(sellingUnitPrice, "25");
    await user.type(screen.getByLabelText(/المدفوع/), "75");
    await user.selectOptions(screen.getByLabelText(/طريقة الدفع/), "visa");

    expect(screen.getByText("25.000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "حفظ الفاتورة" }));

    await waitFor(() => expect(createSalesInvoice).toHaveBeenCalledTimes(1));
    expect(createSalesInvoice.mock.calls[0][0]).toMatchObject({
      paidAmount: 75,
      paymentMethod: "visa",
    });
  });
});
