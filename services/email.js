// services/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

  await transporter.sendMail({
    from:    `"Skill Pips" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Reset your Skill Pips password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#6C47FF;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;margin-top:24px">
          If you didn't request this, you can safely ignore this email.<br>
          Link: ${resetUrl}
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
