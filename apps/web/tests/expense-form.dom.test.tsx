import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createExpense = vi.fn();
const addExpensePayment = vi.fn();
const routerRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/api/expenses", () => ({
  createExpense: (...args: unknown[]) => createExpense(...args),
  addExpensePayment: (...args: unknown[]) => addExpensePayment(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

import { ExpenseForm } from "@/components/purchases/expenses/expense-form";
import { PaymentForm } from "@/components/payments/payment-form";

describe("ExpenseForm (behavioral)", () => {
  beforeEach(() => {
    createExpense.mockReset().mockResolvedValue(undefined);
    addExpensePayment.mockReset().mockResolvedValue(undefined);
    routerRefresh.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    localStorage.clear();
  });

  test("submits total amount and partial paid amount with payment method", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    await user.type(screen.getByLabelText(/إجمالي المصروف/), "40000");
    await user.type(screen.getByLabelText(/المدفوع/), "37000");
    await user.selectOptions(screen.getByLabelText(/طريقة الدفع/), "instapay");

    expect(screen.getByText("3,000.000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "حفظ المصروف" }));

    await waitFor(() => expect(createExpense).toHaveBeenCalledTimes(1));
    expect(createExpense.mock.calls[0][0]).toMatchObject({
      amount: 40000,
      paidAmount: 37000,
      paymentMethod: "instapay",
    });
  });

  test("hides payment method when paid amount is zero", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    await user.type(screen.getByLabelText(/إجمالي المصروف/), "40000");
    await user.type(screen.getByLabelText(/المدفوع/), "0");

    expect(screen.queryByLabelText(/طريقة الدفع/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "حفظ المصروف" }));

    await waitFor(() => expect(createExpense).toHaveBeenCalledTimes(1));
    expect(createExpense.mock.calls[0][0]).toMatchObject({
      amount: 40000,
      paidAmount: 0,
    });
    expect(createExpense.mock.calls[0][0].paymentMethod).toBeUndefined();
  });

  test("submits additional expense payment within remaining amount", async () => {
    const user = userEvent.setup();
    render(
      <PaymentForm
        remainingAmount={4000}
        onSubmitPayment={(payload) => addExpensePayment(7, payload)}
      />,
    );

    await user.type(screen.getByLabelText(/المبلغ المدفوع/), "4000");
    await user.selectOptions(screen.getByLabelText(/طريقة الدفع/), "instapay");
    await user.click(screen.getByRole("button", { name: "تسجيل الدفعة" }));

    await waitFor(() => expect(addExpensePayment).toHaveBeenCalledTimes(1));
    expect(addExpensePayment).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        amount: 4000,
        paymentMethod: "instapay",
      }),
    );
  });
});
