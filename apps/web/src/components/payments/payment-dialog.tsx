"use client";

import { useState } from "react";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentForm } from "./payment-form";

type PaymentDialogProps = {
  remainingAmount: number;
  onSubmitPayment: (input: AdditionalPaymentInput) => Promise<unknown>;
  title: string;
  description: string;
  triggerLabel?: string;
};

export function PaymentDialog({
  remainingAmount,
  onSubmitPayment,
  title,
  description,
  triggerLabel = "إضافة دفعة",
}: PaymentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <PaymentForm
            remainingAmount={remainingAmount}
            onSubmitPayment={onSubmitPayment}
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
