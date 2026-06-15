import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthService,
  getCredentialFingerprint,
  hashSessionToken,
  type AdminRecord,
  type AuthRepository,
  type SessionRecord,
} from "../src/modules/auth/auth.service.js";

class FakeAuthRepository implements AuthRepository {
  admin: AdminRecord | null = null;
  sessions = new Map<string, SessionRecord>();
  staleFingerprintDeletes: string[] = [];

  async findAdminByUsername(username: string) {
    return this.admin?.username === username ? this.admin : null;
  }

  async createAdmin(input: { username: string; credentialFingerprint: string }) {
    this.admin = {
      id: 1,
      username: input.username,
      credentialFingerprint: input.credentialFingerprint,
    };
    return this.admin;
  }

  async updateAdmin(id: number, input: { username: string; credentialFingerprint: string }) {
    this.admin = {
      id,
      username: input.username,
      credentialFingerprint: input.credentialFingerprint,
    };
    return this.admin;
  }

  async deleteSessionsNotMatchingFingerprint(fingerprint: string) {
    this.staleFingerprintDeletes.push(fingerprint);
    for (const [tokenHash, session] of this.sessions) {
      if (session.credentialFingerprint !== fingerprint) {
        this.sessions.delete(tokenHash);
      }
    }
  }

  async createSession(input: {
    adminId: number;
    tokenHash: string;
    credentialFingerprint: string;
    expiresAt: Date;
  }) {
    const session = {
      id: 1,
      adminId: input.adminId,
      tokenHash: input.tokenHash,
      credentialFingerprint: input.credentialFingerprint,
      expiresAt: input.expiresAt,
    };
    this.sessions.set(input.tokenHash, session);
    return session;
  }

  async findSessionByTokenHash(tokenHash: string) {
    return this.sessions.get(tokenHash) ?? null;
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    this.sessions.delete(tokenHash);
  }
}

const env = {
  username: "admin",
  password: "secret",
  secret: "test-secret",
};

test("rejects invalid credentials", async () => {
  const repository = new FakeAuthRepository();
  const service = createAuthService(repository, env);

  const result = await service.login({ username: "admin", password: "wrong" });

  assert.equal(result.ok, false);
  assert.equal(repository.admin, null);
  assert.equal(repository.sessions.size, 0);
});

test("creates admin and hashed session for valid credentials", async () => {
  const repository = new FakeAuthRepository();
  const service = createAuthService(repository, env, {
    createToken: () => "raw-session-token",
    now: () => new Date("2026-06-15T10:00:00.000Z"),
  });

  const result = await service.login({ username: "admin", password: "secret" });

  assert.equal(result.ok, true);
  assert.equal(result.token, "raw-session-token");
  assert.equal(repository.admin?.username, "admin");
  assert.equal(repository.sessions.has("raw-session-token"), false);
  assert.equal(repository.sessions.has(hashSessionToken("raw-session-token", env.secret)), true);
});

test("returns current admin for a valid session", async () => {
  const repository = new FakeAuthRepository();
  const service = createAuthService(repository, env, {
    createToken: () => "raw-session-token",
    now: () => new Date("2026-06-15T10:00:00.000Z"),
  });

  const login = await service.login({ username: "admin", password: "secret" });
  assert.equal(login.ok, true);

  const session = await service.getSession(login.token);

  assert.deepEqual(session, { user: { username: "admin" } });
});

test("rejects sessions when env credentials changed", async () => {
  const repository = new FakeAuthRepository();
  const service = createAuthService(repository, env, {
    createToken: () => "raw-session-token",
    now: () => new Date("2026-06-15T10:00:00.000Z"),
  });

  const login = await service.login({ username: "admin", password: "secret" });
  assert.equal(login.ok, true);

  const changedService = createAuthService(
    repository,
    { ...env, password: "new-secret" },
    { now: () => new Date("2026-06-15T10:01:00.000Z") },
  );

  const session = await changedService.getSession(login.token);

  assert.equal(session, null);
});

test("deletes sessions during logout", async () => {
  const repository = new FakeAuthRepository();
  const service = createAuthService(repository, env, {
    createToken: () => "raw-session-token",
  });

  const login = await service.login({ username: "admin", password: "secret" });
  assert.equal(login.ok, true);

  await service.logout(login.token);

  assert.equal(repository.sessions.size, 0);
});

test("credential fingerprint does not expose password", () => {
  const fingerprint = getCredentialFingerprint(env);

  assert.notEqual(fingerprint.includes(env.password), true);
  assert.equal(fingerprint.length, 64);
});
