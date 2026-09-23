import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { mailConfig, isMailConfigured } from '../config/reportMail.js';

// ─── Visitor QR email (12th Anniversary) ────────────────
// A deliberately isolated email path for the visitor registration flow. It
// reuses the same Hostinger SMTP configuration as the assessment report emails
// but is completely separate from reportEmailService — nothing in the existing
// assessment/report email behavior is touched by this module.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildQrMail({ to, visitor, memberName, companyName, registrationId }) {
  const subject = `Your BYRGOP 12th Anniversary Visitor QR — ${visitor.name}`;
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f4f4f0;font-family:'Poppins','Segoe UI',Arial,sans-serif;color:#20242c">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e2dc">
      <div style="padding:22px 28px;background:#0b4e8a;color:#ffffff">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600">BYRGOP · 12th Anniversary</div>
        <div style="font-size:20px;font-weight:700;margin-top:2px">Visitor QR Code</div>
      </div>
      <div style="padding:26px 28px">
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6">Dear ${escapeHtml(visitor.name)},</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6">Thank you for registering for the BYRGOP 12th Anniversary. Please present the attached QR code at the venue to check in.</p>
        <p style="margin:0;font-size:13px">Registration: <strong>${escapeHtml(registrationId)}</strong> · Member: <strong>${escapeHtml(memberName)}</strong> (${escapeHtml(companyName)})</p>
        <div style="margin-top:20px;padding:14px 16px;background:#f6f5f1;border-radius:10px;font-size:13px;line-height:1.6">
          Please note the QR is valid from <strong>23 Sep</strong> through <strong>1 Oct 2026</strong>.
        </div>
      </div>
      <div style="padding:16px 28px;background:#20242c;color:#c8ccd4;font-size:11.5px;line-height:1.6">
        © ${new Date().getFullYear()} BYRGOP · Business Profit Architects. This QR is intended for the registered visitor only.
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `Dear ${visitor.name},`,
    '',
    'Thank you for registering for the BYRGOP 12th Anniversary. Please present the attached QR code at the venue to check in.',
    '',
    `Registration: ${registrationId}`,
    `Member: ${memberName} (${companyName})`,
    '',
    'The QR is valid from 23 Sep through 1 Oct 2026.',
    '',
    '© BYRGOP · Business Profit Architects',
  ].join('\n');

  return { subject, html, text };
}

function safePngName(name) {
  const base = (name || '')
    .trim()
    .replace(/[^\w -]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'Visitor';
}

async function createTransporter() {
  const cfg = mailConfig();
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
}

/**
 * Sends one QR email per visitor that has an email address. Resolves per
 * visitor to { sent:true, messageId } | { skipped:true, reason }. Never throws —
 * a failure here must not fail the registration itself. `transport` is optional
 * and used by tests to inject a fake nodemailer transport.
 */
export async function sendVisitorQrEmails({ registration, transport }) {
  if (!isMailConfigured()) {
    return registration.visitors.map((v) => ({ visitorId: v.visitorId, skipped: true, reason: 'SMTP not configured' }));
  }
  const transporter = transport || (await createTransporter());
  const cfg = mailConfig();

  const results = [];
  for (const visitor of registration.visitors) {
    if (!visitor.email) {
      results.push({ visitorId: visitor.visitorId, skipped: true, reason: 'No email provided' });
      continue;
    }
    try {
      const { subject, html, text } = buildQrMail({
        to: visitor.email,
        visitor,
        memberName: registration.memberName,
        companyName: registration.companyName,
        registrationId: registration.registrationId,
      });
      const png = await QRCode.toBuffer(visitor.qrToken, {
        type: 'png',
        width: 480,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#20242c', light: '#ffffff' },
      });
      const info = await transporter.sendMail({
        from: `"${cfg.fromName}" <${cfg.from}>`,
        replyTo: cfg.replyTo,
        to: visitor.email,
        subject,
        text,
        html,
        attachments: [
          {
            filename: `BYRGOP-Visitor-${safePngName(visitor.name)}.png`,
            content: png,
            contentType: 'image/png',
          },
        ],
      });
      results.push({ visitorId: visitor.visitorId, sent: true, messageId: info.messageId || null });
    } catch (err) {
      results.push({ visitorId: visitor.visitorId, skipped: true, reason: `Send failed: ${err.message}` });
    }
  }
  return results;
}

export default { sendVisitorQrEmails };