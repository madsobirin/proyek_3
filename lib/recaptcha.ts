/**
 * Helper verifikasi Google reCAPTCHA v2 server-side.
 */
export async function verifyRecaptcha(
  token?: string | null
): Promise<{ success: boolean; message?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Jika environment test atau secret key belum dikonfigurasi, bypass agar tidak memblokir dev/test
  if (process.env.NODE_ENV === "test" || !secretKey) {
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      message: "Verifikasi reCAPTCHA wajib dicentang.",
    };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Gagal terhubung ke layanan verifikasi reCAPTCHA.",
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        message: "Verifikasi reCAPTCHA tidak valid atau kedaluwarsa. Silakan centang ulang.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[RECAPTCHA_VERIFY_ERROR]:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memverifikasi reCAPTCHA.",
    };
  }
}
