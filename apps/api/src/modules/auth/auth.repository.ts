import { and, eq, ne } from "drizzle-orm";
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
      throw new Error("تعذر إنشاء حساب المدير");
    }

    return {
      id,
      username: input.username,
      credentialFingerprint: input.credentialFingerprint,
    };
  },

  async updateAdmin(id, input) {
    const [result] = await db
      .update(adminsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(adminsTable.id, id));

    if (result.affectedRows === 0) {
      throw new Error("حساب المدير غير موجود");
    }

    return { id, ...input };
  },

  async deleteSessionsNotMatchingFingerprint(adminId, fingerprint) {
    await db
      .delete(authSessionsTable)
      .where(
        and(
          eq(authSessionsTable.adminId, adminId),
          ne(authSessionsTable.credentialFingerprint, fingerprint),
        ),
      );
  },

  async createSession(input) {
    const inserted = await db
      .insert(authSessionsTable)
      .values(input)
      .$returningId();
    const id = inserted[0]?.id;

    if (!id) {
      throw new Error("تعذر إنشاء الجلسة");
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
