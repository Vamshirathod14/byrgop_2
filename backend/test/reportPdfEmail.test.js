import { test } from 'node:test';
import assert from 'node:assert/strict';

// Unit tests for the report delivery pipeline:
//   • PDF generation (exactly 3 pages, header logo + subtle full-size watermark)
//   • SMTP email sending with the PDF + black logo (CID) attached
//   • delivery status recorded on the session (skipped when SMTP unconfigured)
//   • already-delivered sessions are not emailed again on UPDATE DETAILS

async function loadService(t, sessionsById) {
  await t.mock.module('../src/models/KnowYourselfSession.js', {
    defaultExport: {
      findOne: async ({ sessionId }) => sessionsById[sessionId] || null,
    },
  });
  // Query string forces a fresh module instance so this test sees its own mock.
  return import(`../src/services/knowYourselfService.js?t=${Date.now()}-${Math.random()}`);
}

function makeResult() {
  return {
    version: 2,
    overallPercent: 62,
    band: 'MODERATE PERFORMANCE',
    message: 'Targeted Improvements Needed',
    businessTypeLabel: 'Product Based',
    domainLabel: 'Manufacturing',
    strongest: { name: 'Operations & Execution' },
    priority: { name: 'Digital & Innovation' },
    categories: [
      { key: 'strategic-direction', name: 'Strategic Direction', color: '#0A78CF', percent: 58 },
      { key: 'financial-performance', name: 'Financial Performance', color: '#FCA700', percent: 47 },
      { key: 'sales-market-growth', name: 'Sales & Market Growth', color: '#E52032', percent: 66 },
      { key: 'operations-execution', name: 'Operations & Execution', color: '#0D8845', percent: 82 },
      { key: 'people-organization', name: 'People & Organization', color: '#F5630D', percent: 53 },
      { key: 'digital-innovation', name: 'Digital & Innovation', color: '#7038A5', percent: 41 },
    ],
  };
}

function makeSession(over = {}) {
  const total = 18;
  const answers = Array.from({ length: total }, (_, i) => ({ questionIndex: i, optionId: 'o' + i }));
  const selectedQuestions = Array.from({ length: total }, (_, i) => ({ questionId: String(i), text: 'Q' + i }));
  return {
    sessionId: 'S1',
    status: 'completed',
    answers,
    selectedQuestions,
    businessType: over.businessType || null,
    domainLabel: over.domainLabel || null,
    result: over.result || null,
    reportRequest: over.reportRequest || null,
    saved: 0,
    async save() {
      this.saved += 1;
    },
  };
}

const valid = {
  ownerName: 'Neha Sharma',
  companyName: 'Spark Manufacturing',
  email: 'neha@spark.example',
  website: 'https://spark.example',
  countryCode: '+91',
  phone: '9876543210',
};

// ─── PDF generation ────────────────────────────────────────

test('PDF: generates a valid exactly-3-page report with header logo and a subtle watermark on every page', async () => {
  const { buildReportPdf } = await import('../src/services/reportPdfService.js');
  const session = makeSession({ result: makeResult() });
  const pdf = await buildReportPdf({ session, reportRequest: { ...valid, submittedAt: new Date() } });

  assert.ok(pdf.subarray(0, 5).toString('latin1') === '%PDF-', 'valid %PDF header');
  const latin = pdf.toString('latin1');
  const pages = Number((latin.match(/\/Count\s+(\d+)/) || [])[1]);
  assert.equal(pages, 3, 'report must be exactly 3 pages');
  // 2 BYRGOP images per page: the black_logo.jpg header logo + the watermark.
  const images = (latin.match(/\/Subtype \/Image/g) || []).length;
  assert.equal(images, 6, 'header logo + watermark embedded once per page (2 per page)');
  assert.ok(latin.includes('/Width 1600') && latin.includes('/Height 533'), 'header uses black_logo.jpg');
  assert.ok(latin.includes('/Width 1374') && latin.includes('/Height 1145'), 'watermark uses pdf_water_mark.jpeg');
  assert.ok(latin.includes('/ca 0.06'), 'watermark drawn at low opacity via ExtGState');
  assert.ok(latin.includes('/Author'), 'PDF metadata author present');
});

