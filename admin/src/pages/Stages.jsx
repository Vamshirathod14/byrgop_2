import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';
import { StageDot, stageColour } from '../components/StageChip.jsx';

const empty = { key: '', name: '', color: brand.palette.blue[500], sortOrder: 1, active: true };

function StageForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = { ...form, key: form.key.trim().toLowerCase(), sortOrder: Number(form.sortOrder) };
      if (initial?._id) await api.updateStage(`/admin/stages/${initial._id}`, payload);
      else await api.createStage('/admin/stages', payload);
      onSaved();
    } catch (err) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Key</label>
          <input
            className="input"
            value={form.key}
            placeholder="e.g. due-diligence"
            onChange={(e) => set({ key: e.target.value })}
            disabled={!!initial?._id}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Sort order</label>
          <input
            type="number"
            className="input"
            value={form.sortOrder}
            onChange={(e) => set({ sortOrder: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Name</label>
        <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
          Color (stage badge &amp; result stage color)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color}
            onChange={(e) => set({ color: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-slate-200 bg-transparent"
          />
          <input className="input" value={form.color} onChange={(e) => set({ color: e.target.value })} />
          <StageDot color={form.color} size={16} />
          {stageColour(form.color) && (
            <span className="text-xs capitalize text-mist">{stageColour(form.color).name}</span>
          )}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-mist">
        <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
        Active
      </label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create stage'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Stages() {
  const [stages, setStages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setStages(await api.stages());
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (s) => {
    if (!window.confirm(`Delete stage "${s.name}"? Questions/answers keep their stage snapshots.`)) return;
    try {
      await api.deleteStage(`/admin/stages/${s._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">BYRGOP Stages</h1>
          <p className="mt-1 text-sm text-mist-muted">
            Six consultancy phases: Initiation → Due Diligence → Analysis → Recommendations → Implementation → Monitoring.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : '+ New stage'}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-5">
          <StageForm
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {stages.length === 0 && <p className="text-mist-muted">No stages yet.</p>}
        {stages.map((s) => (
          <div key={s._id} className="card">
            {editing?._id === s._id ? (
              <StageForm
                initial={s}
                onCancel={() => setEditing(null)}
                onSaved={async () => {
                  setEditing(null);
                  await load();
                }}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <StageDot color={s.color} size={16} />
                  <h2 className="font-display text-xl font-semibold text-mist">{s.name}</h2>
                  <span className={`badge ${s.active ? 'bg-green-400/15 text-green-700' : 'bg-red-400/15 text-red-700'}`}>
                    {s.active ? 'active' : 'inactive'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-mist-muted">key: {s.key}</p>
                <p className="mt-1 text-xs text-mist-muted">
                  sort: {s.sortOrder}
                  {stageColour(s.color) && <span className="ml-2 capitalize text-mist">{stageColour(s.color).name}</span>}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(s)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => remove(s)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}