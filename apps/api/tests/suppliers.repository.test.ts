import test from "node:test";
import assert from "node:assert/strict";
import {
  DuplicateSupplierPhoneError,
  SupplierHasPurchaseHistoryError,
  mapSupplierRowToSupplier,
  normalizeSupplierSearchQuery,
  toDatabaseError,
} from "../src/modules/suppliers/suppliers.repository.js";

test("maps supplier rows into shared supplier shape", () => {
  const supplier = mapSupplierRowToSupplier({
    id: 4,
    name: "Cairo Plastics",
    phone: "+20 111 111 1111",
    where: "Giza",
    notes: "Packaging supplier",
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(supplier, {
    id: 4,
    name: "Cairo Plastics",
    phone: "+20 111 111 1111",
    where: "Giza",
    notes: "Packaging supplier",
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps null optional fields to undefined", () => {
  const supplier = mapSupplierRowToSupplier({
    id: 5,
    name: "Alex Metals",
    phone: "+20 122 222 2222",
    where: null,
    notes: null,
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(supplier, {
    id: 5,
    name: "Alex Metals",
    phone: "+20 122 222 2222",
    where: undefined,
    notes: undefined,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps mysql duplicate key errors to DuplicateSupplierPhoneError", () => {
  const mysqlError = {
    code: "ER_DUP_ENTRY",
    sqlMessage: "Duplicate entry '+20 111 111 1111' for key 'suppliers.phone'",
  } as unknown as NodeJS.ErrnoException;

  const error = toDatabaseError(mysqlError);

  assert.ok(error instanceof DuplicateSupplierPhoneError);
  assert.equal(error.message, "رقم هاتف المورد مستخدم بالفعل");
});

test("maps mysql restricted-delete errors to SupplierHasPurchaseHistoryError", () => {
  const mysqlError = {
    code: "ER_ROW_IS_REFERENCED_2",
    sqlMessage:
      "Cannot delete or update a parent row: a foreign key constraint fails (`capella`.`ingredient_purchases`, CONSTRAINT ...)",
  } as unknown as NodeJS.ErrnoException;

  const error = toDatabaseError(mysqlError);

  assert.ok(error instanceof SupplierHasPurchaseHistoryError);
});

test("passes through unknown database errors", () => {
  const mysqlError = {
    code: "SOME_OTHER_ERROR",
    sqlMessage: "Something else happened",
  } as unknown as NodeJS.ErrnoException;

  const error = toDatabaseError(mysqlError);

  assert.equal(error, mysqlError);
});

test("normalizes supplier search query", () => {
  assert.equal(normalizeSupplierSearchQuery(undefined), undefined);
  assert.equal(normalizeSupplierSearchQuery(""), undefined);
  assert.equal(normalizeSupplierSearchQuery("   "), undefined);
  assert.equal(normalizeSupplierSearchQuery("  Cairo  "), "Cairo");
});
