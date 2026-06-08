import { expect, test } from "vitest";
import { runWithSubmitLock } from "../src/lib/submit-lock.js";

test("runWithSubmitLock ignores a second submit while the first is pending", async () => {
  const lock = { current: false };
  const submittingStates: boolean[] = [];
  let calls = 0;
  let resolveFirstSubmit: (() => void) | undefined;

  const firstSubmit = runWithSubmitLock(lock, (state) => submittingStates.push(state), async () => {
    calls += 1;
    await new Promise<void>((resolve) => {
      resolveFirstSubmit = resolve;
    });
  });

  const secondSubmit = runWithSubmitLock(lock, (state) => submittingStates.push(state), async () => {
    calls += 1;
  });

  expect(calls).toBe(1);
  expect(submittingStates).toEqual([true]);

  resolveFirstSubmit?.();
  await Promise.all([firstSubmit, secondSubmit]);

  expect(calls).toBe(1);
  expect(lock.current).toBe(false);
  expect(submittingStates).toEqual([true, false]);
});
