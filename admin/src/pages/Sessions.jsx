import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { categoryDisplayName } from '../utils/categories.js';

const STATUS = ['all', 'in_progress', 'completed', 'abandoned'];

function SessionDetail({ session, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="btn-ghost mb-4">
        ← Back
      </button>
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-mist">{session.sessionId}</h2>
          <span className="badge bg-brand-accent/15 text-brand-accentText">{session.status}</span>
        </div>
        <p className="mt-1 text-xs text-mist-muted">
          Created {new Date(session.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(session.result?.scores || []).map((s) => (
          <div key={s.categoryKey} className="card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: s.color }}>
                {categoryDisplayName(s.categoryKey, s.categoryName)}
              </span>
              <span className="font-display text-2xl font-bold text-mist">{s.score}%</span>
            </div>
            {s.content && <p className="mt-2 text-xs text-mist-muted">{s.content.title} · {s.content.interpretation}</p>}
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <h3 className="mb-3 font-display text-xs uppercase tracking-[0.18em] text-mist-muted">Answer log</h3>
        <div className="space-y-2">
          {(session.answers || []).map((a, i) => (
            <div key={i} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div>
                <p className="font-medium capitalize text-mist">{categoryDisplayName(a.categoryKey, a.categoryKey)}</p>
                <p className="text-mist-muted">{a.questionText}</p>
              </div>
              <div className="shrink-0 text-right">
                {a.timedOut ? (
                  <span className="badge bg-red-400/15 text-red-700">timed out</span>
                ) : (
                  <span className="badge bg-green-400/15 text-green-700">{a.optionText} · {a.score}pt</span>
                )}
                <p className="mt-1 text-[10px] text-mist-muted">w={a.weight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setSessions(await api.sessions(filter === 'all' ? undefined : filter));
    } catch (e) {
      setErr(e.message);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  if (selected) {
    return <SessionDetail session={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-mist">Assessment Sessions</h1>
      <p className="mt-1 text-sm text-mist-muted">Submitted answers and results for review.</p>

      <div className="mt-4 flex gap-2">
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

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-mist-muted">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Overall</th>
              <th className="px-4 py-3">Timed out</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-mist-muted">
                  No sessions.
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-brand-accentText">{s.sessionId}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-slate-200 capitalize text-mist">{s.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-mist">{s.result ? `${s.result.overallPct}%` : '—'}</td>
                <td className="px-4 py-3 text-mist-muted">{s.result?.totalTimedOut ?? 0}</td>
                <td className="px-4 py-3 text-mist-muted">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button className="btn-ghost px-3 py-1 text-xs" onClick={() => setSelected(s)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
