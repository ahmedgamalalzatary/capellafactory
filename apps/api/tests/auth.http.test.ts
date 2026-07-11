import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "../src/app.js";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const previous = {
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD,
    secret: process.env.AUTH_SECRET,
  };
  process.env.AUTH_USERNAME = "admin";
  process.env.AUTH_PASSWORD = "secret";
  process.env.AUTH_SECRET = "test-secret";

  const server = createServer(createApp());
  server.listen(0);
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Expected server to listen on an ephemeral port");
  }

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
    restoreEnv("AUTH_USERNAME", previous.username);
    restoreEnv("AUTH_PASSWORD", previous.password);
    restoreEnv("AUTH_SECRET", previous.secret);
  }
}

test("login rejects invalid credentials with Arabic message", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      message: "بيانات الدخول غير صحيحة",
    });
  });
});

test("protected resource routes reject requests without session cookie", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/suppliers`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "غير مصرح لك" });
  });
});

test("protected resource routes reject missing session before reading auth env", async () => {
  const previous = {
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD,
    secret: process.env.AUTH_SECRET,
  };
  delete process.env.AUTH_USERNAME;
  delete process.env.AUTH_PASSWORD;
  delete process.env.AUTH_SECRET;

  const server = createServer(createApp());
  server.listen(0);
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Expected server to listen on an ephemeral port");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/suppliers`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "غير مصرح لك" });
  } finally {
    server.close();
    await once(server, "close");
    restoreEnv("AUTH_USERNAME", previous.username);
    restoreEnv("AUTH_PASSWORD", previous.password);
    restoreEnv("AUTH_SECRET", previous.secret);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
