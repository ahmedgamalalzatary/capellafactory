import test from "node:test";
import assert from "node:assert/strict";
import { buyerInputSchema } from "../src/buyers/buyer.schema.js";

test("buyer input accepts required name and phone", () => {
  const result = buyerInputSchema.safeParse({
    name: "Nile Trading",
    phone: "+20 111 111 1111",
  });

  assert.equal(result.success, true);
});

test("buyer input rejects empty notes when provided", () => {
  const result = buyerInputSchema.safeParse({
    name: "Nile Trading",
    phone: "+20 111 111 1111",
    notes: "",
  });

  assert.equal(result.success, false);
});
