/* ─────────────────────────────────────────────────────────────────────────
   EXECUTIVE SUMMARY — PER BUSINESS TYPE
   ─────────────────────────────────────────────────────────────────────────
   The assessment email's Executive Summary is built per business type:

     Services / Manufacturing  → Composite Score, Operational Status,
                                 Enterprise Model, Industry Sector (Domain)
     Non-Profit                → Composite Score, Operational Status,
                                 Industry Sector: Non-Profit
     Startup                   → Composite Score, Operational Status,
                                 Industry Sector: Startup

   Domainless types drop the Enterprise Model line (it would only repeat the
   business type) and report the business type itself as the Industry Sector.
   Services and Manufacturing must stay byte-for-byte as they were.
   ───────────────────────────────────────────────────────────────────────── */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildReportMail } from '../src/services/reportEmailService.js';

const REQUEST = { ownerName: 'Neha Sharma', companyName: 'Spark Pvt Ltd' };
const BAND = 'MODERATE PERFORMANCE';

function sessionFor(businessType, { domainLabel = null, businessTypeLabel = null } = {}) {
  return {
    sessionId: 'S1',
    businessType,
    domainLabel,
    result: {
      version: 2,
      overallPercent: 62,
      band: BAND,
      businessType,
      domainLabel,
      businessTypeLabel,
    },
  };
}

function mailFor(businessType, opts) {
  return buildReportMail({
    to: 'neha@spark.example',
    session: sessionFor(businessType, opts),
    reportRequest: REQUEST,
    overviewBand: BAND,
    overallPercent: 62,
  });
}

// Counts the Executive Summary rows: each row is the only element carrying this
// border style, so its frequency is the row count.
const rowCount = (html) => (html.match(/border-bottom:1px solid #e5eaf2/g) || []).length;

/* ── Services & Manufacturing: unchanged ───────────────────────────────── */

test('Services keeps all four Executive Summary rows, unchanged', () => {
  const mail = mailFor('service', {
    domainLabel: 'Financial Services & FinTech',
    businessTypeLabel: 'Service Based',
  });
  assert.equal(rowCount(mail.html), 4, 'Services keeps four summary rows');
  assert.match(mail.html, /Composite Score: <strong style="color:#16213e">62%<\/strong>/);
  assert.match(mail.html, /Operational Status: <strong style="color:#16213e">MODERATE PERFORMANCE<\/strong>/);
  assert.match(mail.html, /Enterprise Model: <strong style="color:#16213e">Service Based<\/strong>/);
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">Financial Services &amp; FinTech<\/strong>/);
  // Text body carries the same rows.
  assert.ok(mail.text.includes('Enterprise Model: Service Based'));
  assert.ok(mail.text.includes('Industry Sector: Financial Services & FinTech'));
});

test('Manufacturing keeps all four Executive Summary rows, unchanged', () => {
  const mail = mailFor('product', {
    domainLabel: 'Manufacturing',
    businessTypeLabel: 'Product Based',
  });
  assert.equal(rowCount(mail.html), 4, 'Manufacturing keeps four summary rows');
  assert.match(mail.html, /Enterprise Model: <strong style="color:#16213e">Product Based<\/strong>/);
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">Manufacturing<\/strong>/);
  assert.ok(mail.text.includes('Enterprise Model: Product Based'));
  assert.ok(mail.text.includes('Industry Sector: Manufacturing'));
});

test('Services/Manufacturing keep the original row order', () => {
  const mail = mailFor('product', { domainLabel: 'Manufacturing', businessTypeLabel: 'Product Based' });
  const order = ['Composite Score:', 'Operational Status:', 'Enterprise Model:', 'Industry Sector:'];
  let last = -1;
  for (const label of order) {
    const at = mail.html.indexOf(label);
    assert.ok(at > last, `${label} must appear in order`);
    last = at;
  }
});

/* ── Non-Profit ─────────────────────────────────────────────────────────── */

test('Non-Profit omits Enterprise Model and reports Industry Sector: Non-Profit', () => {
  const mail = mailFor('ngo', { businessTypeLabel: 'NGO / Non-Profit' });
  assert.equal(rowCount(mail.html), 3, 'Non-Profit drops the Enterprise Model row');
  assert.ok(!mail.html.includes('Enterprise Model'), 'no Enterprise Model line in html');
  assert.ok(!mail.text.includes('Enterprise Model'), 'no Enterprise Model line in text');
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">Non-Profit<\/strong>/);
  assert.match(mail.text, /Industry Sector: Non-Profit/);
  // The shared rows are untouched.
  assert.match(mail.html, /Composite Score: <strong style="color:#16213e">62%<\/strong>/);
  assert.match(mail.html, /Operational Status: <strong style="color:#16213e">MODERATE PERFORMANCE<\/strong>/);
});

/* ── Startup ────────────────────────────────────────────────────────────── */

test('Startup omits Enterprise Model and reports Industry Sector: Startup', () => {
  const mail = mailFor('startup', { businessTypeLabel: 'Start-Up' });
  assert.equal(rowCount(mail.html), 3, 'Startup drops the Enterprise Model row');
  assert.ok(!mail.html.includes('Enterprise Model'), 'no Enterprise Model line in html');
  assert.ok(!mail.text.includes('Enterprise Model'), 'no Enterprise Model line in text');
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">Startup<\/strong>/);
  assert.match(mail.text, /Industry Sector: Startup/);
  assert.match(mail.html, /Composite Score: <strong style="color:#16213e">62%<\/strong>/);
  assert.match(mail.html, /Operational Status: <strong style="color:#16213e">MODERATE PERFORMANCE<\/strong>/);
});

/* ── Edge cases ─────────────────────────────────────────────────────────── */

test('the business type is read from the result when the session omits it', () => {
  const session = sessionFor(null, { businessTypeLabel: 'NGO / Non-Profit' });
  session.result.businessType = 'ngo';
  const mail = buildReportMail({
    to: 'neha@spark.example',
    session,
    reportRequest: REQUEST,
    overviewBand: BAND,
    overallPercent: 62,
  });
  assert.ok(!mail.html.includes('Enterprise Model'));
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">Non-Profit<\/strong>/);
});

test('an unknown business type keeps the legacy four rows', () => {
  const mail = mailFor('something-else', { domainLabel: 'General', businessTypeLabel: 'Unknown' });
  assert.equal(rowCount(mail.html), 4);
  assert.match(mail.html, /Enterprise Model: <strong style="color:#16213e">Unknown<\/strong>/);
  assert.match(mail.html, /Industry Sector: <strong style="color:#16213e">General<\/strong>/);
});

test('unrelated email copy is untouched for every business type', () => {
  for (const bt of ['service', 'product', 'ngo', 'startup']) {
    const mail = mailFor(bt, { domainLabel: 'Manufacturing', businessTypeLabel: 'X' });
    assert.ok(mail.html.includes('Executive Summary'), `${bt}: Executive Summary heading`);
    assert.ok(mail.html.includes('What’s Inside the Dossier:'), `${bt}: dossier section`);
    assert.ok(mail.html.includes('About Business Profit Architects:'), `${bt}: about section`);
    assert.ok(mail.html.includes('The BYRGOP Advisory Team'), `${bt}: signature`);
    assert.ok(mail.html.includes('Dear Neha Sharma,'), `${bt}: greeting`);
    assert.ok(mail.text.includes('Diagnostic Synthesis:'), `${bt}: text dossier line`);
  }
});