// ─── Email delivery status on submission ──────────────────

test('report request: submission generates the PDF and records a skipped email when SMTP is unconfigured', async (t) => {
  const session = makeSession({ result: makeResult() });
  const svc = await loadService(t, { S1: session });
  const res = await svc.submitKYReportRequest('S1', valid);

  assert.ok(session.reportRequest.pdfGeneratedAt instanceof Date, 'PDF was generated');
  assert.equal(session.reportRequest.emailStatus, 'skipped', 'email skipped when SMTP not configured');
  assert.ok(session.reportRequest.emailAttemptedAt instanceof Date);
  assert.ok(session.reportRequest.emailError, 'skip reason recorded');
  assert.equal(session.saved, 1, 'session saved exactly once');
  assert.equal(res.emailStatus, 'skipped');
});

test('report request: already-delivered session is not emailed again on UPDATE DETAILS (no duplicate email)', async (t) => {
  const delivered = {
    requested: true,
    ownerName: 'Neha Sharma',
    companyName: 'Spark Manufacturing',
    email: 'neha@spark.example',
    website: 'https://spark.example',
    countryCode: '+91',
    phone: '9876543210',
    submittedAt: new Date(),
    pdfGeneratedAt: new Date(),
    emailStatus: 'sent',
    emailSentAt: new Date(),
    emailMessageId: 'msg-1',
  };
  const session = makeSession({ result: makeResult(), reportRequest: delivered });
  const svc = await loadService(t, { S1: session });
  const res = await svc.submitKYReportRequest('S1', { ...valid, phone: '9876543210' });

  assert.equal(session.reportRequest.emailStatus, 'sent', 'status untouched — no resend');
  assert.equal(session.reportRequest.emailMessageId, 'msg-1');
  assert.equal(session.reportRequest.emailAttemptedAt, null, 'no new delivery attempt');
  assert.equal(res.emailStatus, 'sent');
  assert.equal(session.saved, 1);
});

// ─── Email service (SMTP configured, transport injected) ──

test('email: sends only the PDF (no logo/CID image) from BYRGOP Customer Care when SMTP is configured', async () => {
  const seen = {};
  const fakeTransport = {
    verify: async () => true,
    sendMail: async (mail) => {
      seen.mail = mail;
      return { messageId: 'test-msg-1', accepted: ['neha@spark.example'] };
    },
  };

  const prev = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  };
  process.env.SMTP_HOST = 'smtp.hostinger.com';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_SECURE = 'true';
  process.env.SMTP_USER = 'customercare@byrgop.com';
  process.env.SMTP_PASS = 'test-password';
  try {
    const svc = await import(
      `../src/services/reportEmailService.js?t=${Date.now()}-${Math.random()}`
    );
    const session = makeSession({ result: makeResult() });
    const res = await svc.sendReportEmail({
      to: 'neha@spark.example',
      session,
      reportRequest: { ...valid, submittedAt: new Date() },
      pdfBuffer: Buffer.from('%PDF-test-content'),
      transport: fakeTransport,
    });

    assert.equal(res.sent, true);
    assert.equal(res.messageId, 'test-msg-1');
    assert.match(seen.mail.from, /BYRGOP Customer Care.*<customercare@byrgop\.com>/);
    assert.ok(!seen.mail.html.includes('cid:'), 'no CID image in email HTML');
    assert.ok(!seen.mail.html.includes('byrgop-logo'), 'no logo reference in email HTML');
    assert.match(seen.mail.html, /PAD \(Performance &amp; Diagnostic\) Tool/);
    assert.match(seen.mail.html, /The BYRGOP Advisory Team/);
    assert.equal(seen.mail.attachments.length, 1, 'email attaches only the PDF');
    assert.ok(seen.mail.attachments[0].contentType === 'application/pdf', 'attachment is the report PDF');
    assert.ok(!seen.mail.attachments.some((a) => a.cid), 'no attachment carries a CID');
  } finally {
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS']) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  }
});

