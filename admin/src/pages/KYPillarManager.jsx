import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';
import { getKyRoot } from '../lib/kyRoots.js';

/* ─────────────────────────────────────────────────────────────
   KNOW YOURSELF — ADMIN-MANAGED PILLARS (Start-Up · Non-Profit)

   The pillar manager for the two roots that own their pillar sets
   outright. It is a thin, root-scoped front end over the pillar API
   that already exists — `/admin/know-yourself/categories` with `?root=`
   on read, and the create / update / delete endpoints underneath it.
   There is no second pillar store, no second table and no client-side
   bookkeeping: everything here is a real write to `KYCategory`, scoped
   to one root, and everything on screen is re-read from the server
   after each write.

   WHY A SEPARATE COMPONENT
   ------------------------
   The Manufacturing & Services pillar page (`KYCategories.jsx`) is
   frozen. Manufacturing and Services must keep behaving exactly as they
   do today, so this component does not extend, wrap or refactor that
   page in any way — it is only ever rendered for the roots whose
   `managesPillarsInline` flag is true (Start-Up and Non-Profit), and the
   shared root is routed to the old page by `KyRootWorkspace`.

   ROOT SEPARATION
   ---------------
   Every read is `?root=<this root>` and every create sends
   `kyRoot: <this root>`, so a Start-Up pillar is stored under `kyRoot:
   'startup'` and a Non-Profit pillar under `kyRoot: 'non-profit'`.
   The keys are unique per root, not globally, and the server re-checks
   root membership on every write. A pillar created on one of these two
   pages therefore cannot appear on the other, and the server refuses a
   question that is filed under another root's pillar.

   COUNTS ARE COUNTED, NEVER ASSUMED
   ---------------------------------
   The number beside each pillar is counted from the questions the API
   returned for THIS root, grouped by their persisted `category`. There
   is no "3 per pillar" anywhere: a brand-new pillar shows 0, and it
   starts counting the moment questions are assigned to it.
   ───────────────────────────────────────────────────────────── */

const BLANK = {
  name: '',
  description: '',
  color: brand.palette.blue[500],
  sortOrder: 0,
  active: true,
};

/** Configured sort order, then name — the same order the server sorts by. */
const byOrder = (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name);

