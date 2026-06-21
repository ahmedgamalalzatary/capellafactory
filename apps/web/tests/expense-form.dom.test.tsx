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

  test("submits total amount and partial paid amount as payments array", async () => {
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
      payments: [
        expect.objectContaining({
          amount: 37000,
          paymentMethod: "instapay",
        }),
      ],
    });
  });

  test("submits no payments when all payment rows are zero", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    await user.type(screen.getByLabelText(/إجمالي المصروف/), "40000");
    await user.type(screen.getByLabelText(/المدفوع/), "0");

    await user.click(screen.getByRole("button", { name: "حفظ المصروف" }));

    await waitFor(() => expect(createExpense).toHaveBeenCalledTimes(1));
    expect(createExpense.mock.calls[0][0]).toMatchObject({
      amount: 40000,
      payments: [],
    });
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

  test("applies tax then discount and submits multiple payments", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    await user.type(screen.getByLabelText(/إجمالي المصروف/), "40000");
    await user.click(screen.getByRole("checkbox", { name: /تفعيل الضريبة/ }));
    await user.selectOptions(screen.getByLabelText(/نوع الضريبة/), "percentage");
    await user.type(screen.getByLabelText(/قيمة الضريبة/), "10");
    await user.click(screen.getByRole("checkbox", { name: /تفعيل الخصم/ }));
    await user.selectOptions(screen.getByLabelText(/نوع الخصم/), "amount");
    await user.type(screen.getByLabelText(/قيمة الخصم/), "2000");

    expect(screen.getAllByText("42,000.000").length).toBeGreaterThanOrEqual(1);

    await user.type(screen.getByLabelText(/المدفوع/), "30000");
    await user.selectOptions(screen.getByLabelText(/طريقة الدفع/), "cod");
    await user.click(screen.getByRole("button", { name: /إضافة دفعة/ }));
    await user.type(screen.getAllByLabelText(/المدفوع/)[1], "5000");
    await user.selectOptions(screen.getAllByLabelText(/طريقة الدفع/)[1], "vodafone_cash");

    await user.click(screen.getByRole("button", { name: "حفظ المصروف" }));

    await waitFor(() => expect(createExpense).toHaveBeenCalledTimes(1));
    expect(createExpense.mock.calls[0][0]).toMatchObject({
      taxState: "active",
      taxType: "percentage",
      taxValue: 10,
      discountState: "active",
      discountType: "amount",
      discountValue: 2000,
      payments: [
        expect.objectContaining({ amount: 30000, paymentMethod: "cod" }),
        expect.objectContaining({ amount: 5000, paymentMethod: "vodafone_cash" }),
      ],
    });
  });
});
