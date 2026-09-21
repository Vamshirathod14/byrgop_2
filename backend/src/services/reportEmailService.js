import nodemailer from 'nodemailer';
import { mailConfig, isMailConfigured } from '../config/reportMail.js';

// ─── Report email delivery (Hostinger SMTP) ───────────────
// Sends the generated PDF from the project's BYRGOP Customer Care mailbox.
// Credentials always come from the environment (see config/reportMail.js).

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Display labels for the business-type slugs stored on the session
// ('service' | 'product' | 'ngo'). These mirror the application's
// BusinessType display names, so the email never shows an internal slug.
const BUSINESS_TYPE_LABELS = {
  service: 'Service Based',
  product: 'Product Based',
  ngo: 'NGO / Non-Profit',
};

function resolveBusinessTypeLabel(session) {
  return (
    session?.businessTypeLabel ||
    session?.result?.businessTypeLabel ||
    (session?.businessType ? BUSINESS_TYPE_LABELS[session.businessType] : null) ||
    '—'
  );
}

function resolveDomainLabel(session) {
  // domainLabel is a display name; never fall back to the domain slug.
  return session?.result?.domainLabel || session?.domainLabel || '—';
}

export function buildReportMail({ to, session, reportRequest, overviewBand, overallPercent }) {
  const subject = `Your BYRGOP Business Health Assessment Report${reportRequest?.companyName ? ` — ${reportRequest.companyName}` : ''}`;
  const pct = `${overallPercent}%`;
  const dynamicRows = [
    ['Composite Score', pct],
    ['Operational Status', overviewBand || '—'],
    ['Enterprise Model', resolveBusinessTypeLabel(session)],
    ['Industry Sector', resolveDomainLabel(session)],
  ];
  const summaryRows = dynamicRows
    .map(
      ([k, v]) =>
        `<div style="padding:8px 0;border-bottom:1px solid #e5eaf2;font-size:14px;color:#5b6b82;line-height:1.5">${escapeHtml(k)}: <strong style="color:#16213e">${escapeHtml(v)}</strong></div>`
    )
    .join('');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6fa;font-family:'Inter',Helvetica,Arial,sans-serif;color:#16213e">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf2;border-radius:10px;overflow:hidden">
      <div style="padding:22px 30px;border-bottom:3px solid #16213e;background:#ffffff;text-align:right">
        <span style="font-size:12px;letter-spacing:0.12em;color:#8a97ad;text-transform:uppercase;font-weight:600">Business Health Assessment</span>
      </div>
      <div style="padding:28px 30px">
        <p style="margin:0 0 14px;font-size:14px;color:#5b6b82;line-height:1.6">Dear ${escapeHtml(reportRequest?.ownerName || 'there')},</p>
        <p style="margin:0 0 14px;font-size:14px;color:#5b6b82;line-height:1.6">Thank you for completing the BYRGOP Business Health Assessment powered by our proprietary PAD (Performance &amp; Diagnostic) Tool.</p>
        <p style="margin:0;font-size:14px;color:#5b6b82;line-height:1.6">Your comprehensive diagnostic dossier is attached to this email.</p>

        <div style="margin-top:26px;padding:16px 20px;background:#f4f6fa;border:1px solid #e5eaf2;border-radius:8px">
          <div style="font-size:13px;letter-spacing:0.04em;color:#16213e;font-weight:700;margin-bottom:4px">Executive Summary</div>
          ${summaryRows}
        </div>

        <div style="margin-top:28px">
          <h2 style="margin:0 0 12px;font-size:14px;color:#16213e;font-weight:700">What’s Inside the Dossier:</h2>
          <p style="margin:0 0 10px;font-size:13.5px;color:#5b6b82;line-height:1.6"><strong style="color:#16213e">Diagnostic Synthesis:</strong> High-level performance benchmarks across core operational verticals.</p>
          <p style="margin:0;font-size:13.5px;color:#5b6b82;line-height:1.6"><strong style="color:#16213e">Six-Pillar Strategic Matrix:</strong> Quantitative scoring accompanied by your tailored visual radar chart.</p>
        </div>

        <div style="margin-top:28px">
          <h2 style="margin:0 0 12px;font-size:14px;color:#16213e;font-weight:700">About Business Profit Architects:</h2>
          <p style="margin:0 0 14px;font-size:14px;color:#5b6b82;line-height:1.7">As your Business Profit Architects, we specialize in transforming analytical diagnostics into sustainable bottom-line expansion. We partner with leadership teams to engineer resilient business models, eliminate structural margin leaks, and design scalable architectures that drive compounding enterprise value.</p>
          <p style="margin:0 0 14px;font-size:14px;color:#5b6b82;line-height:1.7">A composite score of <strong style="color:#16213e">${pct}</strong> indicates significant headroom to recapture margin, refine operational levers, and structurally de-risk your growth pipeline.</p>
          <p style="margin:0;font-size:14px;color:#5b6b82;line-height:1.7">Should your executive team wish to explore prioritized interventions or blueprint a strategic roadmap with our architects, simply reply directly to this note.</p>
          <p style="margin:24px 0 0;font-size:14px;color:#16213e;line-height:1.6"><strong>Warm regards,</strong><br/>The BYRGOP Advisory Team</p>
        </div>
      </div>
      <div style="padding:16px 30px;background:#16213e;color:#d7e0ee;font-size:11.5px;line-height:1.6">
        © ${new Date().getFullYear()} BYRGOP. This report is intended for the recipient only and is provided for informational guidance.
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `Dear ${reportRequest?.ownerName || 'there'},`,
    '',
    'Thank you for completing the BYRGOP Business Health Assessment powered by our proprietary PAD (Performance & Diagnostic) Tool.',
    '',
    'Your comprehensive diagnostic dossier is attached to this email.',
    '',
    'Executive Summary',
    '',
    ...dynamicRows.map(([k, v]) => `${k}: ${v}`),
    '',
    'What’s Inside the Dossier:',
    '',
    'Diagnostic Synthesis: High-level performance benchmarks across core operational verticals.',
    '',
    'Six-Pillar Strategic Matrix: Quantitative scoring accompanied by your tailored visual radar chart.',
    '',
    'About Business Profit Architects:',
    '',
    'As your Business Profit Architects, we specialize in transforming analytical diagnostics into sustainable bottom-line expansion. We partner with leadership teams to engineer resilient business models, eliminate structural margin leaks, and design scalable architectures that drive compounding enterprise value.',
    '',
    `A composite score of ${pct} indicates significant headroom to recapture margin, refine operational levers, and structurally de-risk your growth pipeline.`,
    '',
    'Should your executive team wish to explore prioritized interventions or blueprint a strategic roadmap with our architects, simply reply directly to this note.',
    '',
    'Warm regards,',
    '',
    'The BYRGOP Advisory Team',
  ].join('\n');

  // Email carries the report PDF only — no logo image or CID attachment.
  return { subject, html, text, attachments: [] };
}

