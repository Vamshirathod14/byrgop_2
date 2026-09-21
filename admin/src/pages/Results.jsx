import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { categoryDisplayName } from '../utils/categories.js';

const empty = (categoryId) => ({
  category: categoryId,
  minScore: 0,
  maxScore: 40,
  title: '',
  interpretation: '',
  recommendations: [''],
  active: true,
});

function ResultForm({ initial, categories, onCancel, onSaved }) {
  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, category: initial.category?._id || initial.category }
      : empty(categories[0]?._id)
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setRec = (i, v) =>
    set({ recommendations: form.recommendations.map((r, idx) => (idx === i ? v : r)) });
  const addRec = () => set({ recommendations: [...form.recommendations, ''] });
  const removeRec = (i) => set({ recommendations: form.recommendations.filter((_, idx) => idx !== i) });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        ...form,
        minScore: Number(form.minScore),
        maxScore: Number(form.maxScore),
        recommendations: form.recommendations.map((r) => r.trim()).filter(Boolean),
      };
      if (initial?._id) await api.updateResult(`/admin/results/${initial._id}`, payload);
      else await api.createResult('/admin/results', payload);
      onSaved();
    } catch (err) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Category</label>
          <select className="input" value={form.category} onChange={(e) => set({ category: e.target.value })} required>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {categoryDisplayName(c.key, c.name)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Min score</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={form.minScore}
            onChange={(e) => set({ minScore: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Max score</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={form.maxScore}
            onChange={(e) => set({ maxScore: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Band title</label>
        <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} required />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Interpretation</label>
        <textarea
          className="input"
          rows={2}
          value={form.interpretation}
          onChange={(e) => set({ interpretation: e.target.value })}
          required
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-mist-muted">Recommendations</label>
          <button type="button" onClick={addRec} className="text-xs text-brand-accentText hover:underline">
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {form.recommendations.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="input" value={r} onChange={(e) => setRec(i, e.target.value)} />
              <button type="button" onClick={() => removeRec(i)} className="text-xs text-red-700 hover:underline">
                remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-mist">
        <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
        Active
      </label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create band'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const [rs, cats] = await Promise.all([api.results(), api.categories()]);
      setResults(rs);
      setCategories(cats);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (r) => {
    if (!window.confirm(`Delete band "${r.title}" (${r.minScore}–${r.maxScore})?`)) return;
    try {
      await api.deleteResult(`/admin/results/${r._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const catName = (id) => categories.find((c) => c._id === id)?.name || '—';

  const grouped = categories.map((c) => ({
    cat: c,
    bands: results.filter((r) => r.category?._id === c._id || r.category === c._id),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Result Content</h1>
          <p className="mt-1 text-sm text-mist-muted">
            Score bands, interpretation and recommendations per category.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : '+ New band'}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-5">
          <ResultForm
            categories={categories}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-6">
        {grouped.map(({ cat, bands }) => (
          <div key={cat._id} className="card">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-mist">
              <span className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
              {categoryDisplayName(cat.key, cat.name)}
            </h2>
            {bands.length === 0 && <p className="mt-2 text-xs text-mist-muted">No bands configured.</p>}
            <div className="mt-3 space-y-3">
              {bands.map((r) => (
                <div key={r._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {editing?._id === r._id ? (
                    <ResultForm
                      initial={r}
                      categories={categories}
                      onCancel={() => setEditing(null)}
                      onSaved={async () => {
                        setEditing(null);
                        await load();
                      }}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge bg-brand-accent/15 text-brand-accentText">
                            {r.minScore}–{r.maxScore}
                          </span>
                          <span className="badge bg-slate-200 text-mist">{r.title}</span>
                          <span
                            className={`badge ${
                              r.active
                                ? 'bg-green-400/15 text-green-700'
                                : 'bg-red-400/15 text-red-700'
                            }`}
                          >
                            {r.active ? 'active' : 'inactive'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-mist-muted">{r.interpretation}</p>
                        {r.recommendations?.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {r.recommendations.map((rec, i) => (
                              <li key={i} className="badge border border-slate-200 text-mist-muted">
                                {rec}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(r)}>
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => remove(r)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
