import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  deleteSupplierHandler,
  getSupplierHandler,
  updateSupplierHandler,
} from "../src/modules/suppliers/suppliers.controller.js";

function createResponseDouble() {
  let statusCode = 200;
  let jsonBody: unknown;

  const response = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(body: unknown) {
      jsonBody = body;
      return response;
    },
    send() {
      return response;
    },
  } as Partial<Response>;

  return {
    response: response as Response,
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
  };
}

test("getSupplierHandler rejects non-numeric ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "abc" } } as Partial<Request>;

  await getSupplierHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "معرّف المورد غير صالح" });
});

test("updateSupplierHandler rejects non-positive ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "0" }, body: {} } as Partial<Request>;

  await updateSupplierHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "معرّف المورد غير صالح" });
});

test("deleteSupplierHandler rejects non-integer ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "1.5" } } as Partial<Request>;

  await deleteSupplierHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "معرّف المورد غير صالح" });
});
