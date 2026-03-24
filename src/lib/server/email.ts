import nodemailer from 'nodemailer';

// ─── Provider Config ──────────────────────────────────────────────
// Set EMAIL_PROVIDER=resend in .env.local to use Resend instead of Gmail
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail';

// ─── Gmail (Nodemailer) Transport ─────────────────────────────────
const gmailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Resend Transport (optional, for future use) ──────────────────
async function sendViaResend(to: string, subject: string, html: string) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'Zakat Manager <onboarding@resend.dev>';
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

// ─── Unified Send ─────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  if (EMAIL_PROVIDER === 'resend') {
    return sendViaResend(to, subject, html);
  }

  // Default: Gmail via Nodemailer
  await gmailTransport.sendMail({
    from: `"Zakat Manager" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ─── HTML Templates ───────────────────────────────────────────────

function otpEmailHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a, #15803d);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Zakat Manager</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Email Verification</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#1f2937;font-size:16px;line-height:1.6;">Assalamu Alaikum,</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">Use the following code to verify your email address. This code will expire in <strong>5 minutes</strong>.</p>

              <!-- OTP Box -->
              <div style="background-color:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
                <p style="margin:0;color:#166534;font-size:36px;font-weight:800;letter-spacing:8px;font-family:'Courier New',monospace;">${otp}</p>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">If you didn't request this code, you can safely ignore this email.</p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Do not share this code with anyone.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.5;">
                This is an automated message from Zakat Manager.<br>
                Your financial data is 100% private and secure.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function resetEmailHtml(token: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Zakat Manager</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Password Reset</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#1f2937;font-size:16px;line-height:1.6;">Assalamu Alaikum,</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">We received a request to reset your password. Use the token below on the reset page. This token expires in <strong>10 minutes</strong>.</p>

              <!-- Token Box -->
              <div style="background-color:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#b91c1c;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Reset Token</p>
                <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;font-family:'Courier New',monospace;word-break:break-all;">${token}</p>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Your password will remain unchanged.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.5;">
                This is an automated message from Zakat Manager.<br>
                Your financial data is 100% private and secure.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Exported Functions ───────────────────────────────────────────

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  // Always log to console for debugging
  console.log(`[EMAIL] OTP for ${email}: ${otp}`);

  try {
    await sendEmail(email, 'Your OTP Code - Zakat Manager', otpEmailHtml(otp));
    console.log(`[EMAIL] OTP email sent successfully to ${email} via ${EMAIL_PROVIDER}`);
  } catch (err) {
    console.error('[EMAIL] Failed to send OTP email:', err);
    throw err;
  }
}

export async function sendResetEmail(email: string, token: string): Promise<void> {
  console.log(`[EMAIL] Reset token for ${email}: ${token}`);

  try {
    await sendEmail(email, 'Password Reset - Zakat Manager', resetEmailHtml(token));
    console.log(`[EMAIL] Reset email sent successfully to ${email} via ${EMAIL_PROVIDER}`);
  } catch (err) {
    console.error('[EMAIL] Failed to send reset email:', err);
    throw err;
  }
}
