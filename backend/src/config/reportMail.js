import path from 'node:path';
import fs from 'node:fs';

// ─── Report email (Hostinger SMTP) configuration ──────────
// All credentials come from environment variables — nothing is hardcoded and
// no password ever touches the repository. The Hostinger mailbox
// customercare@byrgop.com already exists; the SMTP password is the mailbox
// password (hPanel → Emails → Email Accounts), NOT the hPanel login password.
//
// Recommended Hostinger SMTP values (defaults below match them):
//   host  smtp.hostinger.com
//   port  465 with SMTP_SECURE=true (SSL/TLS)  — or 587 with STARTTLS
//   auth  user = the full mailbox address, pass = its mailbox password

const DEFAULTS = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  from: 'customercare@byrgop.com',
  fromName: 'BYRGOP Customer Care',
};

function optional(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === null || String(v).trim() === '' ? fallback : String(v).trim();
}

export function mailConfig() {
  const port = Number(optional('SMTP_PORT', String(DEFAULTS.port)));
  const secure = optional('SMTP_SECURE', String(DEFAULTS.secure)).toLowerCase() !== 'false';
  return {
    host: optional('SMTP_HOST', DEFAULTS.host),
    port,
    secure,
    from: optional('EMAIL_FROM', DEFAULTS.from),
    fromName: optional('EMAIL_FROM_NAME', DEFAULTS.fromName),
    user: optional('SMTP_USER', DEFAULTS.from),
    pass: process.env.SMTP_PASS || '',
    replyTo: process.env.EMAIL_REPLY_TO ? String(process.env.EMAIL_REPLY_TO).trim() : DEFAULTS.from,
  };
}

export function isMailConfigured() {
  const c = mailConfig();
  return Boolean(c.host && c.user && c.pass && c.port);
}

// ─── Report logo (PDF header) ─────────────────────────────
// Black BYRGOP logo used as the normal branding in the PDF header
// (frontend/public/black_logo.jpg). REPORT_LOGO_PATH overrides it; otherwise we
// search from the backend working directory (../frontend/public/…) so the value
// can be found regardless of the directory the server is started from.
const LOGO_CANDIDATES = [
  () => process.env.REPORT_LOGO_PATH || '',
  () => path.join(process.cwd(), '..', 'frontend', 'public', 'black_logo.jpg'),
  () => path.join(process.cwd(), 'frontend', 'public', 'black_logo.jpg'),
];

export function reportLogoPath() {
  return LOGO_CANDIDATES.map((fn) => fn()).find((p) => p && fs.existsSync(p)) || null;
}

export function reportLogoBuffer() {
  const p = reportLogoPath();
  if (!p) return null;
  try {
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

// ─── PDF watermark (frontend/public/pdf_water_mark.jpeg) ─
// Subtle, large, low-opacity watermark drawn behind the content of every report
// page. PDF_WATERMARK_PATH overrides it; otherwise it is looked up from the
// frontend public directory.
const PDF_WATERMARK_CANDIDATES = [
  () => process.env.PDF_WATERMARK_PATH || '',
  () => path.join(process.cwd(), '..', 'frontend', 'public', 'pdf_water_mark.jpeg'),
  () => path.join(process.cwd(), 'frontend', 'public', 'pdf_water_mark.jpeg'),
];

export function pdfWatermarkPath() {
  return PDF_WATERMARK_CANDIDATES.map((fn) => fn()).find((p) => p && fs.existsSync(p)) || null;
}

export function pdfWatermarkBuffer() {
  const p = pdfWatermarkPath();
  if (!p) return null;
  try {
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

// Constant reused by the PDF header, the email body and the signature block.
export const FOUNDER_PROFILE = {
  name: 'RADHA KRISHNA ABBURU',
  role: 'Founder & Chief Strategy Officer',
  bio: 'Management consultant and corporate strategist focused on business strategy, operational excellence, and sustainable growth.',
  expertise: [
    'Strategic Planning',
    'Operational Excellence',
    'Program Management',
    'Business Transformation',
  ],
};