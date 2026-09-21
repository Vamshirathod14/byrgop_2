import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function WebsiteContacts() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.websiteContacts());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-mist">Website Contacts</h1>
        <p className="mt-1 text-sm text-mist-muted">
          General contact requests from the About page — visitors who reached out directly.
        </p>
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
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((c) => (
                    <tr key={c._id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-mist">{c.email}</td>
                      <td className="px-4 py-3 text-mist">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-mist-muted">{fmtDate(c.submittedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-mist-muted">
                      No website contacts yet
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