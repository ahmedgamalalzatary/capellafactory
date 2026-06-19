import { describe, expect, test, vi } from "vitest";

import { loadLocalDraft, saveLocalDraft } from "@/lib/local-drafts";

describe("local drafts", () => {
  test("returns null and clears invalid stored drafts that fail validation", () => {
    window.localStorage.setItem("draft", JSON.stringify({ amount: 5 }));

    const result = loadLocalDraft("draft", (value): value is { amount: string } => {
      return (
        typeof value === "object" &&
        value !== null &&
        "amount" in value &&
        typeof value.amount === "string"
      );
    });

    expect(result).toBeNull();
    expect(window.localStorage.getItem("draft")).toBeNull();
  });

  test("swallows storage errors while saving drafts", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

    expect(() => saveLocalDraft("draft", { amount: "5" })).not.toThrow();

    setItem.mockRestore();
  });
});
