import { describe, expect, test, vi } from "vitest";

import {
  listLocalDraftEntries,
  loadLocalDraft,
  removeLocalDraftEntry,
  saveLocalDraft,
  saveLocalDraftEntry,
} from "@/lib/local-drafts";

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

  test("stores multiple draft entries and returns them newest first", () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(200);

    const first = saveLocalDraftEntry("drafts", { amount: "5" });
    const second = saveLocalDraftEntry("drafts", { amount: "8" });

    const result = listLocalDraftEntries("drafts", (value): value is { amount: string } => {
      return (
        typeof value === "object" &&
        value !== null &&
        "amount" in value &&
        typeof value.amount === "string"
      );
    });

    expect(result).toHaveLength(2);
    expect(result.map((entry) => entry.id)).toEqual([second.id, first.id]);
    expect(result.map((entry) => entry.data.amount)).toEqual(["8", "5"]);
  });

  test("updates an existing draft entry in place", () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(300);

    const created = saveLocalDraftEntry("drafts", { amount: "5" });
    const updated = saveLocalDraftEntry("drafts", { amount: "7" }, created.id);

    const result = listLocalDraftEntries("drafts", (value): value is { amount: string } => {
      return (
        typeof value === "object" &&
        value !== null &&
        "amount" in value &&
        typeof value.amount === "string"
      );
    });

    expect(updated.id).toBe(created.id);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: created.id,
      updatedAt: 300,
      data: { amount: "7" },
    });
  });

  test("removes a single draft entry without clearing the rest", () => {
    const first = saveLocalDraftEntry("drafts", { amount: "5" });
    const second = saveLocalDraftEntry("drafts", { amount: "8" });

    removeLocalDraftEntry("drafts", first.id);

    const result = listLocalDraftEntries("drafts", (value): value is { amount: string } => {
      return (
        typeof value === "object" &&
        value !== null &&
        "amount" in value &&
        typeof value.amount === "string"
      );
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(second.id);
  });

  test("falls back to a generated id when randomUUID throws", () => {
    const randomUuid = vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      throw new TypeError("randomUUID unavailable");
    });

    expect(() => saveLocalDraftEntry("drafts", { amount: "5" })).not.toThrow();

    const [entry] = listLocalDraftEntries("drafts", (value): value is { amount: string } => {
      return (
        typeof value === "object" &&
        value !== null &&
        "amount" in value &&
        typeof value.amount === "string"
      );
    });

    expect(entry.id).toMatch(/^draft-/);

    randomUuid.mockRestore();
  });
});
