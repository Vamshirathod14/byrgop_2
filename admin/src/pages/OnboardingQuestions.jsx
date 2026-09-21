import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';
import { darkText, answerColourError, answerColourHex, DEFAULT_YES_COLOR, DEFAULT_NO_COLOR } from '../utils/color.js';
import { categoryDisplayName } from '../utils/categories.js';
import StageSelect from '../components/StageSelect.jsx';
import { StageChip, StageDot, stageColour } from '../components/StageChip.jsx';
import ColourField from '../components/ColourField.jsx';

// The four intro onboarding business types. These are fixed product choices —
// every onboarding question belongs to exactly one of them, and there is no
// generic/common question bank.
const BUSINESS_TYPE_LABELS = {
  service: 'Services',
  manufacturing: 'Manufacturing',
  nonprofit: 'Non-Profit',
  startup: 'Startup',
};
const BUSINESS_TYPE_KEYS = Object.keys(BUSINESS_TYPE_LABELS);

// Each business type serves exactly three onboarding questions — one per pillar
// (Strategy / Operations / Finances). This mirrors the engine, which resolves
// deterministically one question per (category, businessType) pair.
const MAX_QUESTIONS_PER_TYPE = 3;

const empty = {
  text: '',
  category: '',
  weight: 10,
  stageKey: '',
  active: true,
  options: [
    { text: 'Yes', score: 1, stageKey: '', active: true, color: '' },
    { text: 'No', score: 0, stageKey: '', active: true, color: '' },
  ],
};

