import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const ATTENDANCE = ['all', 'attended', 'not_attended'];
const QR_VALID = ['all', 'valid', 'expired'];

const MEMBER_OPTIONS = ['all', 'vamshi'];

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function Badge({ tone, children }) {
  const cls =
    tone === 'green'
      ? 'bg-green-400/15 text-green-700'
      : tone === 'red'
        ? 'bg-red-400/15 text-red-700'
        : 'bg-slate-200 text-mist-muted';
  return <span className={`badge ${cls}`}>{children}</span>;
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">{label}</div>
      <div className="mt-0.5 text-mist">{value || '—'}</div>
    </div>
  );
}

function AttendanceRow({ v, index }) {
  return (
    <tr className="border-b border-slate-200 last:border-0">
      <td className="whitespace-nowrap px-2 py-2">
        <div className="text-mist">Visitor {index + 1}</div>
        <div className="font-mono text-[11px] text-brand-accentText">{v.visitorId}</div>
      </td>
      <td className="px-2 py-2 text-mist">{v.name}</td>
      <td className="px-2 py-2 text-mist">{v.email || '—'}</td>
      <td className="px-2 py-2 text-mist">{v.attendanceStatus === 'attended' ? 'Attended' : 'Not attended'}</td>
      <td className="px-2 py-2 text-mist-muted">{fmtDate(v.attendedAt)}</td>
    </tr>
  );
}