async function createTransporter() {
  const cfg = mailConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  // Verify the connection eagerly so delivery status reflects real problems.
  await transporter.verify();
  return transporter;
}

/**
 * Deliver the report. Resolves to { sent: true, messageId } when delivered.
 * If the SMTP mailbox is not configured yet the call resolves to
 * { skipped: true, reason } so the API never depends on email being live.
 *
 * `transport` (optional) lets callers inject a pre-built nodemailer-style
 * transport (used by tests); otherwise a real SMTP transport is created.
 */
export async function sendReportEmail({ to, session, reportRequest, pdfBuffer, transport }) {
  if (!to) return { skipped: true, reason: 'No recipient email' };
  if (!pdfBuffer || pdfBuffer.length === 0) return { skipped: true, reason: 'No PDF to attach' };
  if (!isMailConfigured()) return { skipped: true, reason: 'SMTP not configured' };

  const overviewPercent = session?.result?.overallPercent ?? 0;
  const overviewBand = session?.result?.band || null;
  const { subject, html, text, attachments } = buildReportMail({
    to,
    session,
    reportRequest,
    overviewBand,
    overallPercent: overviewPercent,
  });

  const transporter = transport || (await createTransporter());
  const info = await transporter.sendMail({
    from: `"${mailConfig().fromName}" <${mailConfig().from}>`,
    replyTo: mailConfig().replyTo,
    to,
    subject,
    text,
    html,
    attachments: [
      ...attachments,
      {
        filename: `BYRGOP-Business-Health-Report-${session.sessionId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
  return { sent: true, messageId: info.messageId || null, accepted: info.accepted || [to] };
}

export default { sendReportEmail, buildReportMail };