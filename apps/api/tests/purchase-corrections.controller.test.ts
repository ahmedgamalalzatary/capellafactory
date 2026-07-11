import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  getPurchaseCorrectionHandler,
} from "../src/modules/purchase-corrections/purchase-corrections.controller.js";

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

test("getPurchaseCorrectionHandler rejects non-numeric ids", async () => {
  const result = createResponseDouble();
  const request = { params: { id: "abc" } } as Partial<Request>;

  await getPurchaseCorrectionHandler(request as Request, result.response);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.jsonBody, { message: "معرّف تصحيح الشراء غير صالح" });
});
