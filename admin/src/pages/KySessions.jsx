import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const STATUS = ['all', 'in_progress', 'completed', 'abandoned'];

const PRO_BONO = ['all', 'requested', 'not_requested'];

const REPORT = ['all', 'requested', 'not_requested'];

const BUSINESS_TYPE_LABELS = {
  service: 'Services',
  product: 'Manufacturing',
  ngo: 'Non-Profit',
};

const DOMAIN_LABELS = {
  manufacturing: 'Manufacturing & Industrial Operations',
  retail_ecommerce: 'Retail & E-Commerce',
  professional_services: 'Professional Services & Consulting',
  healthcare_wellness: 'Healthcare & Wellness Operations',
  supply_chain_logistics: 'Supply Chain, Logistics & Distribution',
  technology_saas: 'Technology & SaaS / Digital Products',
  financial_services: 'Financial Services & FinTech',
  real_estate_construction: 'Real Estate, Construction & Infrastructure',
  hospitality_food_beverage: 'Hospitality, Food & Beverage (F&B)',
  franchise_multi_unit: 'Franchise & Multi-Unit Chains',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">{label}</div>
      <div className="mt-0.5 text-mist">{value || '—'}</div>
    </div>
  );
}

export default function KySessions() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [proBono, setProBono] = useState('all');
  const [report, setReport] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [err, setErr] = useState(null);

  const query = () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (proBono !== 'all') params.set('proBono', proBono);
    if (report !== 'all') params.set('reportRequest', report);
    const s = params.toString();
    return s ? `?${s}` : undefined;
  };

  const load = useCallback(async () => {
    try {
      setSessions(await api.kySessions(query()));
    } catch (e) {
      setErr(e.message);
    }
  }, [filter, proBono, report]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-mist">Know Yourself Submissions</h1>
      <p className="mt-1 text-sm text-mist-muted">
        Domain assignment sessions — email, phone, domain, status, score, consent, pro bono requests and timestamps.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          {STATUS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-xs capitalize transition-colors ${
                filter === s
                  ? 'bg-brand-accent text-ink-950 font-semibold'
                  : 'border border-slate-200 text-mist-muted hover:text-mist'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">Pro Bono:</span>
          <div className="flex gap-1 rounded-full border border-slate-200 p-0.5">
            {PRO_BONO.map((p) => (
              <button
                key={p}
                onClick={() => setProBono(p)}
                className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                  proBono === p
                    ? p === 'requested'
                      ? 'bg-green-400 text-ink-950 font-semibold'
                      : 'bg-brand-accent text-ink-950 font-semibold'
                    : 'text-mist-muted hover:text-mist'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">Report:</span>
          <div className="flex gap-1 rounded-full border border-slate-200 p-0.5">
            {REPORT.map((p) => (
              <button
                key={p}
                onClick={() => setReport(p)}
                className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                  report === p
                    ? p === 'requested'
                      ? 'bg-amber-400 text-ink-950 font-semibold'
                      : 'bg-brand-accent text-ink-950 font-semibold'
                    : 'text-mist-muted hover:text-mist'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-mist-muted">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Not Applicable</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Business Type</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Contact Requested</th>
              <th className="px-4 py-3">Pro Bono</th>
              <th className="px-4 py-3">Pro Bono Email</th>
              <th className="px-4 py-3">Pro Bono Phone</th>
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Report Requested At</th>
              <th className="px-4 py-3">Started At</th>
              <th className="px-4 py-3">Completed At</th>
              <th className="px-4 py-3">Contact Submitted At</th>
              <th className="px-4 py-3">Pro Bono Submitted At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={20} className="px-4 py-6 text-center text-mist-muted">
                  No submissions.
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const rr = s.reportRequest;
              const rrRequested = !!(rr && rr.requested);
              const isExpanded = expanded === s._id;
              return (
                <React.Fragment key={s._id}>
                  <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s._id)}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-accentText">{s.sessionId}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge capitalize ${
                          s.stage === 'Result / Completed'
                            ? 'bg-green-400/15 text-green-700'
                            : s.stage === 'Abandoned'
                              ? 'bg-red-400/15 text-red-700'
                              : s.stage === 'Not started'
                                ? 'bg-slate-200 text-mist-muted'
                                : 'bg-yellow-400/15 text-yellow-700'
                        }`}
                      >
                        {s.stage || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mist">
                      {s.answeredCount != null && s.totalQuestions
                        ? `${s.answeredCount} / ${s.totalQuestions}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-mist">
                      {s.notApplicableCount != null && s.notApplicableCount > 0
                        ? s.notApplicableCount
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-mist">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-mist">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-mist">{BUSINESS_TYPE_LABELS[s.businessType] || s.businessType || '—'}</td>
                    <td className="px-4 py-3 text-mist">{DOMAIN_LABELS[s.domain] || s.domain || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge capitalize ${
                          s.status === 'completed'
                            ? 'bg-green-400/15 text-green-700'
                            : s.status === 'in_progress'
                              ? 'bg-yellow-400/15 text-yellow-700'
                              : 'bg-slate-200 text-mist-muted'
                        }`}
                      >
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mist">
                      {s.result ? `${s.result.score}/${s.result.maxScore}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.contactConsent ? (
                        <span className="badge bg-green-400/15 text-green-700 font-semibold">YES</span>
                      ) : (
                        <span className="badge bg-slate-200 text-mist-muted">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.proBonoRequested ? (
                        <span className="badge bg-green-400 px-3 py-1 font-bold text-ink-950 shadow-[0_0_16px_rgba(74,222,128,0.35)]">
                          ★ REQUESTED
                        </span>
                      ) : (
                        <span className="badge bg-slate-200 text-mist-muted">Not requested</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mist">{s.proBonoEmail || '—'}</td>
                    <td className="px-4 py-3 text-mist">{s.proBonoPhone || '—'}</td>
                    <td className="px-4 py-3">
                      {rrRequested ? (
                        <span className="badge bg-amber-400 px-3 py-1 font-bold text-ink-950">YES</span>
                      ) : (
                        <span className="badge bg-slate-200 text-mist-muted">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(rr?.submittedAt)}</td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(s.startedAt)}</td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(s.completedAt)}</td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(s.contactSubmittedAt)}</td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(s.proBonoSubmittedAt)}</td>
                  </tr>
                  {isExpanded && rr && rrRequested && (
                    <tr className="bg-slate-50">
                      <td colSpan={20} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3 lg:grid-cols-4">
                          <Detail label="Owner Name" value={rr.ownerName} />
                          <Detail label="Company Name" value={rr.companyName} />
                          <Detail label="Report Email" value={rr.email} />
                          <Detail label="Website" value={rr.website} />
                          <Detail label="Country Code" value={rr.countryCode} />
                          <Detail label="Phone" value={rr.phone} />
                          <Detail label="Session ID" value={s.sessionId} />
                          <Detail label="Requested At" value={fmtDate(rr.submittedAt)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
