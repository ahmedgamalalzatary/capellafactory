import test from "node:test";
import assert from "node:assert/strict";
import {
  BuyerLockedError,
  DuplicateBuyerPhoneError,
  mapBuyerRowToBuyer,
  normalizeBuyerSearchQuery,
  toDatabaseError,
} from "../src/modules/buyers/buyers.repository.js";

test("maps buyer rows into shared buyer shape", () => {
  const buyer = mapBuyerRowToBuyer({
    id: 4,
    name: "Nile Trading",
    phone: "+20 111 111 1111",
    where: "Giza",
    notes: "Key wholesale buyer",
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(buyer, {
    id: 4,
    name: "Nile Trading",
    phone: "+20 111 111 1111",
    where: "Giza",
    notes: "Key wholesale buyer",
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps null optional fields to undefined", () => {
  const buyer = mapBuyerRowToBuyer({
    id: 5,
    name: "Delta Stores",
    phone: "+20 122 222 2222",
    where: null,
    notes: null,
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(buyer, {
    id: 5,
    name: "Delta Stores",
    phone: "+20 122 222 2222",
    where: undefined,
    notes: undefined,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps mysql duplicate key errors to DuplicateBuyerPhoneError", () => {
  const mysqlError = {
    code: "ER_DUP_ENTRY",
    sqlMessage: "Duplicate entry '+20 111 111 1111' for key 'buyers.phone'",
  } as unknown as NodeJS.ErrnoException;

  const error = toDatabaseError(mysqlError);

  assert.ok(error instanceof DuplicateBuyerPhoneError);
  assert.equal(error.message, "Buyer phone must be unique");
});

test("passes through unknown database errors", () => {
  const mysqlError = {
    code: "SOME_OTHER_ERROR",
    sqlMessage: "Something else happened",
  } as unknown as NodeJS.ErrnoException;

  const error = toDatabaseError(mysqlError);

  assert.equal(error, mysqlError);
});

test("normalizes buyer search query", () => {
  assert.equal(normalizeBuyerSearchQuery(undefined), undefined);
  assert.equal(normalizeBuyerSearchQuery(""), undefined);
  assert.equal(normalizeBuyerSearchQuery("   "), undefined);
  assert.equal(normalizeBuyerSearchQuery("  Nile  "), "Nile");
});

test("buyer locked error explains sales invoice history lock", () => {
  const error = new BuyerLockedError();

  assert.equal(
    error.message,
    "Buyer cannot be modified or deleted after it has sales invoice history",
  );
});