export default function Visitors() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState('all');
  const [qrValid, setQrValid] = useState('all');
  const [member, setMember] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailErr, setDetailErr] = useState(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (attendance !== 'all') params.set('attendance', attendance);
    if (qrValid !== 'all') params.set('qrValid', qrValid);
    if (member !== 'all') params.set('member', member);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const s = params.toString();
    return s ? `?${s}` : '';
  }, [search, attendance, qrValid, member, from, to]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await api.visitors(query);
      setRows(data.registrations || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const expand = async (visitorId) => {
    if (expanded === visitorId) {
      setExpanded(null);
      setDetail(null);
      setDetailErr(null);
      return;
    }
    setExpanded(visitorId);
    setDetail(null);
    setDetailErr(null);
    try {
      setDetail(await api.getVisitor(visitorId));
    } catch (e) {
      setDetailErr(e.message);
    }
  };

  const hasFilters = Boolean(search || attendance !== 'all' || qrValid !== 'all' || member !== 'all' || from || to);

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-mist">Visitors</h1>
        <p className="mt-1 text-sm text-mist-muted">
          12th Anniversary registration &amp; QR attendance. Registration window: 23 Sep – 1 Oct 2026.
        </p>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-2">
            <input
              className="input"
              style={{ width: 240 }}
              placeholder="Search name / phone / email / business…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput.trim())}
            />
            <button className="btn-ghost" onClick={() => setSearch(searchInput.trim())}>Search</button>
            {search && (
              <button className="btn-ghost" onClick={() => { setSearch(''); setSearchInput(''); }}>Clear</button>
            )}
          </div>

          <label className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">
            Attendance
            <div className="mt-1 flex gap-1 rounded-full border border-slate-200 p-0.5">
              {ATTENDANCE.map((a) => (
                <button
                  key={a}
                  onClick={() => setAttendance(a)}
                  className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                    attendance === a
                      ? a === 'attended'
                        ? 'bg-green-400 text-ink-950 font-semibold'
                        : a === 'not_attended'
                          ? 'bg-brand-accent text-ink-950 font-semibold'
                          : 'bg-slate-200 text-ink-950 font-semibold'
                      : 'text-mist-muted hover:text-mist'
                  }`}
                >
                  {a.replace('_', ' ')}
                </button>
              ))}
            </div>
          </label>

          <label className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">
            QR
            <div className="mt-1 flex gap-1 rounded-full border border-slate-200 p-0.5">
              {QR_VALID.map((q) => (
                <button
                  key={q}
                  onClick={() => setQrValid(q)}
                  className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                    qrValid === q
                      ? q === 'expired'
                        ? 'bg-red-400 text-ink-950 font-semibold'
                        : 'bg-green-400 text-ink-950 font-semibold'
                      : 'text-mist-muted hover:text-mist'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </label>

          <label className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">
            Member
            <select className="input mt-1" style={{ width: 150 }} value={member} onChange={(e) => setMember(e.target.value)}>
              {MEMBER_OPTIONS.map((m) => (
                <option key={m} value={m}>{m === 'all' ? 'All members' : 'Vamshi (V Soft)'}</option>
              ))}
            </select>
          </label>

          <label className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">
            From
            <input type="date" className="input mt-1" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label className="text-[11px] uppercase tracking-[0.15em] text-mist-muted">
            To
            <input type="date" className="input mt-1" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </div>

      {hasFilters && (
        <p className="mt-3 text-xs text-mist-muted">
          Showing <strong>{total}</strong> visitor{total === 1 ? '' : 's'} for the current filters.
        </p>
      )}

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-mist-muted">
            <tr>
              <th className="px-4 py-3">Visitor</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Registration Date</th>
              <th className="px-4 py-3">QR Status</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Attendance Date/Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-mist-muted">Loading visitors…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-mist-muted">
                  No visitors match the current filters.
                </td>
              </tr>
            )}
            {rows.map((v) => {
              const isExpanded = expanded === v.visitorId;
              return (
                <React.Fragment key={v.visitorId}>
                  <tr className="cursor-pointer hover:bg-slate-50" onClick={() => expand(v.visitorId)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-mist">{v.name}</div>
                      <div className="font-mono text-[11px] text-brand-accentText">{v.visitorId}</div>
                    </td>
                    <td className="px-4 py-3 text-mist">{v.phone}</td>
                    <td className="px-4 py-3 text-mist">{v.email || '—'}</td>
                    <td className="px-4 py-3 text-mist">{v.businessName}</td>
                    <td className="px-4 py-3 text-mist">{v.category}</td>
                    <td className="px-4 py-3 text-mist">{v.memberName}</td>
                    <td className="px-4 py-3 text-mist">{v.companyName}</td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(v.registeredAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={v.qrStatus === 'valid' ? 'green' : v.qrStatus === 'expired' ? 'red' : 'grey'}>
                        {v.qrStatus === 'not_yet_valid' ? 'not yet valid' : v.qrStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={v.attendanceStatus === 'attended' ? 'green' : 'grey'}>
                        {v.attendanceStatus === 'attended' ? 'Attended' : 'Not attended'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-mist-muted">{fmtDate(v.attendedAt)}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50">
                      <td colSpan={11} className="px-4 py-4">
                        {detailErr && <p className="text-sm text-red-700">{detailErr}</p>}
                        {!detail && !detailErr && <p className="text-sm text-mist-muted">Loading details…</p>}
                        {detail && (
                          <div className="text-sm">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3 lg:grid-cols-5">
                              <Detail label="Registration ID" value={detail.registration.registrationId} />
                              <Detail label="Member" value={detail.registration.memberName} />
                              <Detail label="Company" value={detail.registration.companyName} />
                              <Detail label="Registered" value={fmtDate(detail.registration.registeredAt)} />
                              <Detail label="Registered Date" value={fmtDateOnly(detail.registration.registeredAt)} />
                              <Detail label="Visitors in Registration" value={detail.registration.visitorCount} />
                              <Detail label="This Visitor" value={detail.visitor.name} />
                              <Detail label="Phone" value={detail.visitor.phone} />
                              <Detail label="Email" value={detail.visitor.email} />
                              <Detail label="Category" value={detail.visitor.category} />
                            </div>
                            <h3 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-mist-muted">
                              All visitors in this registration
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full min-w-[560px] text-sm">
                                <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-mist-muted">
                                  <tr>
                                    <th className="px-3 py-2">Visitor</th>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Attendance</th>
                                    <th className="px-3 py-2">Attended At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.registration.visitors.map((sib, i) => (
                                    <AttendanceRow key={sib.visitorId} v={sib} index={i} />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
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