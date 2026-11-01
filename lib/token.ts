import { SignJWT, jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(
  process.env.RESET_PASSWORD_SECRET || process.env.JWT_SECRET || "fitlife-secret-key-change-in-production"
);

export type ResetTokenPayload = {
  userId: number;
  email: string;
  hashSnippet?: string;
  type: "reset_password";
};

/**
 * Menghasilkan JWT token untuk reset password dengan durasi 1 jam.
 * Menyertakan potongan hash password agar otomatis invalid jika password sudah pernah diubah.
 */
export async function createPasswordResetToken({
  userId,
  email,
  passwordHash,
}: {
  userId: number;
  email: string;
  passwordHash?: string | null;
}): Promise<string> {
  const hashSnippet = passwordHash ? passwordHash.slice(-10) : "no-password";

  return await new SignJWT({
    userId,
    email,
    hashSnippet,
    type: "reset_password",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey);
}

/**
 * Memverifikasi validitas dan masa berlaku JWT token reset password.
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<ResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (payload.type !== "reset_password") {
      return null;
    }

    return payload as unknown as ResetTokenPayload;
  } catch {
    return null;
  }
}
