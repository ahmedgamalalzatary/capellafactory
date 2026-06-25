import test from "node:test";
import assert from "node:assert/strict";
import {
  mapSolidAssetRowToSolidAsset,
  normalizeSolidAssetSearchQuery,
} from "../src/modules/solid-assets/solid-assets.repository.js";

test("maps solid asset rows into shared solid asset shape with derived total price", () => {
  const asset = mapSolidAssetRowToSolidAsset({
    id: 3,
    name: "Forklift",
    qty: 2,
    priceOfOne: "150000.500",
    createdAt: new Date("2026-06-25T08:00:00.000Z"),
    updatedAt: new Date("2026-06-25T09:00:00.000Z"),
  });

  assert.deepEqual(asset, {
    id: 3,
    name: "Forklift",
    qty: 2,
    priceOfOne: 150000.5,
    totalPrice: 300001,
    createdAt: "2026-06-25T08:00:00.000Z",
    updatedAt: "2026-06-25T09:00:00.000Z",
  });
  assert.equal("totalPrice" in asset, true);
});

test("normalizes solid asset search query", () => {
  assert.equal(normalizeSolidAssetSearchQuery(undefined), undefined);
  assert.equal(normalizeSolidAssetSearchQuery(""), undefined);
  assert.equal(normalizeSolidAssetSearchQuery("   "), undefined);
  assert.equal(normalizeSolidAssetSearchQuery("  fork  "), "fork");
});
