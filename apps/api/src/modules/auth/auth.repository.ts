import { eq, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import { adminsTable, authSessionsTable } from "../../db/schema/auth.js";
import type { AuthRepository } from "./auth.service.js";

export const authRepository: AuthRepository = {
  async findAdminByUsername(username) {
    const admin = await db.query.adminsTable.findFirst({
      where: eq(adminsTable.username, username),
    });

    return admin
      ? {
          id: admin.id,
          username: admin.username,
          credentialFingerprint: admin.credentialFingerprint,
        }
      : null;
  },

  async createAdmin(input) {
    const inserted = await db.insert(adminsTable).values(input).$returningId();
    const id = inserted[0]?.id;

    if (!id) {
      throw new Error("Admin creation failed");
    }

    return {
      id,
      username: input.username,
      credentialFingerprint: input.credentialFingerprint,
    };
  },

  async updateAdmin(id, input) {
    await db
      .update(adminsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(adminsTable.id, id));

    return { id, ...input };
  },

  async deleteSessionsNotMatchingFingerprint(fingerprint) {
    await db
      .delete(authSessionsTable)
      .where(ne(authSessionsTable.credentialFingerprint, fingerprint));
  },

  async createSession(input) {
    const inserted = await db
      .insert(authSessionsTable)
      .values(input)
      .$returningId();
    const id = inserted[0]?.id;

    if (!id) {
      throw new Error("Session creation failed");
    }

    return {
      id,
      adminId: input.adminId,
      tokenHash: input.tokenHash,
      credentialFingerprint: input.credentialFingerprint,
      expiresAt: input.expiresAt,
    };
  },

  async findSessionByTokenHash(tokenHash) {
    const session = await db.query.authSessionsTable.findFirst({
      where: eq(authSessionsTable.tokenHash, tokenHash),
    });

    return session
      ? {
          id: session.id,
          adminId: session.adminId,
          tokenHash: session.tokenHash,
          credentialFingerprint: session.credentialFingerprint,
          expiresAt: session.expiresAt,
        }
      : null;
  },

  async deleteSessionByTokenHash(tokenHash) {
    await db
      .delete(authSessionsTable)
      .where(eq(authSessionsTable.tokenHash, tokenHash));
  },
};
