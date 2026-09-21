import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const defaultOptions = [
  { text: '', score: 1 },
  { text: '', score: 2 },
  { text: '', score: 3 },
  { text: '', score: 4 },
];

const empty = {
  text: '',
  type: 'generic',
  domain: '',
  active: true,
  options: defaultOptions.map((o) => ({ ...o })),
};

function KYQuestionForm({ initial, domains, onCancel, onSaved }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          text: initial.text,
          type: initial.type || 'generic',
          domain: initial.domain || '',
          active: initial.active,
          options: initial.options.map((o) => ({ text: o.text, score: o.score, active: o.active })),
        }
      : { ...empty }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setOption = (i, patch) =>
    set({ options: form.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        text: form.text,
        type: form.type,
        domain: form.type === 'domain' ? form.domain : null,
        active: form.active,
        options: form.options.map((o) => ({
          text: o.text,
          score: Number(o.score),
          active: o.active !== false,
        })),
      };
      if (initial?._id) await api.updateKYQuestion(`/admin/know-yourself/${initial._id}`, payload);
      else await api.createKYQuestion('/admin/know-yourself', payload);
      onSaved();
    } catch (err) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
          Question text
        </label>
        <textarea
          className="input"
          rows={2}
          value={form.text}
          onChange={(e) => set({ text: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Question Type
          </label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => set({ type: e.target.value, domain: e.target.value === 'generic' ? '' : form.domain })}
          >
            <option value="generic">Generic</option>
            <option value="domain">Domain</option>
          </select>
        </div>
        {form.type === 'domain' && (
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
              Domain
            </label>
            <select
              className="input"
              value={form.domain}
              onChange={(e) => set({ domain: e.target.value })}
              required
            >
              <option value="" disabled>Select domain</option>
              {domains.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-mist-muted">
            Answer options (exactly 4, scores 1–4)
          </label>
        </div>
        <div className="space-y-3">
          {form.options.map((o, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors focus-within:border-brand-accent/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-8 text-center text-xs font-semibold text-mist-muted">
                  {i + 1}.
                </span>
                <input
                  className="input min-w-40 flex-1"
                  placeholder={`Option ${i + 1} text`}
                  value={o.text}
                  onChange={(e) => setOption(i, { text: e.target.value })}
                  required
                />
                <select
                  className="input w-20"
                  value={o.score}
                  onChange={(e) => setOption(i, { score: parseInt(e.target.value, 10) })}
                  required
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-mist-muted">
                  <input
                    type="checkbox"
                    checked={o.active !== false}
                    onChange={(e) => setOption(i, { active: e.target.checked })}
                  />
                  active
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-mist">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set({ active: e.target.checked })}
        />
        Active (available in assessment)
      </label>

      {err && <p className="text-sm text-[#f87171]">{err}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create question'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function KnowYourselfQuestions() {
  const [questions, setQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const [qs, doms] = await Promise.all([api.kyQuestions(), api.kyDomains()]);
      setQuestions(qs);
      setDomains(doms);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (q) => {
    if (!window.confirm(`Delete question "${q.text.slice(0, 60)}…"?`)) return;
    try {
      await api.deleteKYQuestion(`/admin/know-yourself/${q._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const filtered = filterType === 'all' ? questions : questions.filter((q) => q.type === filterType);
  const genericCount = questions.filter((q) => q.type === 'generic' || !q.type).length;
  const domainCount = questions.filter((q) => q.type === 'domain').length;
  const activeGeneric = questions.filter((q) => (q.type === 'generic' || !q.type) && q.active).length;
  const activeDomain = questions.filter((q) => q.type === 'domain' && q.active).length;

  const domainLabel = (key) => domains.find((d) => d.key === key)?.label || key;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Know Yourself</h1>
          <p className="mt-1 text-sm text-mist-muted">
            {genericCount} generic ({activeGeneric} active) · {domainCount} domain ({activeDomain} active)
            {activeGeneric < 10 && (
              <span className="ml-2 text-[#f87171]">(need 10+ generic)</span>
            )}
            {activeDomain < 10 && domainCount > 0 && (
              <span className="ml-2 text-[#f87171]">(need 10+ per domain)</span>
            )}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : '+ New question'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'generic', label: 'Generic' },
          { key: 'domain', label: 'Domain' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === f.key
                ? 'bg-brand-accent/15 text-brand-accent'
                : 'text-mist-muted hover:bg-white/5 hover:text-mist'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {err && <p className="mt-3 text-sm text-[#f87171]">{err}</p>}

      {showCreate && (
        <div className="mt-5">
          <KYQuestionForm
            domains={domains}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && <p className="text-mist-muted">No questions yet.</p>}
        {filtered.map((q) => (
          <div key={q._id} className="card">
            {editing?._id === q._id ? (
              <KYQuestionForm
                initial={q}
                domains={domains}
                onCancel={() => setEditing(null)}
                onSaved={async () => {
                  setEditing(null);
                  await load();
                }}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`badge ${
                        q.type === 'domain' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {q.type === 'domain' ? 'Domain' : 'Generic'}
                    </span>
                    {q.type === 'domain' && q.domain && (
                      <span className="badge bg-white/10 text-mist text-[10px]">
                        {domainLabel(q.domain)}
                      </span>
                    )}
                    <span
                      className={`badge ${
                        q.active ? 'bg-[#4ade80]/15 text-[#4ade80]' : 'bg-[#f87171]/15 text-[#f87171]'
                      }`}
                    >
                      {q.active ? 'active' : 'inactive'}
                    </span>
                    <span className="badge bg-white/10 text-mist">
                      {q.options.filter((o) => o.active !== false).length} options
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-mist">{q.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {q.options.map((o, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${
                          o.active !== false ? 'border-white/15 text-mist-muted' : 'border-white/5 text-mist-muted/40'
                        }`}
                      >
                        <span className="font-medium">{o.text}</span>
                        <span className="opacity-60">· {o.score}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(q)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => remove(q)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
