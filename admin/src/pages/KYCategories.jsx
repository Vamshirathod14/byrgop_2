import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';

const empty = { name: '', description: '', color: brand.palette.blue[500], sortOrder: 0, active: true };

function CategoryForm({ initial, nextSortOrder, onCancel, onSaved }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          description: initial.description || '',
          color: initial.color || brand.palette.blue[500],
          sortOrder: initial.sortOrder ?? 0,
          active: initial.active,
        }
      : { ...empty, sortOrder: nextSortOrder }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };
      if (isEdit) await api.updateKYCategory(`/admin/know-yourself/categories/${initial._id}`, payload);
      else await api.createKYCategory('/admin/know-yourself/categories', payload);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Category name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Strategic Direction"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Colour</label>
            <input
              className="input font-mono"
              value={form.color}
              onChange={(e) => set({ color: e.target.value })}
              pattern="#[0-9a-fA-F]{6}"
              title="#RRGGBB"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Order</label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set({ sortOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Description</label>
        <textarea
          className="input"
          rows={2}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-mist">
        <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
        Active (used for scoring and results)
      </label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function KYCategories() {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setCategories(await api.kyCategories());
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const move = async (cat, dir) => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const idx = sorted.findIndex((c) => c._id === cat._id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];
    setBusyId(cat._id);
    try {
      await api.reorderKYCategories(reordered.map((c, i) => ({ id: c._id, sortOrder: i + 1 })));
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (c) => {
    setBusyId(c._id);
    try {
      await api.updateKYCategory(`/admin/know-yourself/categories/${c._id}`, { active: !c.active });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setBusyId(c._id);
    try {
      await api.deleteKYCategory(`/admin/know-yourself/categories/${c._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = categories.filter((c) => c.active).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">KY Result Categories</h1>
          <p className="mt-1 text-sm text-mist-muted">
            {categories.length} categories · {activeCount} active — the six dimensions scored by the Know Yourself assessment
          </p>
        </div>
        {!showCreate && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New category
          </button>
        )}
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-6">
          <CategoryForm
            nextSortOrder={categories.length + 1}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {[...categories]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
          .map((c, i, arr) => (
            <div key={c._id} className="card">
              {editing?._id === c._id ? (
                <CategoryForm
                  initial={c}
                  onCancel={() => setEditing(null)}
                  onSaved={async () => {
                    setEditing(null);
                    await load();
                  }}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="mt-1 h-9 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-mist">{c.name}</h2>
                        <span className={`badge shrink-0 ${c.active ? 'bg-green-400/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="badge bg-slate-50 font-mono text-[10px] text-mist-muted">{c.key}</span>
                      </div>
                      {c.description && <p className="mt-1 text-xs text-mist-muted">{c.description}</p>}
                      <p className="mt-1 text-[11px] text-mist-muted/80">order #{c.sortOrder}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      className="btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-30"
                      disabled={i === 0 || busyId === c._id}
                      onClick={() => move(c, -1)}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-30"
                      disabled={i === arr.length - 1 || busyId === c._id}
                      onClick={() => move(c, 1)}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                    <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busyId === c._id} onClick={() => toggleActive(c)}>
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-danger" disabled={busyId === c._id} onClick={() => remove(c)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {categories.length === 0 && !showCreate && !err && (
        <p className="mt-10 text-center text-sm text-mist-muted">
          No categories yet. The six default categories are created automatically when the first assessment runs.
        </p>
      )}
    </div>
  );
}
