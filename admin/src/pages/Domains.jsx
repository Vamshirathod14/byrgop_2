import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';

const empty = { name: '', slug: '', description: '', active: true, businessTypeId: '' };

function DomainForm({ initial, businessTypes = [], onCancel, onSaved }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description || '',
          active: initial.active,
          businessTypeId: initial.businessTypeId || '',
        }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const autoSlug = (name) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/_/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || autoSlug(form.name),
        description: form.description.trim(),
        active: form.active,
        businessTypeId: form.businessTypeId || null,
      };
      if (isEdit) await api.updateDomain(`/admin/domains/${initial._id}`, payload);
      else await api.createDomain('/admin/domains', payload);
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
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Business Type
          </label>
          <select
            className="input"
            value={form.businessTypeId}
            onChange={(e) => set({ businessTypeId: e.target.value })}
            required
          >
            <option value="" disabled>
              Select business type
            </option>
            {businessTypes
              .filter((bt) => bt.active)
              .map((bt) => (
                <option key={bt._id} value={bt._id}>
                  {bt.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Domain name
          </label>
          <input
            className="input"
            value={form.name}
            onChange={(e) =>
              set(isEdit ? { name: e.target.value } : { name: e.target.value, slug: autoSlug(e.target.value) })
            }
            placeholder="e.g. Manufacturing"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Slug {!isEdit && <span className="normal-case text-mist-muted/80">(auto-filled)</span>}
          </label>
          <input
            className="input font-mono"
            value={form.slug}
            onChange={(e) => set({ slug: e.target.value })}
            placeholder="e.g. manufacturing"
            pattern="[a-z0-9-]+"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
          Description
        </label>
        <textarea
          className="input"
          rows={2}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      {!isEdit && (
        <label className="flex items-center gap-2 text-sm text-mist">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set({ active: e.target.checked })}
            className="accent-brand-accent"
          />
          Active
        </label>
      )}
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create domain'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const [doms, bts] = await Promise.all([
        api.domains(),
        api.businessTypes().catch(() => []),
      ]);
      setDomains(doms);
      setBusinessTypes(bts);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  const btName = (id) => businessTypes.find((b) => b._id === id)?.name;

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (d) => {
    try {
      await api.updateDomain(`/admin/domains/${d._id}`, { active: !d.active });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const remove = async (d) => {
    try {
      const res = await api.deleteDomain(`/admin/domains/${d._id}`);
      const parts = [];
      if (res.deleted?.questions) parts.push(`${res.deleted.questions} question(s)`);
      if (res.deleted?.sessions) parts.push(`${res.deleted.sessions} session(s)`);
      setErr(
        parts.length
          ? `Deleted "${d.name}" along with ${parts.join(' and ')}.`
          : null
      );
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const activeCount = domains.filter((d) => d.active).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Business Domains</h1>
          <p className="mt-1 text-sm text-mist-muted">
            {domains.length} domains · {activeCount} active — used by the Know Yourself assessment
          </p>
        </div>
        {!showCreate && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New domain
          </button>
        )}
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-6">
          <DomainForm
            businessTypes={businessTypes}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {domains.map((d) => (
          <div key={d._id} className="card">
            {editing?._id === d._id ? (
              <DomainForm
                initial={d}
                businessTypes={businessTypes}
                onCancel={() => setEditing(null)}
                onSaved={async () => {
                  setEditing(null);
                  await load();
                }}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold text-mist">{d.name}</h2>
                    <p className="mt-0.5 font-mono text-xs text-mist-muted">{d.slug}</p>
                    {d.businessTypeId && (
                      <p className="mt-1 text-[11px] font-medium" style={{ color: brand.accentText }}>
                        ⬢ {btName(d.businessTypeId) || 'Business type'}
                      </p>
                    )}
                  </div>
                  <span className={`badge shrink-0 ${d.active ? 'bg-green-400/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
                    {d.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {d.description && <p className="mt-2 text-xs text-mist-muted">{d.description}</p>}
                <div className="mt-4 flex gap-2">
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(d)}>
                    Edit
                  </button>
                  <button
                    className="btn-ghost px-3 py-1.5 text-xs"
                    onClick={() => toggleActive(d)}
                  >
                    {d.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      if (!window.confirm(`Delete domain "${d.name}"?\n\nThis will also remove all associated questions and sessions.`)) return;
                      remove(d);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {domains.length === 0 && !showCreate && !err && (
        <p className="mt-10 text-center text-sm text-mist-muted">
          No domains yet. Create one to make it available in the assessment.
        </p>
      )}
    </div>
  );
}