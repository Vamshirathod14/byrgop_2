import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { adminBrand } from '../theme/brand.js';

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

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function Dashboard() {
  const { admin } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.dashboard());
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (err) return <div className="text-red-700">Failed to load dashboard: {err}</div>;
  if (!data) return <p className="text-mist-muted">Loading dashboard…</p>;

  const { kpis, recentAssessments, recentContacts, recentActivity, domainDistribution, scoreDistribution, scoreBuckets, completionRate } = data;

  const scoreChartData = (scoreBuckets || []).map((b) => ({
    label: b.label,
    count: b.value,
  }));

  const domainChartData = (domainDistribution || []).map((d) => ({
    name: (d.domain || d._id || '').replace(/_/g, ' '),
    count: d.value,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">
            Welcome back, {admin.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-mist-muted">
            Business Profit Architects — assessment intelligence
          </p>
        </div>
        <span className="text-xs text-mist-muted">Last updated {fmtDate(Date.now())}</span>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Total Assessments" value={kpis?.totalAssessments ?? '—'} sub="all-time" />
        <Kpi label="Completed" value={kpis?.completedAssessments ?? '—'} accent={adminBrand.palette.green[700]} sub={`${completionRate ?? 0}% completion`} />
        <Kpi label="Know Yourself" value={kpis?.knowYourselfAssessments ?? '—'} accent={adminBrand.accentText} sub="submissions" />
        <Kpi label="Contact Requests" value={kpis?.contactRequests ?? '—'} accent={adminBrand.palette.orange[700]} sub="lead capture" />
        <Kpi label="Today" value={kpis?.todayAssessments ?? '—'} accent={adminBrand.palette.blue[700]} sub="assessments started" />
      </div>

      {kpis?.avgScore !== undefined && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Section title="Average Score">
            <p className="font-display text-5xl font-bold text-mist">{Math.round(kpis.avgScore)}%</p>
            <p className="mt-1 text-xs text-mist-muted">mean across completed assessments</p>
          </Section>
          <Section title="Completion Rate">
            <p className="font-display text-5xl font-bold text-mist">{completionRate ?? 0}%</p>
            <p className="mt-1 text-xs text-mist-muted">completed vs. started</p>
          </Section>
          <Section title="Timed-out Answers">
            <p className="font-display text-5xl font-bold text-mist">{kpis.totalTimedOutAnswers ?? 0}</p>
            <p className="mt-1 text-xs text-mist-muted">questions that ran out of time</p>
          </Section>
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="By Domain (completed)">
          {domainChartData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={domainChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={adminBrand.surface} />
                <XAxis dataKey="name" tick={{ fill: adminBrand.textMuted, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: adminBrand.textMuted, fontSize: 10 }} />
                <Tooltip {...styl.tooltip} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {domainChartData.map((_, i) => (
                    <Cell key={i} fill={i % 2 ? adminBrand.accentHover : adminBrand.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-mist-muted">No completed domain assessments yet</p>
          )}
        </Section>

        <Section title="Score Distribution">
          {scoreChartData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scoreChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={adminBrand.surface} />
                <XAxis dataKey="label" tick={{ fill: adminBrand.textMuted, fontSize: 10 }} />
                <YAxis tick={{ fill: adminBrand.textMuted, fontSize: 10 }} />
                <Tooltip {...styl.tooltip} />
                <Bar dataKey="count" fill={adminBrand.palette.blue[400]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-mist-muted">No completed scores yet</p>
          )}
        </Section>
      </div>

      {/* Recent lists */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Recent Assessments">
          {(recentAssessments || []).length ? (
            <ul className="space-y-2">
              {recentAssessments.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="truncate">
                    <span className="font-mono text-mist">{a.sessionId}</span>
                    <span className="ml-2 text-xs text-mist-muted">{a.status}</span>
                  </span>
                  <span className="shrink-0 text-xs text-mist-muted">{fmtDate(a.updatedAt || a.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-mist-muted">No assessments yet</p>
          )}
        </Section>

        <Section title="Recent Contacts">
          {(recentContacts || []).length ? (
            <ul className="space-y-2">
              {recentContacts.map((c, i) => (
                <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-mist">{c.email}</p>
                  <p className="text-xs text-mist-muted">{c.phone || 'no phone'} · {fmtDate(c.contactSubmittedAt || c.updatedAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-mist-muted">No contact requests yet</p>
          )}
        </Section>

        <Section title="Recent Activity">
          {(recentActivity || []).length ? (
            <ul className="space-y-2">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-mist">
                    <span className="font-semibold capitalize">{a.action}</span>
                    <span className="ml-1 text-xs text-mist-muted">
                      {a.entity} {a.entityId ? `· ${String(a.entityId).slice(-6)}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-mist-muted">{fmtDate(a.timestamp || a.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-mist-muted">No admin activity yet</p>
          )}
        </Section>
      </div>
    </div>
  );
}