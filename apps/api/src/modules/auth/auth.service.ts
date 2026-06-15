import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthEnvironment = {
  username: string;
  password: string;
  secret: string;
};

export type AdminRecord = {
  id: number;
  username: string;
  credentialFingerprint: string;
};

export type SessionRecord = {
  id: number;
  adminId: number;
  tokenHash: string;
  credentialFingerprint: string;
  expiresAt: Date;
};

export type AuthRepository = {
  findAdminByUsername(username: string): Promise<AdminRecord | null>;
  createAdmin(input: {
    username: string;
    credentialFingerprint: string;
  }): Promise<AdminRecord>;
  updateAdmin(
    id: number,
    input: { username: string; credentialFingerprint: string },
  ): Promise<AdminRecord>;
  deleteSessionsNotMatchingFingerprint(
    adminId: number,
    fingerprint: string,
  ): Promise<void>;
  createSession(input: {
    adminId: number;
    tokenHash: string;
    credentialFingerprint: string;
    expiresAt: Date;
  }): Promise<SessionRecord>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
};

type AuthServiceOptions = {
  createToken?: () => string;
  now?: () => Date;
};

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; user: { username: string } }
  | { ok: false };

export function createAuthService(
  repository: AuthRepository,
  env: AuthEnvironment,
  options: AuthServiceOptions = {},
) {
  const createToken =
    options.createToken ?? (() => randomBytes(32).toString("base64url"));
  const now = options.now ?? (() => new Date());

  async function syncAdmin() {
    const credentialFingerprint = getCredentialFingerprint(env);
    const existing = await repository.findAdminByUsername(env.username);

    const admin = existing
      ? existing.credentialFingerprint === credentialFingerprint
        ? existing
        : await repository.updateAdmin(existing.id, {
            username: env.username,
            credentialFingerprint,
          })
      : await repository.createAdmin({
          username: env.username,
          credentialFingerprint,
        });

    await repository.deleteSessionsNotMatchingFingerprint(
      admin.id,
      credentialFingerprint,
    );
    return admin;
  }

  return {
    async login(input: {
      username: string;
      password: string;
    }): Promise<LoginResult> {
      if (
        !safeEqual(input.username, env.username) ||
        !safeEqual(input.password, env.password)
      ) {
        return { ok: false };
      }

      const admin = await syncAdmin();
      const token = createToken();
      const expiresAt = new Date(now().getTime() + SESSION_DURATION_MS);

      await repository.createSession({
        adminId: admin.id,
        tokenHash: hashSessionToken(token, env.secret),
        credentialFingerprint: admin.credentialFingerprint,
        expiresAt,
      });

      return { ok: true, token, expiresAt, user: { username: admin.username } };
    },

    async getSession(token: string | undefined | null) {
      if (!token) {
        return null;
      }

      const session = await repository.findSessionByTokenHash(
        hashSessionToken(token, env.secret),
      );

      if (!session) {
        return null;
      }

      if (session.expiresAt.getTime() <= now().getTime()) {
        await repository.deleteSessionByTokenHash(session.tokenHash);
        return null;
      }

      const admin = await repository.findAdminByUsername(env.username);
      const credentialFingerprint = getCredentialFingerprint(env);

      if (
        !admin ||
        admin.id !== session.adminId ||
        admin.credentialFingerprint !== credentialFingerprint ||
        session.credentialFingerprint !== credentialFingerprint
      ) {
        await repository.deleteSessionByTokenHash(session.tokenHash);
        return null;
      }

      return { user: { username: admin.username } };
    },

    async logout(token: string | undefined | null) {
      if (!token) {
        return;
      }

      await repository.deleteSessionByTokenHash(
        hashSessionToken(token, env.secret),
      );
    },
  };
}

export function getCredentialFingerprint(env: AuthEnvironment) {
  return createHash("sha256")
    .update(env.secret)
    .update("\0")
    .update(env.username)
    .update("\0")
    .update(env.password)
    .digest("hex");
}

export function hashSessionToken(token: string, secret: string) {
  return createHash("sha256")
    .update(secret)
    .update("\0")
    .update(token)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const length = Math.max(leftBuffer.length, rightBuffer.length);
  const leftPadded = Buffer.alloc(length);
  const rightPadded = Buffer.alloc(length);

  leftBuffer.copy(leftPadded);
  rightBuffer.copy(rightPadded);

  return (
    timingSafeEqual(leftPadded, rightPadded) &&
    leftBuffer.length === rightBuffer.length
  );
}
