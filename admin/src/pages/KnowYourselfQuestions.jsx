import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';
import { darkText } from '../utils/color.js';

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
  category: '',
  businessType: '',
  active: true,
  options: defaultOptions.map((o) => ({ ...o })),
  glossary: [],
};

function KYQuestionForm({ initial, domains, categories = [], businessTypes = [], onCancel, onSaved }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          text: initial.text,
          type: initial.type || 'generic',
          domain: initial.domain || '',
          category: initial.category || '',
          businessType: initial.businessType || '',
          active: initial.active,
          options: initial.options.map((o) => ({ text: o.text, score: o.score, active: o.active })),
          glossary: (initial.glossary || []).map((g) => ({
            abbreviation: g.abbreviation || '',
            fullForm: g.fullForm || '',
          })),
        }
      : { ...empty }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setOption = (i, patch) =>
    set({ options: form.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });
  const setGlossary = (i, patch) =>
    set({ glossary: form.glossary.map((g, idx) => (idx === i ? { ...g, ...patch } : g)) });
  const addGlossary = () =>
    set({ glossary: [...form.glossary, { abbreviation: '', fullForm: '' }] });
  const removeGlossary = (i) =>
    set({ glossary: form.glossary.filter((_, idx) => idx !== i) });

  // Domains belonging to the currently selected business type (DB relationship).
  const selectedBt = businessTypes.find((bt) => bt.key === form.businessType);
  const domainsForType = selectedBt
    ? domains.filter((d) => String(d.businessTypeId || '') === String(selectedBt._id))
    : domains;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      // Collapse completely blank glossary rows; reject partially filled ones.
      const glossary = form.glossary
        .filter((g) => g.abbreviation.trim() || g.fullForm.trim())
        .map((g) => ({
          abbreviation: g.abbreviation.trim(),
          fullForm: g.fullForm.trim(),
        }));
      for (const g of glossary) {
        if (!g.abbreviation || !g.fullForm) {
          setErr('Each glossary row needs both an abbreviation and its full form.');
          setSaving(false);
          return;
        }
      }
      const seen = new Set();
      for (const g of glossary) {
        const key = g.abbreviation.toLowerCase();
        if (seen.has(key)) {
          setErr(`Duplicate glossary abbreviation: ${g.abbreviation}`);
          setSaving(false);
          return;
        }
        seen.add(key);
      }
      const payload = {
        text: form.text,
        type: form.type,
        domain: form.type === 'domain' ? form.domain : null,
        category: form.category || null,
        businessType: form.businessType || null,
        active: form.active,
        options: form.options.map((o) => ({
          text: o.text,
          score: Number(o.score),
          active: o.active !== false,
        })),
        glossary,
      };
      if (!payload.category) {
        setErr('Select a result category.');
        setSaving(false);
        return;
      }
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
          <>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
                Business Type
              </label>
              <select
                className="input"
                value={form.businessType}
                onChange={(e) =>
                  set({
                    businessType: e.target.value,
                    domain: '', // reset — domain must belong to the chosen type
                  })
                }
                required
              >
                <option value="" disabled>Select business type</option>
                {businessTypes.filter((bt) => bt.active).map((bt) => (
                  <option key={bt._id} value={bt.key}>
                    {bt.name}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="" disabled>
                  {form.businessType ? 'Select domain' : 'Select business type first'}
                </option>
                {domainsForType.map((d) => (
                  <option key={d._id || d.slug} value={d.slug}>
                    {d.name}{d.active === false ? ' (inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Result Category
          </label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => set({ category: e.target.value })}
            required
          >
            <option value="" disabled>Select category</option>
            {categories.filter((c) => c.active).map((c) => (
              <option key={c._id} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Business Type {form.type === 'generic' && <span className="normal-case text-mist-muted/80">(optional)</span>}
          </label>
          <select
            className="input"
            value={form.businessType}
            onChange={(e) =>
              set({ businessType: e.target.value, domain: form.type === 'domain' ? '' : form.domain })
            }
            disabled={form.type === 'domain'}
          >
            <option value="">Any business type</option>
            {businessTypes.filter((bt) => bt.active).map((bt) => (
              <option key={bt._id} value={bt.key}>{bt.name}</option>
            ))}
          </select>
        </div>
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
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-brand-accent/40"
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

      {/* Question-level glossary / abbreviations */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-mist-muted">
            Glossary / Abbreviations (optional)
          </label>
          <button
            type="button"
            onClick={addGlossary}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            + Add abbreviation
          </button>
        </div>
        <p className="mb-3 text-xs text-mist-muted/85">
          Define abbreviations used in this question or its options. Each appears as a
          hover / tap tooltip for participants. Add each abbreviation only once per question.
        </p>
        <div className="space-y-3">
          {form.glossary.map((g, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-brand-accent/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="input w-36"
                  placeholder="Abbreviation (e.g. MES)"
                  value={g.abbreviation}
                  onChange={(e) => setGlossary(i, { abbreviation: e.target.value })}
                  required
                />
                <input
                  className="input min-w-40 flex-1"
                  placeholder="Full form (e.g. Manufacturing Execution System)"
                  value={g.fullForm}
                  onChange={(e) => setGlossary(i, { fullForm: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeGlossary(i)}
                  className="btn-danger px-3 py-2 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {form.glossary.length === 0 && (
            <p className="text-xs text-mist-muted/85">No abbreviations defined for this question.</p>
          )}
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

      {err && <p className="text-sm text-red-700">{err}</p>}

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
  const [categories, setCategories] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  // Category navigation (reuses the existing question fields: type/domain/category/businessType).
  const [topTab, setTopTab] = useState('all'); // all | generic | service | product | ngo | domain
  const [pillar, setPillar] = useState('all'); // 'all' or a KYCategory key (pillar)
  const [domainFilter, setDomainFilter] = useState('all'); // 'all' or a domain slug
  const [search, setSearch] = useState('');
  const [err, setErr] = useState(null);

  // Bulk upload state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useCallback((node) => { fileInputRef.current = node; }, []);

  const load = useCallback(async () => {
    try {
      const [qs, doms, cats, bts] = await Promise.all([
        api.kyQuestions(),
        api.domains(),
        api.kyCategories().catch(() => []),
        api.businessTypes().catch(() => []),
      ]);
      setQuestions(Array.isArray(qs) ? qs : []);
      setDomains(Array.isArray(doms) ? doms : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setBusinessTypes(Array.isArray(bts) ? bts : []);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadTemplate = async () => {
    try {
      const token = api.__token?.() || localStorage.getItem('byrgop_admin_token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${API_BASE}/admin/know-yourself/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BYRGOP_Know_Yourself_Questions_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleBulkFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkPreview(null);
    setBulkResult(null);
    setBulkLoading(true);
    setErr(null);
    try {
      const token = api.__token?.() || localStorage.getItem('byrgop_admin_token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/admin/know-yourself/bulk-upload?preview=true`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setBulkPreview(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBulkLoading(false);
    }
    e.target.value = '';
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;
    setBulkImporting(true);
    setErr(null);
    try {
      const token = api.__token?.() || localStorage.getItem('byrgop_admin_token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await fetch(`${API_BASE}/admin/know-yourself/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setBulkResult(data);
      setBulkPreview(null);
      setBulkFile(null);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBulkImporting(false);
    }
  };

  const resetBulk = () => {
    setShowBulk(false);
    setBulkFile(null);
    setBulkPreview(null);
    setBulkResult(null);
    setBulkLoading(false);
    setBulkImporting(false);
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete question "${q.text.slice(0, 60)}…"?`)) return;
    try {
      await api.deleteKYQuestion(`/admin/know-yourself/${q._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const genericCount = questions.filter((q) => q.type === 'generic' || !q.type).length;
  const domainCount = questions.filter((q) => q.type === 'domain').length;
  const activeGeneric = questions.filter((q) => (q.type === 'generic' || !q.type) && q.active).length;
  const activeDomain = questions.filter((q) => q.type === 'domain' && q.active).length;

  const domainLabel = (slug) => domains.find((d) => d.slug === slug)?.name || slug;
  const categoryOf = (key) => categories.find((c) => c.key === key);
  const isGeneric = (q) => (q.type || 'generic') === 'generic';
  const btOf = (key) => businessTypes.find((b) => b.key === key);
  const domainOf = (slug) => domains.find((d) => d.slug === slug);

  // A question belongs to a business-type tab if it is a generic question
  // targeting that type (or every type) OR a domain question whose domain maps
  // to that business type (via the Domain model's businessTypeId).
  const inBusinessType = (q, key) => {
    if (isGeneric(q)) return !q.businessType || q.businessType === key;
    const d = domainOf(q.domain);
    const bt = btOf(key);
    return !!d && !!bt && String(d.businessTypeId) === String(bt._id);
  };

  const inTopTab = (q) => {
    switch (topTab) {
      case 'all': return true;
      case 'generic': return isGeneric(q);
      case 'service':
      case 'product':
      case 'ngo': return inBusinessType(q, topTab);
      default: return !isGeneric(q); // 'domain' — domain-specific questions
    }
  };

  const visible = questions.filter((q) => {
    if (!inTopTab(q)) return false;
    if (pillar !== 'all' && q.category !== pillar) return false;
    if (domainFilter !== 'all' && q.domain !== domainFilter) return false;
    if (search.trim() && !q.text.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  // Domain sub-tab list for the current business-type / domain view.
  const domainTabs =
    topTab === 'domain'
      ? domains.filter((d) => d.active !== false)
      : ['service', 'product', 'ngo'].includes(topTab)
        ? domains.filter((d) => {
            const bt = btOf(topTab);
            return d.active !== false && bt && String(d.businessTypeId) === String(bt._id);
          })
        : [];

  // Group the current view so it is easy to navigate (similar to Domain Selection).
  let groups = null; // null => flat list
  if (topTab === 'generic' && pillar === 'all') {
    const pillarGroups = categories
      .filter((c) => c.active !== false)
      .map((c) => ({
        key: c.key,
        title: c.name,
        color: c.color,
        items: visible.filter((q) => q.category === c.key),
      }))
      .filter((g) => g.items.length);
    const uncategorized = visible.filter((q) => !categories.some((c) => c.key === q.category));
    groups = [
      ...pillarGroups,
      ...(uncategorized.length ? [{ key: '__uncat', title: 'Uncategorized', color: null, items: uncategorized }] : []),
    ];
  } else if (topTab === 'domain' && domainFilter === 'all') {
    groups = domains
      .filter((d) => d.active !== false)
      .map((d) => ({ key: d.slug, title: d.name, color: null, items: visible.filter((q) => q.domain === d.slug) }))
      .filter((g) => g.items.length);
  } else if (['service', 'product', 'ngo'].includes(topTab) && domainFilter === 'all') {
    const genericGroup = visible.filter(isGeneric);
    groups = [
      ...(genericGroup.length ? [{ key: '__generic', title: 'Generic', color: null, items: genericGroup }] : []),
      ...domains
        .filter((d) => d.active !== false)
        .map((d) => ({ key: d.slug, title: d.name, color: null, items: visible.filter((q) => q.domain === d.slug) }))
        .filter((g) => g.items.length),
    ];
  }

  const switchTopTab = (key) => {
    setTopTab(key);
    setPillar('all');
    setDomainFilter('all');
  };
  const groupColor = (g) => (g.key === '__uncat' ? '#9aa3b2' : g.color || '#9aa3b2');

  const renderCard = (q) => (
    <div key={q._id} className="card">
      {editing?._id === q._id ? (
        <KYQuestionForm
          initial={q}
          domains={domains}
          businessTypes={businessTypes}
          categories={categories}
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
                  q.type === 'domain' ? 'bg-purple-500/15 text-purple-700' : 'bg-blue-500/15 text-blue-700'
                }`}
              >
                {q.type === 'domain' ? 'Domain' : 'Generic'}
              </span>
              {q.type === 'domain' && q.domain && (
                <span className="badge bg-slate-200 text-mist text-[10px]">
                  {domainLabel(q.domain)}
                </span>
              )}
              {q.category && (
                <span
                  className="badge text-[10px]"
                  style={{
                    background: `${categoryOf(q.category)?.color || brand.palette.blue[500]}1f`,
                    color: darkText(categoryOf(q.category)?.color || brand.palette.blue[500]),
                  }}
                >
                  {categoryOf(q.category)?.name || q.category}
                </span>
              )}
              <span
                className={`badge ${
                  q.active ? 'bg-green-400/15 text-green-700' : 'bg-red-400/15 text-red-700'
                }`}
              >
                {q.active ? 'active' : 'inactive'}
              </span>
              <span className="badge bg-slate-200 text-mist">
                {q.options.filter((o) => o.active !== false).length} options
              </span>
              {q.glossary?.length > 0 && (
                <span className="badge bg-brand-accent/15 text-brand-accentText">
                  {q.glossary.length} glossary
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-mist">{q.text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {q.options.map((o, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${
                    o.active !== false ? 'border-slate-300 text-mist-muted' : 'border-slate-200 text-mist-muted/80'
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: o.color || 'transparent' }}
                    title={o.color ? `${o.color} hex` : 'default colour'}
                  />
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
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Know Yourself Questions</h1>
          <p className="mt-1 text-sm text-mist-muted">
            {genericCount} generic ({activeGeneric} active) · {domainCount} domain ({activeDomain} active)
            {activeGeneric < 10 && (
              <span className="ml-2 text-red-700">(need 10+ generic)</span>
            )}
            {activeDomain < 10 && domainCount > 0 && (
              <span className="ml-2 text-red-700">(need 10+ per domain)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-3 py-2 text-xs" onClick={downloadTemplate}>
            Download Template
          </button>
          <button
            className="btn-ghost px-3 py-2 text-xs"
            onClick={() => { setShowBulk((v) => !v); if (showBulk) resetBulk(); }}
          >
            {showBulk ? 'Close' : 'Bulk Upload Excel'}
          </button>
          <button className="btn-primary" onClick={() => { setShowCreate((v) => !v); if (showCreate) resetBulk(); }}>
            {showCreate ? 'Close' : '+ Add Question'}
          </button>
        </div>
      </div>

      {/* Search — searches within the currently selected category/filter */}
      <div className="mt-4">
        <input
          className="input w-full sm:max-w-md"
          type="search"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Top-level category navigation */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Questions' },
          { key: 'generic', label: 'Generic' },
          { key: 'service', label: 'Service' },
          { key: 'product', label: 'Product' },
          { key: 'ngo', label: 'NGO' },
          { key: 'domain', label: 'Domain-specific' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => switchTopTab(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              topTab === f.key
                ? 'bg-brand-accent/15 text-brand-accentText'
                : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Generic pillar sub-tabs */}
      {topTab === 'generic' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-mist-muted">Pillar:</span>
          <button
            onClick={() => setPillar('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              pillar === 'all'
                ? 'bg-brand-accent/15 text-brand-accentText'
                : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
            }`}
          >
            All Pillars
          </button>
          {categories.filter((c) => c.active !== false).map((c) => (
            <button
              key={c.key}
              onClick={() => setPillar(c.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                pillar === c.key
                  ? 'bg-brand-accent/15 text-brand-accentText'
                  : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Domain sub-tabs (business-type + domain-specific views) */}
      {(topTab === 'domain' || ['service', 'product', 'ngo'].includes(topTab)) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-mist-muted">
            {topTab === 'domain' ? 'Domain:' : `${topTab === 'service' ? 'Service' : topTab === 'product' ? 'Product' : 'NGO'} Domains:`}
          </span>
          <button
            onClick={() => setDomainFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              domainFilter === 'all'
                ? 'bg-brand-accent/15 text-brand-accentText'
                : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
            }`}
          >
            {topTab === 'domain' ? 'All Domains' : 'All'}
          </button>
          {domainTabs.map((d) => (
            <button
              key={d.slug}
              onClick={() => setDomainFilter(d.slug)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                domainFilter === d.slug
                  ? 'bg-brand-accent/15 text-brand-accentText'
                  : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      {showBulk && (
        <div className="mt-5 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-mist">Bulk Upload Questions</h2>
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={resetBulk}>Close</button>
          </div>

          {!bulkPreview && !bulkResult && (
            <div className="space-y-3">
              <p className="text-sm text-mist-muted">
                Download the template first to see the expected column format.
                Fill in your questions and upload the completed .xlsx file.
              </p>
              <div className="flex items-center gap-3">
                <button className="btn-ghost px-3 py-2 text-xs" onClick={downloadTemplate}>
                  Download Template
                </button>
                <label className="btn-primary px-3 py-2 text-xs cursor-pointer">
                  {bulkLoading ? 'Validating...' : 'Select .xlsx File'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleBulkFile}
                    disabled={bulkLoading}
                  />
                </label>
              </div>
            </div>
          )}

          {bulkLoading && (
            <p className="text-sm text-mist-muted">Uploading and validating file...</p>
          )}

          {bulkResult && (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${bulkResult.imported > 0 ? 'bg-green-400/10 border border-green-400/20' : 'bg-red-400/10 border border-red-400/20'}`}>
                <p className={`text-sm font-medium ${bulkResult.imported > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {bulkResult.imported > 0
                    ? `Import Successful — ${bulkResult.imported} question(s) imported.`
                    : 'Import failed.'}
                </p>
                {bulkResult.message && (
                  <p className="mt-1 text-xs text-mist-muted">{bulkResult.message}</p>
                )}
              </div>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={resetBulk}>Done</button>
            </div>
          )}

          {bulkPreview && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-mist">Total: {bulkPreview.totalRows}</span>
                <span className="text-green-700">Valid: {bulkPreview.valid}</span>
                <span className={bulkPreview.invalid > 0 ? 'text-red-700 font-medium' : 'text-mist-muted'}>
                  Invalid: {bulkPreview.invalid}
                </span>
                {bulkPreview.importable && (
                  <span className="badge bg-green-400/15 text-green-700">Ready to import</span>
                )}
                {!bulkPreview.importable && bulkPreview.invalid > 0 && (
                  <span className="badge bg-red-400/15 text-red-700">Import blocked — fix errors below</span>
                )}
              </div>

              {bulkPreview.errors?.length > 0 && (
                <div className="rounded-lg bg-red-400/5 border border-red-400/15 p-3">
                  <p className="text-xs font-medium text-red-700 mb-2">Errors:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {bulkPreview.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700">
                        Row {e.row}: {e.issues.join('; ')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-mist-muted">
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Question</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Domain</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.rows.map((r) => (
                      <tr key={r.row} className={`border-b border-slate-200 ${r.ok ? '' : 'bg-red-400/5'}`}>
                        <td className="px-3 py-2 text-mist-muted">{r.row}</td>
                        <td className="px-3 py-2 text-mist max-w-xs truncate">{r.question}</td>
                        <td className="px-3 py-2 text-mist-muted">{r.type}</td>
                        <td className="px-3 py-2 text-mist-muted">{r.domain || '—'}</td>
                        <td className="px-3 py-2 text-mist-muted">{r.category || '—'}</td>
                        <td className="px-3 py-2">
                          {r.ok ? (
                            <span className="text-green-700">✓ Valid</span>
                          ) : (
                            <span className="text-red-700" title={r.issues.join('; ')}>✕ {r.issues.length} error(s)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                {bulkPreview.importable && (
                  <button
                    className="btn-primary disabled:opacity-50"
                    onClick={handleBulkImport}
                    disabled={bulkImporting}
                  >
                    {bulkImporting ? 'Importing...' : `Import ${bulkPreview.valid} Questions`}
                  </button>
                )}
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setBulkPreview(null); setBulkFile(null); }}>
                  Upload Different File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="mt-5">
          <KYQuestionForm
            domains={domains}
            businessTypes={businessTypes}
            categories={categories}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {visible.length === 0 && (
          <p className="text-mist-muted">No questions in this category yet.</p>
        )}

        {visible.length > 0 && !groups && <div className="space-y-3">{visible.map(renderCard)}</div>}

        {groups &&
          groups.map((g) => (
            <div key={g.key}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: groupColor(g) }}
                />
                <h2 className="font-display text-sm font-semibold text-mist">{g.title}</h2>
                <span className="text-xs text-mist-muted">{g.items.length} question(s)</span>
              </div>
              <div className="space-y-3">{g.items.map(renderCard)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
