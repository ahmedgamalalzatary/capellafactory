import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  deleteBuyerHandler,
  getBuyerHandler,
  updateBuyerHandler,
} from "../src/modules/buyers/buyers.controller.js";

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

test("getBuyerHandler rejects non-numeric ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "abc" } } as Partial<Request>;

  await getBuyerHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "Invalid buyer id" });
});

test("updateBuyerHandler rejects non-positive ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "0" }, body: {} } as Partial<Request>;

  await updateBuyerHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "Invalid buyer id" });
});

test("deleteBuyerHandler rejects non-integer ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "1.5" } } as Partial<Request>;

  await deleteBuyerHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "Invalid id" });
});
