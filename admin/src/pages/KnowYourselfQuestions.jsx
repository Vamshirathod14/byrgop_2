import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';
import { darkText } from '../utils/color.js';
import { DEFAULT_KY_ROOT, getKyRoot, businessTypesForRoot } from '../lib/kyRoots.js';

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

function KYQuestionForm({
  initial,
  domains,
  categories = [],
  businessTypes = [],
  defaultBusinessType = '',
  /**
   * Whether this root has a domain-selection step.
   *
   * `true`  — Manufacturing & Services: the full editor, because a question can
   *           be Generic or filed under a Domain of a Business Type.
   * `false` — Start-Up / Non-Profit: no domain step exists, so the Question Type,
   *           Business Type and Domain controls are not part of this editor and
   *           are not rendered. They are not merely hidden: the payload below
   *           pins `type`, `domain` and `businessType` to this root, so "Any
   *           business type" can never be written here and strand a Non-Profit
   *           question in the shared Manufacturing & Services pool.
   */
  showDomainSchema = true,
  // The one business-type key that owns this root. Written on every save when
  // `showDomainSchema` is false. A domain-less root has exactly one.
  rootBusinessType = '',
  // The name of the root being edited, shown under the Pillar dropdown so it is
  // obvious WHICH root's six pillars are on offer. Purely explanatory — the
  // list itself is already scoped by the `?root=` fetch that produced
  // `categories`.
  rootShort = 'Know Yourself',
  onCancel,
  onSaved,
}) {
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
      : { ...empty, businessType: defaultBusinessType }
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
        // A root with no domain-selection step owns exactly one question shape:
        // not domain-specific, and belonging to that root's business type. These
        // three values are fixed rather than read from the form, because the form
        // does not offer them on such a root.
        type: showDomainSchema ? form.type : 'generic',
        domain: showDomainSchema && form.type === 'domain' ? form.domain : null,
        category: form.category || null,
        businessType: showDomainSchema ? form.businessType || null : rootBusinessType || null,
        active: form.active,
        options: form.options.map((o) => ({
          text: o.text,
          score: Number(o.score),
          active: o.active !== false,
        })),
        glossary,
      };
      if (!payload.category) {
        setErr('Select a pillar for this question.');
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

      {/* Question Type / Business Type / Domain.
          Rendered only for a root that actually has a domain-selection step.
          Start-Up and Non-Profit have no domains, so these three controls would
          offer a question a shape it cannot legally have — and the
          "Any business type" option would save a Non-Profit question into the
          shared Manufacturing & Services pool, where it would be scored against
          the wrong pillars and never appear on this page again. */}
      {showDomainSchema && (
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
      )}

      <div className={showDomainSchema ? 'grid grid-cols-2 gap-4' : ''}>
        <div>
          {/* The pillar dropdown.
              `category` IS the pillar — a question's result score is grouped by
              it — and the API stores it in `question.category`. It is labelled
              "Pillar" because that is what it means to whoever edits a question,
              and because the six options offered here are exactly this root's
              six pillars: `categories` was fetched with `?root=<this root>`, so
              another root's pillars are never in the list to be picked.

              Selecting a pillar here is the ONLY way to file a question under
              one, so the persisted value and the value the assessment is later
              grouped by can never disagree. */}
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Pillar
          </label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => set({ category: e.target.value })}
            required
            aria-label="Pillar"
          >
            <option value="" disabled>Select pillar</option>
            {/* A question stored against a retired pillar keeps it visible as
                its current value instead of the select silently falling back to
                the first option. It is not offered for any other question. */}
            {form.category && !categories.some((c) => c.key === form.category && c.active) && (
              <option value={form.category}>
                {categories.find((c) => c.key === form.category)?.name || form.category} (retired)
              </option>
            )}
            {categories.filter((c) => c.active).map((c) => (
              <option key={c._id} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-mist-muted">
            The pillar this question is scored under, in the {rootShort} result.
          </p>
        </div>
        {/* "Any business type" is a question about WHICH pool a generic question
            is shared into. A root with no domain step belongs to exactly one
            business type, so there is nothing to choose here and the control is
            omitted rather than shown disabled. */}
        {showDomainSchema && (
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

/**
 * `businessType` is a VIEW scope, not a data filter.
 *
 * Manufacturing and Services are two business types inside the single
 * `manufacturing-services` root, and the unified KY Questions area offers each
 * as its own entry. Passing it here opens the page on the business-type tab
 * that already existed, using the same `inBusinessType` predicate it always
 * used. Nothing is filtered differently, no API call changes, and the editor
 * is identical — the same questions, pillars, domains and save behaviour the
 * per-business-type tab has always had.
 *
 * Omit it and the page is the previous whole-root view.
 *
 * `pillarRevision` and `onDataChanged` keep this page in step with a pillar
 * manager rendered beside it (Start-Up and Non-Profit). `pillarRevision` is read
 * only as part of this page's own load dependency, so a pillar added, renamed or
 * reactivated next door re-reads the Pillar dropdown without a page reload;
 * `onDataChanged` reports back after every successful read so the counts on that
 * side are never stale. Both default to nothing, which is exactly the previous
 * behaviour — Manufacturing & Services passes neither and is therefore
 * untouched by them.
 */
export default function KnowYourselfQuestions({
  root = DEFAULT_KY_ROOT,
  businessType = null,
  pillarRevision = 0,
  onDataChanged,
}) {
  const kyRoot = getKyRoot(root);
  // Only the Mfg & Services root runs domain selection, so only that root has a
  // domain/business-type axis at all. Declared before `load` because it also
  // decides how much of the bank this page asks the server for.
  const rootHasDomains = kyRoot.requiresDomainSelection;
  const [questions, setQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  // Category navigation (reuses the existing question fields: type/domain/category/businessType).
  // `businessTypeScope` only chooses WHICH of these tabs is open on arrival —
  // it does not add, remove or change any tab.
  const [topTab, setTopTab] = useState(businessType || 'all'); // all | generic | service | product | ngo | domain
  const [pillar, setPillar] = useState('all'); // 'all' or a KYCategory key (pillar)
  const [domainFilter, setDomainFilter] = useState('all'); // 'all' or a domain slug
  const [search, setSearch] = useState('');
  const [err, setErr] = useState(null);
  // Retired (inactive) questions and pillars are fetched but hidden by default.
  // The page must show the LIVE bank — a root that replaced its framework leaves
  // a superseded bank behind, and mixing the two in one list is how a root ends
  // up looking like it has twice the questions it actually has.
  const [showRetired, setShowRetired] = useState(false);
  const [pillarSaving, setPillarSaving] = useState(null); // question _id mid-save
  const [pillarError, setPillarError] = useState(null);

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
      // Both requests are scoped to this root on the server, so the three
      // roots can never show each other's questions or pillars.
      //
      // A root WITHOUT domain selection (Start-Up, Non-Profit) asks for the live
      // rows only. Its bank is scoped by its own single business type, so its
      // superseded framework — and any retired pillar it was filed under — is
      // never returned, and can therefore never reach a pillar dropdown on that
      // page. Nothing is deleted: the retired rows stay in the database and the
      // domain-selection root, which legitimately shows retired rows, is
      // unaffected.
      const [qs, doms, cats, bts] = await Promise.all([
        api.kyQuestions({ root, includeInactive: rootHasDomains }),
        api.domains(),
        api.kyCategories(root, rootHasDomains).catch(() => []),
        api.businessTypes().catch(() => []),
      ]);
      setQuestions(Array.isArray(qs) ? qs : []);
      setDomains(Array.isArray(doms) ? doms : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setBusinessTypes(Array.isArray(bts) ? bts : []);
      setErr(null);
      // Tell a pillar manager sitting on this page that what it is counting
      // against has just been re-read. Optional and undefined on the frozen
      // Manufacturing & Services workspace, where it is a no-op.
      onDataChanged?.();
    } catch (e) {
      setErr(e.message);
    }
    // `pillarRevision` is here so a pillar added or reactivated in the manager
    // beside this page is in the Pillar dropdown on the next read, rather than
    // after a manual page reload. It is a plain dependency, not a branch.
  }, [root, rootHasDomains, pillarRevision, onDataChanged]);

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

  /**
   * Move ONE question to another pillar, from the Pillar dropdown on its card.
   *
   * This is a real persisted write, not local state: it PUTs the new category
   * and reloads from the server, so what the list then shows is what the
   * database holds. The server resolves the submitted pillar against the
   * question's own root and rejects a foreign one, so this control can only
   * ever move a question within its own root's six pillars.
   *
   * Only `category` is sent. The update endpoint is a partial update, so this
   * cannot silently rewrite the question text or its options.
   */
  const savePillar = async (q, nextPillar) => {
    if (!nextPillar || nextPillar === q.category) return;
    const previous = q.category;
    // Optimistic, so the dropdown never lags the click, and reverted from the
    // server's answer on failure rather than left showing a lie.
    setQuestions((list) => list.map((x) => (x._id === q._id ? { ...x, category: nextPillar } : x)));
    setPillarSaving(q._id);
    setPillarError(null);
    try {
      const saved = await api.updateKYQuestion(`/admin/know-yourself/${q._id}`, {
        category: nextPillar,
      });
      setQuestions((list) => list.map((x) => (x._id === q._id ? { ...saved, ...x, category: saved.category } : x)));
    } catch (e) {
      setQuestions((list) => list.map((x) => (x._id === q._id ? { ...x, category: previous } : x)));
      setPillarError(`Could not move "${q.text.slice(0, 48)}…": ${e.message}`);
    } finally {
      setPillarSaving(null);
    }
  };

  // Business types in THIS root only, read from the live API (`kyRoot`).
  // Never a hardcoded list — adding a business type to a root in the database
  // is enough for it to appear here.
  const rootBtKeys = businessTypesForRoot(kyRoot.id, businessTypes);
  // The form's business-type picker is limited to this root's own types, so a
  // question cannot be created into a different root from the wrong page.
  const scopedBusinessTypes = businessTypes.filter((bt) => rootBtKeys.includes(bt?.key));

  // Everything below counts the LIVE bank unless retired rows are explicitly
  // asked for. `liveQuestions` is the whole page's source of truth so the header
  // count, the pillar counts and the list can never disagree with each other.
  const liveQuestions = useMemo(
    () => (showRetired ? questions : questions.filter((q) => q.active !== false)),
    [questions, showRetired]
  );
  const liveCategories = useMemo(
    () => (showRetired ? categories : categories.filter((c) => c.active !== false)),
    [categories, showRetired]
  );
  const retiredQuestionCount = questions.length - liveQuestions.length;
  const retiredPillarCount = categories.length - liveCategories.length;

  const genericCount = liveQuestions.filter((q) => q.type === 'generic' || !q.type).length;
  const domainCount = liveQuestions.filter((q) => q.type === 'domain').length;
  const activeGeneric = liveQuestions.filter((q) => (q.type === 'generic' || !q.type) && q.active).length;
  const activeDomain = liveQuestions.filter((q) => q.type === 'domain' && q.active).length;

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

  // Top tabs for this root. Manufacturing & Services keeps the legacy shape
  // (all / generic / per-business-type / domain). Start-Up and Non-Profit have
  // no domain step, so they only ever offer "all" and "generic" — there is no
  // dead "Domain-specific" tab that could never contain anything.
  const topTabs = [
    { key: 'all', label: 'All Questions' },
    { key: 'generic', label: 'Generic' },
    ...rootBtKeys.map((key) => ({ key, label: btOf(key)?.name || key })),
    ...(rootHasDomains ? [{ key: 'domain', label: 'Domain-specific' }] : []),
  ];

  const inTopTab = (q) => {
    switch (topTab) {
      case 'all': return true;
      case 'generic': return isGeneric(q);
      case 'domain': return rootHasDomains && !isGeneric(q);
      default: return rootBtKeys.includes(topTab) ? inBusinessType(q, topTab) : false;
    }
  };

  const visible = liveQuestions.filter((q) => {
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
      : rootBtKeys.includes(topTab)
        ? domains.filter((d) => {
            const bt = btOf(topTab);
            return d.active !== false && bt && String(d.businessTypeId) === String(bt._id);
          })
        : [];

  // Group the current view so it is easy to navigate (similar to Domain Selection).
  //
  // Grouping is driven by `liveCategories` and the completeness check below is
  // what stops a question going missing: a question whose pillar is NOT in
  // `liveCategories` falls into "Uncategorized" instead of being dropped between
  // groups, so a retired pillar can never silently swallow its questions.
  let groups = null; // null => flat list
  if (topTab === 'generic' && pillar === 'all') {
    const pillarGroups = liveCategories
      .map((c) => ({
        key: c.key,
        title: c.name,
        color: c.color,
        items: visible.filter((q) => q.category === c.key),
      }))
      .filter((g) => g.items.length);
    const uncategorized = visible.filter((q) => !liveCategories.some((c) => c.key === q.category));
    groups = [
      ...pillarGroups,
      ...(uncategorized.length ? [{ key: '__uncat', title: 'Uncategorized', color: null, items: uncategorized }] : []),
    ];
  } else if (topTab === 'domain' && domainFilter === 'all') {
    groups = domains
      .filter((d) => d.active !== false)
      .map((d) => ({ key: d.slug, title: d.name, color: null, items: visible.filter((q) => q.domain === d.slug) }))
      .filter((g) => g.items.length);
  } else if (rootBtKeys.includes(topTab) && domainFilter === 'all') {
    const genericGroup = visible.filter(isGeneric);
    groups = [
      ...(genericGroup.length ? [{ key: '__generic', title: 'Generic', color: null, items: genericGroup }] : []),
      ...domains
        .filter((d) => d.active !== false)
        .map((d) => ({ key: d.slug, title: d.name, color: null, items: visible.filter((q) => q.domain === d.slug) }))
        .filter((g) => g.items.length),
    ];
  }

  // Per-pillar question counts, computed from what the API just returned and
  // scoped to the same live set the list shows. Nothing here is hardcoded, so
  // the numbers always describe the live bank rather than a target.
  const activePerPillar = useMemo(() => {
    const out = new Map();
    for (const c of liveCategories) out.set(c.key, 0);
    for (const q of liveQuestions) {
      if (!q.active || !isGeneric(q)) continue;
      if (q.category && out.has(q.category)) out.set(q.category, out.get(q.category) + 1);
    }
    return out;
  }, [liveQuestions, liveCategories]);

  // The pillars this root edits, with their live question counts. Empty pillars
  // are surfaced so a root can never look complete while it is not.
  const pillarRows = useMemo(
    () =>
      [...liveCategories]
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name))
        .map((c) => ({
          key: c.key,
          name: c.name,
          color: c.color,
          active: c.active !== false,
          activeQuestions: activePerPillar.get(c.key) || 0,
        })),
    [liveCategories, activePerPillar]
  );

  // The six pillars offered by every Pillar dropdown on this page. Always this
  // root's ACTIVE pillars and nothing else: a Start-Up question can never be
  // offered a Non-Profit pillar, and a retired pillar is never re-offered.
  const selectablePillars = useMemo(
    () =>
      [...liveCategories]
        .filter((c) => c.active !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name)),
    [liveCategories]
  );

  // Header summary. Every number is read off the loaded data, so the page can
  // never claim a structure the database does not have. `questions` counts the
  // whole live bank — on a root that also runs domain selection that is larger
  // than the generic-only count the list breaks out below it.
  const summary = useMemo(() => {
    const counts = pillarRows.map((p) => p.activeQuestions);
    return {
      questions: liveQuestions.filter((q) => q.active !== false).length,
      pillars: pillarRows.length,
      perPillar: counts.length ? (Math.min(...counts) === Math.max(...counts) ? counts[0] : null) : 0,
      even: counts.length > 0 && counts.every((c) => c === counts[0]),
    };
  }, [liveQuestions, pillarRows]);

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
          businessTypes={scopedBusinessTypes}
          categories={categories}
          showDomainSchema={rootHasDomains}
          rootBusinessType={rootBtKeys.length === 1 ? rootBtKeys[0] : ''}
          rootShort={kyRoot.short}
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
              {/* Question Type is only a real distinction on a root that has
                  domains. On Start-Up / Non-Profit every question is by
                  definition not domain-specific, so the badge is omitted rather
                  than shown as a meaningless "Generic". */}
              {rootHasDomains && (
                <span
                  className={`badge ${
                    q.type === 'domain' ? 'bg-purple-500/15 text-purple-700' : 'bg-blue-500/15 text-blue-700'
                  }`}
                >
                  {q.type === 'domain' ? 'Domain' : 'Generic'}
                </span>
              )}
              {/* Which business type this question belongs to. Shown on every
                  card so a root's bank is never ambiguous about who answers it. */}
              {q.businessType && (
                <span className="badge bg-slate-900/10 text-slate-800 text-[10px]">
                  {btOf(q.businessType)?.name || q.businessType}
                </span>
              )}
              {/* Belt-and-braces: the server never returns a domain question for
                  a root without a domain step, so a domain label can never be
                  printed on the Non-Profit page even if a legacy row somehow
                  carried one. */}
              {rootHasDomains && q.type === 'domain' && q.domain && (
                <span className="badge bg-slate-200 text-mist text-[10px]">
                  {domainLabel(q.domain)}
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

            {/* ── Pillar assignment ────────────────────────────────────
                A real <select> on every question, not only inside the edit
                form: the whole point of this page is to see the bank and move
                a question between pillars. It offers only this root's active
                pillars and writes the choice straight through to the database
                (see savePillar), then re-reads it from the server. */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <label
                htmlFor={`pillar-${q._id}`}
                className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mist-muted"
              >
                Pillar
              </label>
              <select
                id={`pillar-${q._id}`}
                aria-label="Pillar"
                className="input w-auto min-w-[15rem] py-1.5 text-xs"
                value={q.category || ''}
                disabled={pillarSaving === q._id}
                onChange={(e) => savePillar(q, e.target.value)}
              >
                <option value="" disabled>
                  Select a pillar…
                </option>
                {/* A question whose stored pillar has been retired keeps that
                    value selectable and visible, so the row never silently
                    displays a different pillar than the one it is stored
                    against. It is not re-offered for anyone else. */}
                {q.category && !selectablePillars.some((c) => c.key === q.category) && (
                  <option value={q.category}>
                    {categoryOf(q.category)?.name || q.category} (retired)
                  </option>
                )}
                {selectablePillars.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-mist-muted">
                {pillarSaving === q._id ? (
                  <span className="text-mist-muted">Saving…</span>
                ) : (
                  `of ${selectablePillars.length} ${kyRoot.short} pillars`
                )}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
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
      {/* Root header — always states which question root AND which six-pillar
          structure is being edited, so the three roots can never be confused. */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-slate-900/10 text-slate-800">Root: {kyRoot.short}</span>
          <span className="text-xs text-mist-muted">
            {kyRoot.requiresDomainSelection
              ? 'Includes the domain-selection step'
              : 'No domain-selection step — users go straight from the disclaimer into the questions'}
          </span>
        </div>
        <p className="mt-2 text-sm text-mist-muted">{kyRoot.blurb}</p>

        {/* Structure summary — every number counted from the loaded questions,
            never hardcoded, so it always describes the live bank. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <p className="font-display text-2xl font-semibold tabular-nums text-mist">
            {summary.questions}{' '}
            <span className="text-sm font-normal text-mist-muted">
              question{summary.questions === 1 ? '' : 's'}
            </span>
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums text-mist">
            {summary.pillars} <span className="text-sm font-normal text-mist-muted">pillars</span>
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums text-mist">
            {summary.even ? (
              <>
                {summary.perPillar}{' '}
                <span className="text-sm font-normal text-mist-muted">questions per pillar</span>
              </>
            ) : (
              <span className="text-sm font-normal text-amber-700">
                uneven across pillars
              </span>
            )}
          </p>
        </div>

        {/* Retired rows are fetched but hidden, so the live bank is what the
            page shows. The toggle is explicit and states how many are hidden —
            nothing is deleted by hiding it. */}
        {(retiredQuestionCount > 0 || retiredPillarCount > 0) && (
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-mist-muted">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={showRetired}
              onChange={(e) => {
                setShowRetired(e.target.checked);
                setPillar('all');
              }}
            />
            Show retired
            <span className="tabular-nums">
              ({retiredQuestionCount} retired question{retiredQuestionCount === 1 ? '' : 's'}
              {retiredPillarCount > 0 &&
                `, ${retiredPillarCount} retired pillar${retiredPillarCount === 1 ? '' : 's'}`}
              )
            </span>
          </label>
        )}

        {/* The pillars of THIS root, with live question counts read from the
            API. A count is never hardcoded. Clicking one filters the list. */}
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-muted/80">
            Pillar result structure for {kyRoot.short}
          </p>
          {pillarRows.length === 0 ? (
            <p className="mt-1 text-sm text-mist-muted">Loading pillars…</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pillarRows.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setTopTab('generic');
                    setPillar(pillar === p.key ? 'all' : p.key);
                    setDomainFilter('all');
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                    pillar === p.key
                      ? 'border-brand-accent/50 bg-brand-accent/10'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                  title={`Filter to ${p.name}`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: p.color || '#9aa3b2' }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-mist">{p.name}</span>
                  <span
                    className={`shrink-0 tabular-nums ${
                      p.activeQuestions === 0 ? 'font-semibold text-red-600' : 'text-mist-muted'
                    }`}
                  >
                    {p.activeQuestions}
                  </span>
                  {p.active === false && (
                    <span className="shrink-0 text-[10px] uppercase text-amber-600">retired</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">
            Know Yourself Questions
            <span className="ml-2 align-middle text-base font-normal text-mist-muted">{kyRoot.label}</span>
          </h1>
          <p className="mt-1 text-sm text-mist-muted">
            {showRetired
              ? `${questions.length} question(s) including retired`
              : `${liveQuestions.length} active question(s)`}
            {rootHasDomains
              ? ` · ${genericCount} generic · ${domainCount} domain`
              : ' · assign a pillar to each question with the Pillar dropdown below'}
            {activeGeneric < 10 && rootHasDomains && (
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

      {/* Top-level category navigation — scoped to this root */}
      <div className="mt-4 flex flex-wrap gap-2">
        {topTabs.map((f) => (
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
          {categories.filter((c) => (showRetired ? true : c.active !== false)).map((c) => (
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
      {(topTab === 'domain' || rootBtKeys.includes(topTab)) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-mist-muted">
            {topTab === 'domain'
              ? 'Domain:'
              : `${btOf(topTab)?.name || topTab} Domains:`}
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
      {pillarError && <p className="mt-3 text-sm text-red-700">{pillarError}</p>}

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
            businessTypes={scopedBusinessTypes}
            categories={categories}
            showDomainSchema={rootHasDomains}
            rootBusinessType={rootBtKeys.length === 1 ? rootBtKeys[0] : ''}
            rootShort={kyRoot.short}
            defaultBusinessType={rootBtKeys.length === 1 ? rootBtKeys[0] : ''}
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
          <p className="text-mist-muted">
            No questions match this view.
            {retiredQuestionCount > 0 && !showRetired && (
              <>
                {' '}
                {retiredQuestionCount} retired question{retiredQuestionCount === 1 ? ' is' : 's are'}{' '}
                hidden — tick “Show retired” above to see {retiredQuestionCount === 1 ? 'it' : 'them'}.
              </>
            )}
          </p>
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