test('email: buildReportMail uses the approved copy with dynamic display labels (no slugs)', async () => {
  const { buildReportMail } = await import('../src/services/reportEmailService.js');
  // Realistic session doc: businessType is a slug, domainLabel is a display name,
  // the result carries neither businessTypeLabel nor domainLabel.
  const session = makeSession({
    businessType: 'product',
    domainLabel: 'Manufacturing',
    result: {
      version: 2,
      overallPercent: 62,
      band: 'MODERATE PERFORMANCE',
      message: 'Targeted Improvements Needed',
      businessType: 'product',
      domain: 'manufacturing',
      strongest: { name: 'Operations & Execution' },
      priority: { name: 'Digital & Innovation' },
      categories: [],
    },
  });
  const mail = buildReportMail({
    to: 'neha@spark.example',
    session,
    reportRequest: valid,
    overviewBand: 'MODERATE PERFORMANCE',
    overallPercent: 62,
  });
  assert.match(mail.subject, /Your BYRGOP Business Health Assessment Report/);
  // Approved body starts with the greeting — the old heading is gone.
  assert.ok(!mail.html.includes('Your BYRGOP Assessment Report'), 'old body heading removed');
  assert.ok(mail.html.includes('Dear Neha Sharma,'));
  assert.ok(mail.html.includes('Your comprehensive diagnostic dossier is attached to this email.'));
  // The old score table and its labels are fully removed.
  assert.ok(!mail.html.includes('<table'), 'no HTML table left');
  assert.ok(!mail.html.includes('Overall Score'), 'old Overall Score label removed');
  assert.ok(!mail.html.includes('Health Status'), 'old Health Status label removed');
  assert.ok(!/[<>\" ]Business Type[<>\" ]/.test(mail.html), 'old Business Type table label removed');
  assert.ok(!mail.html.includes('Customer Care'), 'old Customer Care signature removed');
  assert.ok(!mail.text.includes('Customer Care'), 'old Customer Care signature removed from text');
  assert.ok(mail.html.includes('Executive Summary'));
  assert.ok(mail.html.startsWith('<!doctype html>'));
  // Dynamic values, mapped to proper display labels — never internal slugs.
  assert.match(mail.html, /Composite Score: <strong style="color:#16213e">62%<\/strong>/);
  assert.match(mail.html, /Operational Status: <strong style="color:#16213e">MODERATE PERFORMANCE<\/strong>/);
  assert.match(mail.html, /Enterprise Model: <strong style="color:#16213e">Product Based<\/strong>/);
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">Manufacturing<\/strong>/);
  assert.ok(!/businessType/.test(mail.html), 'no internal business-type key leaks');
  assert.ok(!/[<>"]product[<>"]/.test(mail.html), 'no business-type slug leaks');
  assert.ok(mail.html.includes('What’s Inside the Dossier:'));
  assert.ok(mail.html.includes('Diagnostic Synthesis:</strong> High-level performance benchmarks across core operational verticals.'));
  assert.ok(mail.html.includes('About Business Profit Architects:'));
  assert.ok(mail.html.includes('The BYRGOP Advisory Team'));
  assert.ok(mail.text.includes('Executive Summary'));
  assert.ok(mail.text.startsWith('Dear Neha Sharma,'), 'text body starts with the greeting');
  assert.ok(!mail.text.includes('Your BYRGOP Business Health Assessment Report'), 'text title line removed');
  assert.ok(mail.text.includes('Composite Score: 62%'));
  assert.ok(mail.text.includes('Enterprise Model: Product Based'));
  assert.ok(mail.text.includes('Industry Sector: Manufacturing'));
  assert.ok(mail.text.includes('What’s Inside the Dossier:'));
  assert.ok(mail.text.includes('Diagnostic Synthesis: High-level performance benchmarks across core operational verticals.'));
  assert.ok(mail.text.includes('About Business Profit Architects:'));
  assert.ok(mail.text.includes('Warm regards,'));
  assert.ok(mail.text.includes('The BYRGOP Advisory Team'));
});