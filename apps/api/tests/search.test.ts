import test from "node:test";
import assert from "node:assert/strict";
import { escapeLike } from "../src/utils/search.js";

test("escapes SQL LIKE wildcard characters in search text", () => {
  assert.equal(escapeLike("100%_back\\slash"), "100\\%\\_back\\\\slash");
});