function OnboardingQuestionForm({
  initial,
  businessType,
  categories,
  stages,
  usedCategoryIds,
  onCancel,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          text: initial.text || '',
          category: initial.category?._id || initial.category || '',
          weight: initial.weight ?? 10,
          stageKey: initial.stageKey || '',
          active: initial.active !== false,
          displayOrder: initial.displayOrder ?? 0,
          options: (initial.options || []).map((o) => ({
            _id: o._id,
            text: o.text || '',
            score: o.score ?? 0,
            stageKey: o.stageKey || '',
            active: o.active !== false,
            color: o.color || '',
          })),
        }
      : { ...empty, category: '' }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const setOption = (i, patch) =>
    set({ options: form.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const addOption = () =>
    set({ options: [...form.options, { text: '', score: 1, stageKey: '', active: true, color: '' }] });

  const removeOption = (i) => set({ options: form.options.filter((_, idx) => idx !== i) });

  // An active question must offer exactly the Yes (score 1) / No (score 0)
  // pair — mirror of backend validateActiveQuestion.
  const activeValidationError = () => {
    if (form.active !== false) {
      const opts = form.options.filter((o) => o.active);
      const text = (o) => String(o.text || '').trim().toLowerCase();
      const yes = opts.find((o) => text(o) === 'yes');
      const no = opts.find((o) => text(o) === 'no');
      if (!yes || Number(yes.score) !== 1) return 'An active question must have an active Yes option scored 1.';
      if (!no || Number(no.score) !== 0) return 'An active question must have an active No option scored 0.';
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (!businessType) {
        setErr('Select a business type first.');
        setSaving(false);
        return;
      }
      const text = String(form.text || '').trim();
      if (!text) {
        setErr('Question text is required.');
        setSaving(false);
        return;
      }
      if (!form.category) {
        setErr('Select a pillar/category.');
        setSaving(false);
        return;
      }
      const activeErr = activeValidationError();
      if (activeErr) {
        setErr(activeErr);
        setSaving(false);
        return;
      }
      for (const o of form.options) {
        const colorErr = answerColourError(o.color);
        if (colorErr) {
          setErr(`Option "${o.text || '(unnamed)'}": ${colorErr}`);
          setSaving(false);
          return;
        }
      }
      const payload = {
        businessType,
        text,
        category: form.category,
        weight: Math.max(1, Number(form.weight) || 10),
        stageKey: form.stageKey || null,
        active: form.active !== false,
        options: form.options.map((o) => ({
          ...(o._id ? { _id: o._id } : {}),
          text: o.text,
          score: Number(o.score),
          stageKey: o.stageKey || null,
          active: o.active !== false,
          color: o.color || null,
        })),
      };
      if (initial?._id) {
        payload.displayOrder = Math.max(0, Number(form.displayOrder) || 0);
        await api.updateOnboardingQuestion(`/admin/onboarding-questions/${initial._id}`, payload);
      } else {
        await api.createOnboardingQuestion('/admin/onboarding-questions', payload);
      }
      onSaved();
    } catch (err) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeCategories = categories.filter((c) => c.active !== false);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Category (Pillar)
          </label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => set({ category: e.target.value })}
            required
          >
            <option value="" disabled>
              Select category
            </option>
            {activeCategories
              .filter((c) => !usedCategoryIds.has(c._id) || c._id === form.category)
              .map((c) => (
                <option key={c._id} value={c._id}>
                  {categoryDisplayName(c.key, c.name)}
                </option>
              ))}
          </select>
          <p className="mt-1 text-[11px] text-mist-muted/80">
            Each pillar gets exactly one question per business type.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Weight
          </label>
          <input
            type="number"
            min="1"
            className="input"
            value={form.weight}
            onChange={(e) => set({ weight: e.target.value })}
            required
          />
        </div>
        <div>
          <StageSelect
            label="BYRGOP Stage"
            value={form.stageKey}
            stages={stages}
            onChange={(v) => set({ stageKey: v })}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-mist-muted">
            Answer options &amp; scores
          </label>
          <button type="button" onClick={addOption} className="text-xs text-brand-accent hover:underline">
            + Add option
          </button>
        </div>
        <div className="space-y-3">
          {form.options.map((o, i) => {
            const oStage = stages.find((s) => s.key === o.stageKey);
            const oCol = oStage ? stageColour(oStage.color) : null;
            const optLabel = o.text.trim() || `Option ${i + 1}`;
            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition-colors focus-within:border-brand-accent/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="input min-w-40 flex-1"
                    placeholder="Option text (e.g. Yes / No)"
                    value={o.text}
                    onChange={(e) => setOption(i, { text: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    className="input w-20"
                    placeholder="Score"
                    value={o.score}
                    onChange={(e) => setOption(i, { score: e.target.value })}
                    required
                  />
                  <label className="flex items-center gap-1 text-xs text-mist-muted">
                    <input
                      type="checkbox"
                      checked={o.active}
                      onChange={(e) => setOption(i, { active: e.target.checked })}
                    />
                    active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    remove
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <StageSelect
                      label="Stage when this is chosen"
                      value={o.stageKey}
                      stages={stages}
                      onChange={(v) => setOption(i, { stageKey: v })}
                    />
                  </div>
                  <div>
                    <ColourField
                      label="Answer colour"
                      value={o.color}
                      onChange={(v) => setOption(i, { color: v })}
                    />
                  </div>
                </div>
                <div className="mt-2 text-right text-[10px] uppercase tracking-[0.12em] text-mist-muted/60">
                  {optLabel}
                  {oStage && oCol && (
                    <span className="mt-0.5 flex items-center justify-end gap-1.5 font-semibold" style={{ color: oStage.color }}>
                      <StageDot color={oStage.color} size={8} />
                      {oStage.name} · {oCol.name}
                    </span>
                  )}
                  {oStage && !oCol && (
                    <span className="mt-0.5 flex items-center justify-end gap-1.5 font-semibold" style={{ color: oStage.color }}>
                      <StageDot color={oStage.color} size={8} />
                      {oStage.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-mist-muted/80">
          {DEFAULT_YES_COLOR && DEFAULT_NO_COLOR
            ? `Answer colours render on the YES / NO buttons and drive the result chart segments (defaults: Yes ${DEFAULT_YES_COLOR}, No ${DEFAULT_NO_COLOR}).`
            : ''}
        </p>
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

export default function OnboardingQuestions() {
  const [businessType, setBusinessType] = useState('service');
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stages, setStages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const [qs, cats, sts] = await Promise.all([
        api.onboardingQuestions(businessType),
        api.categories(),
        api.stages(),
      ]);
      setQuestions(Array.isArray(qs) ? qs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setStages(Array.isArray(sts) ? sts : []);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, [businessType]);

  useEffect(() => {
    load();
  }, [load]);

  const switchType = (key) => {
    setBusinessType(key);
    setEditing(null);
    setShowCreate(false);
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete the ${BUSINESS_TYPE_LABELS[businessType]} onboarding question "${q.text.slice(0, 60)}…"?`)) return;
    try {
      await api.deleteOnboardingQuestion(
        `/admin/onboarding-questions/${q._id}?businessType=${encodeURIComponent(businessType)}`
      );
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const catOf = (id) => categories.find((c) => c._id === id);
  const stageOf = (key) => stages.find((s) => s.key === key);
  const activeCount = questions.filter((q) => q.active).length;

  const usedCategoryIds = new Set(
    questions
      .map((q) => q.category?._id || q.category)
      .filter(Boolean)
      .map((id) => String(id))
  );
  const freeCategory = categories.some((c) => c.active !== false && !usedCategoryIds.has(String(c._id)));
  const full = questions.length >= MAX_QUESTIONS_PER_TYPE;
  const canCreate = freeCategory && !full;

  const openCreate = () => {
    if (!canCreate) return;
    setShowCreate(true);
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Onboarding Questions</h1>
          <p className="mt-1 text-sm text-mist-muted">
            Question bank, weights, BYRGOP stages and scoring options. Managed by BYRGOP.
          </p>
        </div>
        <button
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canCreate}
          title={full ? `This business type already has its ${MAX_QUESTIONS_PER_TYPE} questions (one per pillar).` : ''}
          onClick={openCreate}
        >
          {showCreate ? 'Close' : '+ New question'}
        </button>
      </div>

      {/* Business type selector — the page manages exactly one type at a time */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="text-xs uppercase tracking-[0.15em] text-mist-muted">
          Business type
        </label>
        <select
          className="input w-auto"
          value={businessType}
          onChange={(e) => switchType(e.target.value)}
        >
          {BUSINESS_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {BUSINESS_TYPE_LABELS[key]}
            </option>
          ))}
        </select>
        <span className="text-xs text-mist-muted">
          {activeCount} active · {questions.length} / {MAX_QUESTIONS_PER_TYPE} total
        </span>
      </div>

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-5">
          <OnboardingQuestionForm
            businessType={businessType}
            categories={categories}
            stages={stages}
            usedCategoryIds={usedCategoryIds}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {questions.length === 0 && (
          <div className="card flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-mist">
                No onboarding questions are configured for {BUSINESS_TYPE_LABELS[businessType]}.
              </p>
              <p className="mt-1 text-sm text-mist-muted">
                Add one above to make this business type available in the intro onboarding flow.
              </p>
            </div>
            {canCreate && (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={openCreate}>
                + Add first question
              </button>
            )}
          </div>
        )}

        {questions.map((q) => (
          <div key={q._id} className="card">
            {editing?._id === q._id ? (
              <OnboardingQuestionForm
                initial={q}
                businessType={businessType}
                categories={categories}
                stages={stages}
                usedCategoryIds={usedCategoryIds}
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
                      className="badge"
                      style={{
                        background: `${catOf(q.category?._id)?.color || brand.textMuted}22`,
                        color: darkText(catOf(q.category?._id)?.color || brand.textMuted),
                      }}
                    >
                      {categoryDisplayName(q.category?.key, q.category?.name || '—')}
                    </span>
                    <span className="badge bg-slate-200 text-mist">
                      weight {q.weight}
                    </span>
                    {q.stageKey && stageOf(q.stageKey) && (
                      <StageChip stage={stageOf(q.stageKey)} />
                    )}
                    <span className="badge bg-slate-200 text-mist">
                      {(q.options || []).filter((o) => o.active).length} active options
                    </span>
                    <span
                      className={`badge ${
                        q.active ? 'bg-green-400/15 text-green-700' : 'bg-red-400/15 text-red-700'
                      }`}
                    >
                      {q.active ? 'active' : 'inactive'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-mist">{q.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(q.options || []).map((o) => (
                      <span
                        key={o._id || o.text}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${
                          o.active !== false ? 'border-slate-300 text-mist-muted' : 'border-slate-200 text-mist-muted/40'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: answerColourHex(o.color) || 'transparent' }}
                          title={answerColourHex(o.color) ? `${answerColourHex(o.color)} hex` : 'default colour'}
                        />
                        <span className="font-medium">{o.text}</span>
                        <span className="opacity-60">· {o.score}</span>
                        {o.stageKey && stageOf(o.stageKey) && (
                          <StageChip
                            stage={stageOf(o.stageKey)}
                            showColour={false}
                            className="border-transparent bg-transparent px-1"
                          />
                        )}
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