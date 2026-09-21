import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

const ACTION_LABELS = {
  'admin.login': 'Admin login',
  'admin.logout': 'Admin logout',
  'admin.created': 'Admin created',
  'admin.updated': 'Admin updated',
  'admin.deactivated': 'Admin deactivated',
  'admin.activated': 'Admin activated',
  'admin.permissions': 'Permissions changed',
  'admin.deleted': 'Admin deleted',
  'question.created': 'Question created',
  'question.updated': 'Question updated',
  'question.deleted': 'Question deleted',
  'category.created': 'Category created',
  'category.updated': 'Category updated',
  'category.deleted': 'Category deleted',
  'stage.created': 'Stage created',
  'stage.updated': 'Stage updated',
  'stage.deleted': 'Stage deleted',
  'result.created': 'Result created',
  'result.updated': 'Result updated',
  'result.deleted': 'Result deleted',
  'kyq.created': 'KY question created',
  'kyq.updated': 'KY question updated',
  'kyq.deleted': 'KY question deleted',
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (entity) params.set('entity', entity);
      params.set('limit', '100');
      const data = await api.activity(`?${params.toString()}`);
      setLogs(data.logs || []);
    } catch (e) {
      setErr(e.message);
    }
  }, [action, entity]);

  useEffect(() => {
    load();
  }, [load]);

  const entities = ['question', 'category', 'stage', 'result', 'admin', 'kyq'];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Activity Log</h1>
          <p className="mt-1 text-sm text-mist-muted">Audit trail of admin actions</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-48" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select className="input w-40" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">All entities</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

      <div className="mt-6 card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.15em] text-mist-muted">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length ? (
                logs.map((l) => (
                  <tr key={l._id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-mist-muted">{fmtDate(l.timestamp)}</td>
                    <td className="px-4 py-3 text-mist">{l.adminEmail || l.adminId || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-brand-accent/15 text-brand-accentText">
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-mist-muted">
                        {l.entity}{l.entityId ? ` · ${String(l.entityId).slice(-6)}` : ''}
                      </span>
                    </td>
                    <td className="max-w-[320px] px-4 py-3">
                      {l.metadata ? (
                        <span className="font-mono text-xs text-mist-muted">{JSON.stringify(l.metadata)}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-mist-muted">
                    No activity recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}