function PillarForm({ root, initial, nextSortOrder, onCancel, onSaved }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name: initial.name,
          description: initial.description || '',
          color: initial.color || brand.palette.blue[500],
          sortOrder: initial.sortOrder ?? 0,
          active: initial.active !== false,
        }
      : { ...BLANK, sortOrder: nextSortOrder }
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
      // The root is sent on CREATE only. A pillar can never be moved between
      // roots: re-pointing it would silently re-file every question that
      // references its key against a different result structure, and would
      // break the score of any assessment already completed under it.
      if (!isEdit) payload.kyRoot = root;
      if (isEdit) await api.updateKYCategory(`/admin/know-yourself/categories/${initial._id}`, payload);
      else await api.createKYCategory('/admin/know-yourself/categories', payload);
      // The saved name is handed back so the caller can say what changed. A
      // rename must not be silent: the row is only re-read from the server by
      // the caller, so anything less than a refresh leaves the old name on
      // screen and in the Pillar dropdown above.
      onSaved(payload.name);
    } catch (error) {
      // A duplicate name in the SAME root is rejected by the server with a 409
      // and an explanation, which is shown here verbatim rather than swallowed.
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Pillar name
          </label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Community Engagement"
            required
          />
          <p className="mt-1 text-xs text-mist-muted">
            The name participants see, and the name used to group a result. A
            question is scored under a pillar by this name's key, so renaming a
            pillar is safe — the stored key never changes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
              Colour
            </label>
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
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
              Order
            </label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set({ sortOrder: parseInt(e.target.value, 10) || 0 })}
            />
            <p className="mt-1 text-xs text-mist-muted">Where it sits in the result.</p>
          </div>
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

      <label className="flex items-start gap-2 text-sm text-mist">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.active}
          onChange={(e) => set({ active: e.target.checked })}
        />
        <span>
          Active
          <span className="ml-1 text-xs text-mist-muted">
            — an active pillar is offered in the Pillar dropdown when a question is
            created or edited. A retired pillar keeps its questions and can be
            restored later.
          </span>
        </span>
      </label>

      {err && <p className="text-sm text-red-700">{err}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add pillar'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * A single pillar row: its name, status, live question count and the three
 * things an admin may do to it.
 */
function PillarRow({ pillar, counts, busy, editing, onEdit, onCancelEdit, onSavedEdit, onToggleActive, onRemove }) {
  const live = counts.live;
  const retired = counts.retired;
  const isActive = pillar.active !== false;
  // A pillar with questions attached is NEVER hard-deleted. The question counts
  // are read from this root's own questions, so "attached" means attached to a
  // real question that would be orphaned by the delete.
  const attached = live + retired;

  return (
    <div className="card">
      {editing ? (
        <PillarForm
          initial={pillar}
          onCancel={onCancelEdit}
          onSaved={onSavedEdit}
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
              style={{ background: pillar.color || brand.palette.blue[500] }}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-mist">{pillar.name}</h3>
                <span
                  className={`badge shrink-0 ${
                    isActive ? 'bg-green-400/15 text-green-700' : 'bg-amber-500/15 text-amber-700'
                  }`}
                >
                  {isActive ? 'Active' : 'Retired'}
                </span>
                <span className="badge shrink-0 bg-slate-50 font-mono text-[10px] text-mist-muted">
                  {pillar.key}
                </span>
              </div>
              {pillar.description && (
                <p className="mt-1 text-xs text-mist-muted">{pillar.description}</p>
              )}
              <p className="mt-1 text-[11px] text-mist-muted/80">
                order #{pillar.sortOrder}
                {retired > 0 && (
                  <> · {retired} retired question{retired === 1 ? '' : 's'} still filed here</>
                )}
              </p>
              {!isActive && (
                <p className="mt-1 text-[11px] text-amber-700">
                  Not offered for new questions. Its {attached} existing question
                  {attached === 1 ? '' : 's'} stay filed under it.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* The count is measured, never assumed. A pillar with no questions
                shows 0 and stays visible, so a half-filled structure is obvious
                rather than invisible. */}
            <span
              className={`text-sm tabular-nums ${live === 0 ? 'font-semibold text-amber-700' : 'text-mist-muted'}`}
              title={`${live} active question${live === 1 ? '' : 's'} filed under ${pillar.name}`}
            >
              {live} question{live === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
              disabled={busy}
              onClick={onToggleActive}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              className="btn-danger disabled:opacity-40"
              disabled={busy || attached > 0}
              onClick={onRemove}
              title={
                attached > 0
                  ? `${pillar.name} is assigned to ${attached} question${attached === 1 ? '' : 's'}. Reassign them to another pillar before deleting this one.`
                  : `Delete ${pillar.name}`
              }
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KYPillarManager({ root, questionsRevision = 0, onChanged }) {
  const kyRoot = getKyRoot(root);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [expectedPillars, setExpectedPillars] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState(null);

  const load = useCallback(async () => {
    try {
      // Both requests are root-scoped ON THE SERVER, so this page can only ever
      // see this root's pillars and this root's questions.
      //
      // `includeInactive` is true for the pillars only, and deliberately: a
      // retired pillar has to stay visible here so it can be restored, and so
      // its questions are never invisible. It changes nothing about what a
      // question can be filed under — the question editor asks for the live
      // rows, so a retired pillar is never offered to a new question.
      const [cats, qs] = await Promise.all([
        api.kyCategories(kyRoot.id, true),
        api.kyQuestions({ root: kyRoot.id, includeInactive: true }),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setQuestions(Array.isArray(qs) ? qs : []);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, [kyRoot.id]);

  // Re-reads whenever a question is saved, edited or moved between pillars, so
  // the counts on this page can never drift from the questions above it.
  useEffect(() => {
    load();
  }, [load, questionsRevision]);

  /**
   * How many pillars the 18-question assessment for this root is built from.
   *
   * Read from the API, not assumed, and only to surface the warning below: a
   * pillar added here is immediately fileable and immediately scorable, but the
   * assessment still draws its 18 questions from the server's configured set,
   * so an extra ACTIVE pillar shows on a participant's result as an axis with
   * nothing behind it. That is a real consequence of adding one, so it is
   * stated on this page rather than discovered by a participant. Deactivating
   * the pillar removes it from the result again — nothing is lost.
   */
  useEffect(() => {
    let live = true;
    api
      .kyCategoriesGrouped()
      .then((grouped) => {
        if (live) setExpectedPillars(grouped?.[kyRoot.id]?.expectedPillars ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [kyRoot.id]);

  /**
   * How many questions each pillar of THIS root actually has.
   *
   * Counted from the questions the server returned for this root, grouped by
   * their persisted `category`. Nothing is hard-coded and nothing is inferred
   * from a question's position, number or order.
   */
  const counts = useMemo(() => {
    const map = new Map();
    for (const c of categories) map.set(c.key, { live: 0, retired: 0 });
    for (const q of questions) {
      const row = q.category ? map.get(q.category) : null;
      if (!row) continue;
      if (q.active === false) row.retired += 1;
      else row.live += 1;
    }
    return map;
  }, [categories, questions]);

  const active = useMemo(() => categories.filter((c) => c.active !== false).sort(byOrder), [categories]);
  const retired = useMemo(() => categories.filter((c) => c.active === false).sort(byOrder), [categories]);
  const totalLive = questions.filter((q) => q.active !== false).length;
  const unfiled = questions.filter((q) => q.active !== false && !q.category).length;

  /** Re-read from the server, then tell the questions view to re-read too. */
  const afterWrite = async (message) => {
    setNote(message);
    setErr(null);
    await load();
    // Bumps the questions page's pillar list, so a pillar that was just created
    // or reactivated is selectable in the Pillar dropdown immediately — without
    // the admin reloading the page.
    onChanged?.();
  };

  const toggleActive = async (pillar) => {
    const reactivating = pillar.active === false;
    setBusyId(pillar._id);
    try {
      await api.updateKYCategory(`/admin/know-yourself/categories/${pillar._id}`, {
        active: reactivating,
      });
      await afterWrite(
        reactivating
          ? `"${pillar.name}" is active again and is now offered in the Pillar dropdown.`
          : `"${pillar.name}" was deactivated. Its questions are untouched and it is no longer offered for new questions.`
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (pillar) => {
    if (
      !window.confirm(
        `Delete pillar "${pillar.name}"? No question is filed under it, so nothing is orphaned. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(pillar._id);
    try {
      await api.deleteKYCategory(`/admin/know-yourself/categories/${pillar._id}`);
      await afterWrite(`"${pillar.name}" was deleted.`);
    } catch (e) {
      // The server refuses a pillar that has questions attached, and says how
      // many. Shown as-is so the reason is never a guess.
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const nextSortOrder = active.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0) + 1;
  // Active pillars beyond the ones the assessment draws its 18 questions from.
  const beyondPlan = expectedPillars == null ? 0 : active.length - expectedPillars;

  const renderRow = (pillar) => (
    <PillarRow
      key={pillar._id}
      pillar={pillar}
      counts={counts.get(pillar.key) || { live: 0, retired: 0 }}
      busy={busyId === pillar._id}
      editing={editingId === pillar._id}
      onEdit={() => setEditingId(pillar._id)}
      onCancelEdit={() => setEditingId(null)}
      // An edit refreshes exactly like a create: the row is re-read from the
      // server and the questions page is told, so a rename is visible here and
      // in the Pillar dropdown without a manual reload.
      onSavedEdit={async (name) => {
        setEditingId(null);
        await afterWrite(`"${name}" was updated.`);
      }}
      onToggleActive={() => toggleActive(pillar)}
      onRemove={() => remove(pillar)}
    />
  );

  return (
    <section className="mt-8" aria-labelledby="ky-pillar-manager">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="ky-pillar-manager"
            className="font-display text-2xl font-semibold text-mist"
          >
            Pillars
            <span className="ml-2 align-middle text-base font-normal text-mist-muted">
              {kyRoot.label}
            </span>
          </h2>
          <p className="mt-1 text-sm text-mist-muted">
            {active.length} active pillar{active.length === 1 ? '' : 's'}
            {retired.length > 0 && ` · ${retired.length} retired`} — the dimensions{' '}
            {kyRoot.short} is scored on. Assign questions with the Pillar dropdown on
            each question above.
          </p>
        </div>
        {!creating && (
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            + Add Pillar
          </button>
        )}
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}
      {note && !err && <p className="mt-4 text-sm text-green-700">{note}</p>}

      {beyondPlan > 0 && (
        <div className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-900">
          <p className="font-medium">
            {beyondPlan} active pillar{beyondPlan === 1 ? '' : 's'} of this root{' '}
            {beyondPlan === 1 ? 'is' : 'are'} outside the assessment plan.
          </p>
          <p className="mt-1 text-xs">
            The {kyRoot.short} assessment still draws its 18 questions from the{' '}
            {expectedPillars} pillars it is configured with, so a question filed
            here is not asked and the result shows this axis empty. Questions can
            still be written and assigned against it. Deactivate the pillar if it
            should not appear on a participant's result — the questions and the
            pillar itself are kept either way.
          </p>
        </div>
      )}

      {creating && (
        <div className="mt-5">
          <PillarForm
            root={kyRoot.id}
            nextSortOrder={nextSortOrder}
            onCancel={() => setCreating(false)}
            onSaved={async () => {
              setCreating(false);
              await afterWrite('Pillar added. It is now available in the Pillar dropdown.');
            }}
          />
        </div>
      )}

      {active.length === 0 && !creating && !err && (
        <p className="mt-6 text-sm text-mist-muted">
          No active pillars for {kyRoot.short}. Add one with “+ Add Pillar”.
        </p>
      )}

      <div className="mt-5 space-y-3">{active.map(renderRow)}</div>

      {retired.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-mist-muted">
            Retired pillars
          </h3>
          <p className="mt-1 text-xs text-mist-muted">
            Kept in the database and never offered for a new question. A question
            already filed under one keeps it. Activate one to make it selectable
            again — nothing is restored silently.
          </p>
          <div className="mt-3 space-y-3">{retired.map(renderRow)}</div>
        </div>
      )}

      {/* What the counts above actually describe, stated once so the numbers
          can be read without counting the cards. */}
      <p className="mt-4 text-xs text-mist-muted">
        {totalLive} active question{totalLive === 1 ? '' : 's'} across {active.length}{' '}
        active pillar{active.length === 1 ? '' : 's'}
        {unfiled > 0 && ` · ${unfiled} not yet filed under a pillar`}
        {totalLive > 0 &&
          active.some((c) => (counts.get(c.key)?.live || 0) === 0) &&
          ' · a pillar with 0 questions is not counted towards the result'}
        .
      </p>
    </section>
  );
}
