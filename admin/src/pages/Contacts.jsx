import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

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

export default function Contacts() {
  const [rows, setRows] = useState([]);
  const [domain, setDomain] = useState('all');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (domain !== 'all') params.set('domain', domain);
      params.set('limit', '200');
      const data = await api.kySessions(`?${params.toString()}`);
      setRows((data || []).filter((s) => s.contactConsent));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Contact Requests</h1>
          <p className="mt-1 text-sm text-mist-muted">
            Leads who consented to be contacted after their Know Yourself assessment
          </p>
        </div>
        <select className="input w-64" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="all">All domains</option>
          {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-mist-muted">Loading contacts…</p>
      ) : (
        <div className="mt-6 card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.15em] text-mist-muted">
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((s) => (
                    <tr key={s._id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-mist">{s.email}</p>
                        <p className="text-xs text-mist-muted">{s.sessionId}</p>
                      </td>
                      <td className="px-4 py-3 text-mist">{s.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-mist-muted">
                        {DOMAIN_LABELS[s.domain] || s.domain || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.status === 'completed' ? 'bg-green-400/15 text-green-700' : 'bg-brand-accent/15 text-brand-accentText'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-mist-muted">{fmtDate(s.contactSubmittedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-mist-muted">
                      No contact requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}