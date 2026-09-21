import { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { api } from '../api/client.js';
import { adminBrand } from '../theme/brand.js';
import { darkText } from '../utils/color.js';
import { categoryDisplayName } from '../utils/categories.js';

const styl = {
  tooltip: {
    contentStyle: {
      background: adminBrand.ink[800],
      border: `1px solid ${adminBrand.border}`,
      borderRadius: 10,
      fontSize: 12,
      color: adminBrand.text,
    },
    labelStyle: { color: adminBrand.textMuted, fontSize: 11 },
  },
};

const pad = (n) => String(n).padStart(2, '0');
const dstr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fmtDay = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
];

function presetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today':
      return { from: dstr(today), to: dstr(today), label: 'Today' };
    case 'yesterday': {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      return { from: dstr(day), to: dstr(day), label: 'Yesterday' };
    }
    case 'thisWeek': {
      const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
      return { from: dstr(monday), to: dstr(today), label: 'This Week' };
    }
    case 'thisMonth': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: dstr(first), to: dstr(today), label: 'This Month' };
    }
    default:
      return { from: dstr(today), to: dstr(today), label: 'Today' };
  }
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-[0.18em] text-mist-muted">{label}</p>
      <p className="font-display mt-2 text-4xl font-bold" style={{ color: accent || adminBrand.text }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-mist-muted">{sub}</p>}
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-mist">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

const STATUS_BADGE = {
  completed: 'bg-green-400/15 text-green-700',
  in_progress: 'bg-yellow-400/15 text-yellow-700',
  abandoned: 'bg-slate-200 text-mist-muted',
};

const EMAIL_CHIP = {
  sent: 'bg-green-400/15 text-green-700',
  failed: 'bg-red-400/15 text-red-700',
  pending: 'bg-yellow-400/15 text-yellow-700',
  skipped: 'bg-slate-200 text-mist-muted',
  untracked: 'bg-slate-200 text-mist-muted',
};

const EMAIL_LABELS = {
  sent: 'Sent',
  failed: 'Failed',
  pending: 'Pending',
  skipped: 'Skipped',
  untracked: 'Not yet processed',
};

function StatusBadge({ value }) {
  if (!value) return <span className="badge bg-slate-200 text-mist-muted">—</span>;
  return (
    <span className={`badge capitalize ${STATUS_BADGE[value] || 'bg-slate-200 text-mist-muted'}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function EmailChip({ status }) {
  if (!status) return <span className="badge bg-slate-200 text-mist-muted">No request</span>;
  return (
    <span className={`badge ${EMAIL_CHIP[status] || 'bg-slate-200 text-mist-muted'}`}>
      {EMAIL_LABELS[status] || status}
    </span>
  );
}

function StatLine({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <span className="text-sm text-mist">{label}</span>
      <span className="font-display text-lg font-semibold" style={{ color: accent || adminBrand.text }}>
        {value}
      </span>
    </div>
  );
}

export default function Analytics() {
  const [preset, setPreset] = useState('thisMonth');
  const [from, setFrom] = useState(() => presetRange('thisMonth').from);
  const [to, setTo] = useState(() => presetRange('thisMonth').to);
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const applyRange = (f, t) => {
    setFrom(f);
    setTo(t);
  };

  const selectPreset = (key) => {
    const r = presetRange(key);
    setPreset(key);
    setCustom({ from: r.from, to: r.to });
    applyRange(r.from, r.to);
  };

  const customInvalid = preset === 'custom' && (custom.from && custom.to && custom.from > custom.to);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ from, to });
      setData(await api.analytics(`?${params.toString()}`));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (from && to) load();
  }, [load, from, to]);

  const allZero =
    data &&
    data.activity.onboarding.started === 0 &&
    data.activity.onboarding.completed === 0 &&
    data.activity.knowYourself.started === 0 &&
    data.activity.knowYourself.completed === 0 &&
    data.email.requested === 0;

  const pillarChart = (data?.activity?.knowYourself?.pillars || []).map((p) => ({
    name: p.name,
    avgPct: p.avgPct,
    n: p.n,
    color: p.color || adminBrand.palette.blue[400],
  }));

  const domainChart = (data?.activity?.knowYourself?.domains || []).map((d) => ({
    name: d.domain || 'Unknown',
    count: d.n,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Analytics</h1>
          <p className="mt-1 text-sm text-mist-muted">
            Assessment intelligence — activity, report delivery and session detail over a date range.
          </p>
        </div>
        {data && (
          <span className="text-xs text-mist-muted">
            {data.range.from} → {data.range.to}
            {data.range.allTime ? ' (all-time)' : ''}
          </span>
        )}
      </div>

      {/* Date filter */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => selectPreset(p.key)}
              className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                preset === p.key
                  ? 'bg-brand-accent font-semibold text-ink-950'
                  : 'border border-slate-200 text-mist-muted hover:text-mist'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => {
              setPreset('custom');
              setCustom((c) => (c.from && c.to ? c : { from, to }));
            }}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              preset === 'custom'
                ? 'bg-brand-accent font-semibold text-ink-950'
                : 'border border-slate-200 text-mist-muted hover:text-mist'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="input w-auto"
            value={custom.from || from}
            onChange={(e) => {
              setPreset('custom');
              setCustom((c) => ({ ...c, from: e.target.value }));
            }}
          />
          <span className="text-mist-muted">→</span>
          <input
            type="date"
            className="input w-auto"
            value={custom.to || to}
            onChange={(e) => {
              setPreset('custom');
              setCustom((c) => ({ ...c, to: e.target.value }));
            }}
          />
          <button
            className="btn-primary"
            disabled={!custom.from || !custom.to || custom.from > custom.to}
            onClick={() => applyRange(custom.from, custom.to)}
          >
            Apply
          </button>
        </div>
      </div>
      {customInvalid && <p className="mt-2 text-xs text-red-700">From date must be on or before to date.</p>}

      {err && (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-700">
          Failed to load analytics: {err}
        </div>
      )}

      {loading && !data ? (
        <p className="mt-8 text-sm text-mist-muted">Loading analytics…</p>
      ) : (
        data && (
          <div className="mt-5">
            {allZero && (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="font-display text-xl font-semibold text-mist">No activity in this range</p>
                <p className="mt-1 text-sm text-mist-muted">
                  Try a wider date range or a different preset.
                </p>
              </div>
            )}

            {/* Activity summary */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <Kpi label="Onboarding Started" value={data.activity.onboarding.started} />
              <Kpi label="Onboarding Completed" value={data.activity.onboarding.completed} accent={adminBrand.palette.green[700]} />
              <Kpi label="KY Started" value={data.activity.knowYourself.started} />
              <Kpi label="KY Completed" value={data.activity.knowYourself.completed} accent={adminBrand.accentText} />
              <Kpi label="Avg Score · Onboarding" value={data.activity.onboarding.avgScore != null ? `${data.activity.onboarding.avgScore}%` : '—'} accent={adminBrand.palette.blue[700]} sub="completed in range" />
              <Kpi label="Avg Score · KY" value={data.activity.knowYourself.avgScore != null ? `${data.activity.knowYourself.avgScore}%` : '—'} accent={adminBrand.palette.purple[700]} sub="completed in range" />
            </div>

            {/* Report / email activity */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Section title="Report Requests">
                <p className="font-display text-5xl font-bold text-mist">{data.email.requested}</p>
                <p className="mt-1 text-xs text-mist-muted">
                  {data.email.pdfGenerated} PDF generated
                </p>
              </Section>
              <Section title="Delivery Status">
                <div className="flex flex-wrap gap-2">
                  {['sent', 'failed', 'pending', 'skipped', 'untracked'].map((s) => (
                    <span key={s} className={`badge text-xs ${EMAIL_CHIP[s] || 'bg-slate-200 text-mist-muted'}`}>
                      {data.email.byStatus[s] ?? 0} {EMAIL_LABELS[s]}
                    </span>
                  ))}
                </div>
              </Section>
              <Section title="Band Mix (completed KY)">
                <div className="space-y-2">
                  {(data.activity.knowYourself.bands || []).map((b) => (
                    <div key={b.band} className="flex items-center justify-between text-sm">
                      <span className="text-mist-muted">{b.band.toLowerCase()}</span>
                      <span className="font-display text-lg font-semibold text-mist">{b.n}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Insights */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Section title="Six Pillar Averages (completed KY)">
                {pillarChart.some((p) => p.n > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={pillarChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={adminBrand.surface} />
                      <XAxis dataKey="name" tick={{ fill: adminBrand.textMuted, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tick={{ fill: adminBrand.textMuted, fontSize: 10 }} />
                      <Tooltip {...styl.tooltip} formatter={(v, _n, e) => [`${v}% avg (${e.payload?.n ?? 0} sessions)`, '']} />
                      <Bar dataKey="avgPct" radius={[6, 6, 0, 0]}>
                        {pillarChart.map((p, i) => (
                          <Cell key={i} fill={p.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-mist-muted">No completed KY sessions in range</p>
                )}
              </Section>

              <Section title="By Domain (completed KY)">
                {domainChart.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={domainChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={adminBrand.surface} />
                      <XAxis dataKey="name" tick={{ fill: adminBrand.textMuted, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fill: adminBrand.textMuted, fontSize: 10 }} />
                      <Tooltip {...styl.tooltip} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {domainChart.map((_, i) => (
                          <Cell key={i} fill={i % 2 ? adminBrand.accentHover : adminBrand.accent} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-mist-muted">No completed KY sessions in range</p>
                )}
              </Section>

              <Section title="Business Types (completed KY)">
                <div className="space-y-2">
                  {(data.activity.knowYourself.businessTypes || []).map((b) => (
                    <StatLine key={b.type || 'none'} label={b.label} value={b.n} accent={adminBrand.accentText} />
                  ))}
                  {(data.activity.knowYourself.businessTypes || []).length === 0 && (
                    <p className="py-6 text-center text-sm text-mist-muted">No completed KY sessions in range</p>
                  )}
                </div>
              </Section>

              <Section title="Onboarding Areas (completed)">
                <div className="space-y-2">
                  {(data.activity.onboarding.areas || []).map((a) => (
                    <StatLine
                      key={a.key}
                      label={categoryDisplayName(a.key, a.name)}
                      value={a.avgPct != null ? `${a.avgPct}%` : '—'}
                      accent={a.color ? darkText(a.color) : adminBrand.text}
                    />
                  ))}
                  {data.activity.onboarding.completed === 0 && (
                    <p className="py-6 text-center text-sm text-mist-muted">No completed onboarding in range</p>
                  )}
                </div>
              </Section>
            </div>

            {/* Session table */}
            <div className="mt-6">
              <div className="card p-0">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-mist">
                      Assessment Sessions
                    </h2>
                    <p className="mt-0.5 text-xs text-mist-muted">
                      Latest {data.meta.limit} activities in range · emails shown only where contact consent was given ·
                      onboarding completion is recorded at the final update.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-mist-muted">
                      <tr>
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3">Flow</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Business Type</th>
                        <th className="px-4 py-3">Domain</th>
                        <th className="px-4 py-3">Started</th>
                        <th className="px-4 py-3">Completed</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Band</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Report Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.sessions.length === 0 && (
                        <tr>
                          <td colSpan={11} className="px-4 py-6 text-center text-mist-muted">
                            No sessions in this range.
                          </td>
                        </tr>
                      )}
                      {data.sessions.map((s) => (
                        <tr key={`${s.type}-${s.sessionId}`} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-brand-accentText">{s.sessionId}</td>
                          <td className="px-4 py-3 text-mist-muted">{s.source}</td>
                          <td className="px-4 py-3"><StatusBadge value={s.status} /></td>
                          <td className="px-4 py-3 text-mist">{s.businessTypeLabel || '—'}</td>
                          <td className="px-4 py-3 text-mist">{s.domainLabel || '—'}</td>
                          <td className="px-4 py-3 text-mist-muted">{fmtDay(s.startedAt)}</td>
                          <td className="px-4 py-3 text-mist-muted">{fmtDay(s.completedAt)}</td>
                          <td className="px-4 py-3 text-mist">{s.scorePct != null ? `${s.scorePct}%` : '—'}</td>
                          <td className="px-4 py-3 text-mist-muted">{s.band || '—'}</td>
                          <td className="px-4 py-3 text-mist">{s.email || '—'}</td>
                          <td className="px-4 py-3"><EmailChip status={s.emailStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}