import PDFDocument from 'pdfkit';
import { reportLogoBuffer, pdfWatermarkBuffer, FOUNDER_PROFILE } from '../config/reportMail.js';
import { categoryDisplayName } from '../config/categoryLabels.js';

// ─── Professional 3-page assessment report (PDF) ──────────
// Page 1: Assessment Overview
// Page 2: 6 Pillar Analysis + Radar Chart
// Page 3: BYRGOP / Founder profile and professional closing
//
// Pure presentation: it reads the already-computed result/categories and never
// re-scores anything.

const PAGE_W = 595.28; // A4 portrait (points)
const PAGE_H = 841.89;
const M = 50; // margin

// Brand palette (matches the frontend/brand system).
const INK = '#16213e';
const NAVY = '#1d2140';
const ACCENT = '#0A78CF';
const GOLD = '#FCA700';
const SLATE = '#5b6b82';
const LINE = '#dce2ed';
const MUTED = '#8a97ad';
const BG = '#f4f6fa';

export function bandForPct(pct) {
  if (pct >= 80) return { label: 'STRONG FOUNDATION', note: 'Ready for Accelerated Growth' };
  if (pct >= 63) return { label: 'MODERATE PERFORMANCE', note: 'Targeted Improvements Needed' };
  if (pct >= 44) return { label: 'SIGNIFICANT GAPS', note: 'Strategic Overhaul Recommended' };
  return { label: 'CRITICAL WEAKNESSES', note: 'Immediate Action Required' };
}

function fmt(v) {
  return v === null || v === undefined || String(v).trim() === '' ? '—' : String(v);
}

function fmtDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function wrapLabel(text, max = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (words.length <= max) return [words.join(' ')];
  const half = max === 2 ? Math.ceil(words.length / 2) : max;
  if (half >= words.length) return [words.join(' ')];
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
}

function sectionHeader(doc, kicker, title) {
  // Header band
  const logo = reportLogoBuffer();
  if (logo) {
    try {
      doc.image(logo, M, 34, { height: 30 });
    } catch {
      doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY).text('BYRGOP', M, 36);
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY).text('BYRGOP', M, 36);
  }
  doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY).text('BYRGOP', PAGE_W - M, 36, { width: 120, align: 'right' });
  doc.font('Helvetica').fontSize(7).fillColor(SLATE).text('Business Health Assessment', PAGE_W - M - 120, 50, { width: 120, align: 'right' });

  const ruleY = 76;
  doc.rect(M, ruleY, PAGE_W - 2 * M, 3).fill(NAVY);
  doc.rect(PAGE_W - M - 70, ruleY, 70, 3).fill(GOLD);

  doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(kicker.toUpperCase(), M, 92);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(20).text(title, M, 102, { width: PAGE_W - 2 * M });
}

function footer(doc) {
  const range = doc.bufferedPageRange();
  const y = PAGE_H - 68;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(LINE).rect(M, y - 6, PAGE_W - 2 * M, 0.8).fill();
    doc.font('Helvetica').fontSize(7).fillColor(MUTED);
    doc.text('BYRGOP — Business Health Assessment', M, y);
    doc.text('byrgop.com', PAGE_W - M - 70, y, { width: 70, align: 'right' });
    doc.text(`Page ${i + 1} of ${range.count}`, PAGE_W / 2 - 40, y, { width: 80, align: 'center' });
  }
}

// Subtle, low-opacity BYRGOP watermark drawn first on every page so it sits
// behind the header and all content. Uses the dedicated watermark asset at a
// deliberately large size; falls back to a faint text monogram if it cannot be
// loaded — the watermark never distracts from readability.
function watermark(doc) {
  const logo = pdfWatermarkBuffer();
  const w = 360; // roughly half-page coverage on an A4 portrait page
  doc.save();
  doc.translate(PAGE_W / 2, PAGE_H / 2);
  doc.rotate(-30);
  doc.opacity(0.06);
  if (logo) {
    try {
      const img = doc.openImage(logo);
      const h = (w * img.height) / img.width;
      doc.image(logo, -w / 2, -h / 2, { width: w });
    } catch {
      drawTextWatermark(doc, w);
    }
  } else {
    drawTextWatermark(doc, w);
  }
  doc.restore();
}

function drawTextWatermark(doc, w) {
  doc.font('Helvetica-Bold').fontSize(54).fillColor(INK).text('BYRGOP', -w / 2, -28, { width: w, align: 'center' });
}

