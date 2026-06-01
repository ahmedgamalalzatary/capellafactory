import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "../src/app.js";

test("responds to supplier CORS preflight requests", async () => {
  process.env.CORS_ORIGIN = "http://localhost:3000";

  const server = createServer(createApp());
  server.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Expected server to listen on an ephemeral port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/suppliers`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    assert.match(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/,
    );
    assert.match(
      response.headers.get("access-control-allow-headers") ?? "",
      /content-type/i,
    );
  } finally {
    server.close();
    await once(server, "close");
    delete process.env.CORS_ORIGIN;
  }
});

test("responds to buyer CORS preflight requests", async () => {
  process.env.CORS_ORIGIN = "http://localhost:3000";

  const server = createServer(createApp());
  server.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Expected server to listen on an ephemeral port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/buyers`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    assert.match(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/,
    );
    assert.match(
      response.headers.get("access-control-allow-headers") ?? "",
      /content-type/i,
    );
  } finally {
    server.close();
    await once(server, "close");
    delete process.env.CORS_ORIGIN;
  }
});

test("responds to ingredient purchase CORS preflight requests", async () => {
  process.env.CORS_ORIGIN = "http://localhost:3000";

  const server = createServer(createApp());
  server.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Expected server to listen on an ephemeral port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/ingredient-purchases`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    assert.match(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/,
    );
    assert.match(
      response.headers.get("access-control-allow-headers") ?? "",
      /content-type/i,
    );
  } finally {
    server.close();
    await once(server, "close");
    delete process.env.CORS_ORIGIN;
  }
});

test("responds to production batch CORS preflight requests", async () => {
  process.env.CORS_ORIGIN = "http://localhost:3000";

  const server = createServer(createApp());
  server.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Expected server to listen on an ephemeral port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/production-batches`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    assert.match(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/,
    );
    assert.match(
      response.headers.get("access-control-allow-headers") ?? "",
      /content-type/i,
    );
  } finally {
    server.close();
    await once(server, "close");
    delete process.env.CORS_ORIGIN;
  }
});
