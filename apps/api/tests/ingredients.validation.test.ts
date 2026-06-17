import test from "node:test";
import assert from "node:assert/strict";
import { updateIngredientSchema } from "../src/modules/ingredients/ingredients.validation.js";

test("update ingredient accepts archive flag changes", () => {
  const result = updateIngredientSchema.safeParse({
    isArchived: true,
  });

  assert.equal(result.success, true);
});