function polar(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

function hexPolygon(doc, cx, cy, radius, count, angleOffset, strokeColor, lineWidth, fill = null, opacity = 1) {
  doc.save();
  doc.lineWidth(lineWidth).lineJoin('round');
  for (let i = 0; i < count; i++) {
    const [x, y] = polar(cx, cy, radius, angleOffset + i * (360 / count));
    if (i === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  }
  doc.closePath();
  if (fill) {
    doc.fillColor(fill).fillOpacity(opacity || 1);
    doc.lineWidth(lineWidth).strokeColor(strokeColor).stroke();
  } else {
    doc.strokeColor(strokeColor).stroke();
  }
  doc.restore();
}

function drawRadar(doc, categories, cx, cy, radius) {
  const n = categories.length;
  const step = 360 / n;

  // rings
  [25, 50, 75, 100].forEach((ring) => hexPolygon(doc, cx, cy, (radius * ring) / 100, n, 0, '#cbd5e1', 0.6));

  // axes
  doc.save();
  doc.lineWidth(0.7).strokeColor('#9fb0c6');
  categories.forEach((_, i) => {
    const [x, y] = polar(cx, cy, radius, i * step);
    doc.moveTo(cx, cy).lineTo(x, y).stroke();
  });
  doc.restore();

  // value polygon
  doc.save();
  doc.lineWidth(2).lineJoin('round');
  categories.forEach((c, i) => {
    const [x, y] = polar(cx, cy, radius * (c.percent / 100), i * step);
    if (i === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  });
  doc.closePath();
  doc.fillOpacity(0.08).fillColor(NAVY).fill();
  doc.strokeColor(ACCENT).fillOpacity(1).stroke();
  doc.restore();

  // vertices + labels
  categories.forEach((c, i) => {
    const [vx, vy] = polar(cx, cy, radius * (c.percent / 100), i * step);
    doc.save();
    doc.fillColor(c.color || ACCENT).circle(vx, vy, 3).fill();
    doc.lineWidth(0.8).strokeColor('#ffffff').circle(vx, vy, 3).stroke();
    doc.restore();

    const [lx, ly] = polar(cx, cy, radius + 22, i * step);
    const rad = ((i * step - 90) * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const anchor = Math.abs(cosA) < 0.35 ? 'center' : cosA > 0 ? 'left' : 'right';
    const width = 110;
    const x = anchor === 'center' ? lx - width / 2 : anchor === 'left' ? lx : lx - width;

    // Name lines (up to 2) plus the percentage on its own line, vertically
    // centred on the label point with a clear gap between name and percentage.
    const lines = wrapLabel(categoryDisplayName(c.key, c.name), 2);
    const nameFont = 8.5;
    const pctFont = 9;
    const nameLh = 10.5;
    const pctLh = 11;
    const gap = 2.5;
    const blockH = lines.length * nameLh + gap + pctLh;
    const startY = ly - blockH / 2 + 1;
    doc.font('Helvetica-Bold').fontSize(nameFont).fillColor(NAVY);
    lines.forEach((ln, li) => doc.text(ln, x, startY + li * nameLh, { width, align: anchor, lineBreak: false }));
    doc.font('Helvetica-Bold').fontSize(pctFont).fillColor(c.color || ACCENT);
    doc.text(`${c.percent}%`, x, startY + lines.length * nameLh + gap, { width, align: anchor, lineBreak: false });
  });
}

function drawPillarBars(doc, categories, startY) {
  const labelX = M;
  const barX = M + 190;
  const barW = PAGE_W - 2 * M - 190 - 64; // right side keeps the % value
  const rowH = 40;
  const barH = 9;

  categories.forEach((c, i) => {
    const y = startY + i * rowH;

    // name (up to 2 lines) + status note
    const lines = wrapLabel(categoryDisplayName(c.key, c.name), 2);
    doc.font('Helvetica-Bold').fontSize(8.4).fillColor(INK);
    lines.forEach((ln, li) => doc.text(ln, labelX - 2, y + li * 10 - (lines.length > 1 ? 1 : 4), { width: 188, lineBreak: false }));
    const band = bandForPct(c.percent);
    doc.font('Helvetica').fontSize(6.6).fillColor(SLATE);
    doc.text(band.label, labelX - 2, y + (lines.length > 1 ? 22 : 14), { width: 188, lineBreak: false });

    // track + fill
    doc.save();
    doc.lineWidth(0).fillColor('#e5eaf2').roundedRect(barX, y + 5, barW, barH, barH / 2).fill();
    if (c.percent > 0) {
      doc.fillColor(c.color || ACCENT).roundedRect(barX, y + 5, Math.max(barW * (c.percent / 100), 3), barH, barH / 2).fill();
    }
    doc.restore();

    // percent value
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK);
    doc.text(`${c.percent}%`, PAGE_W - M - 46, y, { width: 46, align: 'right', lineBreak: false });
  });
}

function page1Overview(doc, { session, reportRequest, result }) {
  watermark(doc);
  sectionHeader(doc, 'Professional Report', 'Assessment Overview');

  let y = 138;

  // Report details card
  const cardH = 168;
  doc.save();
  doc.fillColor(BG).roundedRect(M, y, PAGE_W - 2 * M, cardH, 8).fill();
  doc.restore();
  doc.save();
  doc.fillColor('#ffffff').roundedRect(M + 1, y + 1, PAGE_W - 2 * M - 2, cardH - 2, 7).fill();
  doc.restore();

  const leftX = M + 26;
  const rightX = PAGE_W / 2 + 14;
  const labelW = 92;
  const valW = PAGE_W / 2 - M - 40;
  const rowGap = 24;

  const rows = [
    ['Assessment ID', session.sessionId],
    ['Report Date', fmtDate(reportRequest.submittedAt || session.completedAt)],
    ['Business Type', String(result?.businessTypeLabel || session.businessTypeLabel || session.businessType || '')],
    ['Industry / Domain', String(result?.domainLabel || session.domainLabel || result?.domain || session.domain || '')],
    ['Business Owner', reportRequest.ownerName],
    ['Company', reportRequest.companyName],
    ['Contact Email', reportRequest.email],
    ['Phone', reportRequest.countryCode ? `${reportRequest.countryCode} ${reportRequest.phone}` : reportRequest.phone],
    ['Website', reportRequest.website || '—'],
  ];

  rows.forEach(([label, value], i) => {
    const col = i < 5 ? 0 : 1;
    const rowInCol = col === 0 ? i : i - 5;
    const x = col === 0 ? leftX : rightX;
    const yy = y + 22 + rowInCol * 39 - (col === 1 ? 39 : 0);
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(label.toUpperCase(), x, yy);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(String(value), x, yy + 10, { width: valW, lineBreak: false });
  });

  y += cardH + 34;

  // Overall band
  const overall = cls(result?.overallPercent, 0);
  const band = result?.band ? { label: result.band } : bandForPct(overall);
  const panelH = 92;
  doc.save();
  doc.fillColor(NAVY).roundedRect(M, y, PAGE_W - 2 * M, panelH, 8).fill();
  doc.restore();

  doc.save();
  doc.fillColor('#ffffff').roundedRect(M + 14, y + 14, 92, panelH - 28, 8).fill();
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(24).fillColor(NAVY).text(`${overall}%`, M + 14, y + 26, { width: 92, align: 'center' });
  doc.font('Helvetica').fontSize(6.5).fillColor(MUTED).text('OVERALL SCORE', M + 14, y + 60, { width: 92, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text(String(band.label || '—'), M + 124, y + 18, { width: PAGE_W - 2 * M - 150 });
  const bandNote = result?.message || bandForPct(overall).note;
  doc.font('Helvetica').fontSize(9).fillColor('#d7e0ee').text(String(bandNote || ''), M + 124, y + 36, { width: PAGE_W - 2 * M - 150 });
  doc.font('Helvetica').fontSize(8).fillColor('#9fb0c9').text(
    `Strongest pillar: ${cls(result?.strongest?.name, '—')}  •  Priority area: ${cls(result?.priority?.name, '—')}`,
    M + 124,
    y + panelH - 20,
    { width: PAGE_W - 2 * M - 150 }
  );

  y += panelH + 26;

  // About this report
  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text('About This Assessment', M, y);
  y += 18;
  doc.font('Helvetica').fontSize(9.5).fillColor(SLATE).text(
    `This report summarises ${cls(session.selectedQuestions?.length, 18)} assessment responses across six strategic pillars: Strategy, Finances, Marketing, Operations, People and Technology. ` +
      `Each pillar is scored from 0 to 100 relative to the questions answered, and the overall result is the average across the active pillars. ` +
      `Scores are directional guidance only and are not a formal audit.`,
    M,
    y,
    { width: PAGE_W - 2 * M, lineHeight: 1.5 }
  );

  doc.addPage();
}

function page2Pillars(doc, { result }) {
  watermark(doc);
  sectionHeader(doc, 'Results & Insights', '6 Pillar Analysis');

  const categories = result?.categories || [];
  const cx = PAGE_W / 2;
  const cy = 245;
  const radius = 126;

  drawRadar(doc, categories, cx, cy, radius);

  const startY = cy + radius + 62;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text('Pillar Breakdown', M, startY - 12, { width: PAGE_W - 2 * M });
  drawPillarBars(doc, categories, startY + 6);

  if (categories.some((c) => c.previousPercent != null)) {
    doc.font('Helvetica').fontSize(7.5).fillColor(SLATE).text(
      'Previous-assessment comparison is shown where available.',
      M,
      startY + 6 + categories.length * 40 + 6,
      { width: PAGE_W - 2 * M }
    );
  }

  doc.addPage();
}

function page3Founder(doc) {
  watermark(doc);
  sectionHeader(doc, 'BYRGOP', 'About BYRGOP');

  let y = 150;
  const cx = PAGE_W / 2;

  doc.font('Helvetica-Bold').fontSize(17).fillColor(NAVY).text(FOUNDER_PROFILE.name, cx, y, { width: 0, align: 'center' });
  y += 26;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD).text(FOUNDER_PROFILE.role, cx, y, { align: 'center' });
  y += 18;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(ACCENT).text(FOUNDER_PROFILE.credential, cx, y, { align: 'center' });
  y += 20;

  doc.save();
  const ruleLen = 60;
  doc.lineWidth(0.8).strokeColor(LINE).moveTo(cx - ruleLen, y).lineTo(cx + ruleLen, y).stroke();
  doc.restore();
  y += 24;

  doc.font('Helvetica').fontSize(10).fillColor(SLATE).text(FOUNDER_PROFILE.bio, M + 55, y, {
    width: PAGE_W - 2 * (M + 55),
    align: 'center',
    lineHeight: 1.55,
  });
  y += 60;

  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('Core Expertise', M, y);
  y += 8;
  const boxW = (PAGE_W - 2 * M - 18) / 2;
  const boxH = 44;
  FOUNDER_PROFILE.expertise.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (boxW + 18);
    const yy = y + row * (boxH + 14);
    doc.save();
    doc.fillColor('#ffffff').strokeColor(LINE).lineWidth(0.7).roundedRect(x, yy, boxW, boxH, 6).fill().stroke();
    doc.restore();
    doc.fillColor(ACCENT).circle(x + 16, yy + boxH / 2, 3).fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text(item, x + 28, yy + boxH / 2 - 3.5, { width: boxW - 40, lineBreak: false });
  });

  y += 44 * 2 + 14 + 8;
  y += 26;

  // Professional closing
  doc.save();
  const closeLen = PAGE_W - 2 * M;
  doc.lineWidth(0.8).strokeColor(LINE).moveTo(M, y).lineTo(PAGE_W - M, y).stroke();
  doc.restore();
  doc.font('Helvetica').fontSize(9.5).fillColor(SLATE).text(
    'BYRGOP is committed to helping founders and leaders build resilient, well-balanced businesses. We hope this report supports your next strategic decision with clarity and confidence.',
    M,
    y + 18,
    { width: PAGE_W - 2 * M, lineHeight: 1.55 }
  );
  y += 76;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text('BYRGOP Customer Care', M, y);
  doc.font('Helvetica').fontSize(9).fillColor(SLATE).text('customercare@byrgop.com  •  byrgop.com', M, y + 15);
}

export function buildReportPdf({ session, reportRequest }) {
  return new Promise((resolve, reject) => {
    const result = session?.result || {};
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: M,
      bufferPages: true,
      info: {
        Title: 'BYRGOP Business Health Assessment Report',
        Author: 'BYRGOP',
        Subject: `Business Health Assessment — ${reportRequest?.companyName || ''}`.trim(),
        Keywords: 'BYRGOP, business assessment, strategy',
        Creator: 'BYRGOP Assessment Platform',
      },
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    page1Overview(doc, { session, reportRequest, result });
    page2Pillars(doc, { result });
    page3Founder(doc);
    footer(doc);

    doc.end();
  });
}

function cls(v, fallback) {
  return v === null || v === undefined ? fallback : v;
}

export default { buildReportPdf, bandForPct };