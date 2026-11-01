import nodemailer from "nodemailer";

type SendResetPasswordEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

/**
 * Membuat transporter Nodemailer berdasarkan environment variables.
 * Mendukung Gmail, Mailtrap, Brevo, atau custom SMTP server.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Mengirim email instruksi reset password dengan template HTML bertema FitLife.
 */
export async function sendResetPasswordEmail({
  to,
  name,
  resetUrl,
}: SendResetPasswordEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    const from = process.env.SMTP_FROM || `"FitLife" <${process.env.SMTP_USER || "no-reply@fitlife.id"}>`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password FitLife</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f5f7f6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1f2937;
        }
        .container {
          max-width: 560px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        .header {
          background-color: #10b981;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 36px 32px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
        }
        .text {
          font-size: 15px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 24px;
        }
        .button-wrapper {
          text-align: center;
          margin: 32px 0;
        }
        .button {
          background-color: #10b981;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25);
        }
        .note {
          background-color: #f3f4f6;
          border-left: 4px solid #10b981;
          padding: 14px 16px;
          border-radius: 6px;
          font-size: 13px;
          color: #6b7280;
          margin-top: 24px;
          line-height: 1.5;
        }
        .fallback {
          margin-top: 24px;
          font-size: 12px;
          color: #9ca3af;
          word-break: break-all;
          line-height: 1.5;
        }
        .fallback a {
          color: #10b981;
          text-decoration: underline;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding: 24px 32px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          background-color: #fafafa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FitLife</h1>
        </div>
        <div class="content">
          <div class="greeting">Halo, ${name || "Pengguna FitLife"}!</div>
          <p class="text">
            Kami menerima permintaan untuk mereset kata sandi akun Anda di <strong>FitLife</strong>.
            Klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:
          </p>
          <div class="button-wrapper">
            <a href="${resetUrl}" class="button" target="_blank">Reset Kata Sandi</a>
          </div>
          <div class="note">
            ⚠️ <strong>Tautan ini hanya berlaku selama 1 jam.</strong><br>
            Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Akun Anda tetap aman.
          </div>
          <div class="fallback">
            Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} FitLife. All rights reserved.<br>
          Pusat Bantuan & Komunitas Hidup Sehat.
        </div>
      </div>
    </body>
    </html>
    `;

    const textContent = `Halo ${name || "Pengguna FitLife"},\n\n` +
      `Kami menerima permintaan untuk mereset kata sandi akun Anda di FitLife.\n` +
      `Silakan buka tautan berikut untuk membuat kata sandi baru (berlaku 1 jam):\n` +
      `${resetUrl}\n\n` +
      `Jika Anda tidak meminta pengaturan ulang kata sandi ini, abaikan email ini.\n\n` +
      `Salam,\nTim FitLife`;

    if (!transporter) {
      console.warn("\n=======================================================");
      console.warn("⚠️  [FitLife Mail] SMTP credentials (SMTP_USER / SMTP_PASS) belum disetel di .env!");
      console.warn("Tautan Reset Password untuk pengujian lokal:");
      console.warn(`🔗 ${resetUrl}`);
      console.warn("=======================================================\n");

      return {
        success: true,
        messageId: "dev-mock-mode",
      };
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject: "Reset Kata Sandi Akun FitLife Anda",
      text: textContent,
      html: htmlContent,
    });

    console.log(`[FitLife Mail] Email reset password terkirim ke ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[FitLife Mail] Gagal mengirim email reset password:", err);
    return { success: false, error: err.message };
  }
}
