import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth, hasPermission } from '../context/AuthContext.jsx';
import KyRootWorkspace from './KyRootWorkspace.jsx';
import {
  KY_NAV_ENTRIES,
  DEFAULT_KY_NAV_KEY,
  isKyNavKey,
  getKyNavEntry,
  navLabelFor,
} from '../lib/kyRoots.js';

/* ─────────────────────────────────────────────────────────────
   THE ONE "KY Questions" AREA

   The sidebar has a single `KY Questions` entry. This page is what
   it opens: a chooser for the four things an editor can work on —
   Manufacturing, Services, Start-Up and Non-Profit — and, below it,
   that selection's own workspace.

   The chooser is the ONLY structural addition. Everything underneath
   is the existing, unmodified `KyRootWorkspace`, and every entry
   hands it the root it already had:

     Manufacturing → root 'manufacturing-services' · businessType 'product'
     Services      → root 'manufacturing-services' · businessType 'service'
     Start-Up       → root 'startup'
     Non-Profit    → root 'non-profit'

   `businessType` is a VIEW scope, passed through untouched. Because
   Manufacturing and Services genuinely share one root, one question
   bank, one six-pillar set and one domain system, "selecting
   Manufacturing" is exactly "the Mfg & Services page, opened on the
   Manufacturing tab that has always existed" — the identical component,
   the identical API calls, the identical editor and save path.

   Selecting Start-Up or Non-Profit selects their own root, which has no
   domain step, so no Domain or Business Type control is ever rendered
   there. A question created from either is stamped with that root's
   business type by the page itself, so it cannot land in the shared
   Manufacturing & Services pool.
   ───────────────────────────────────────────────────────────── */
export default function KYQuestionsArea() {
  const { admin } = useAuth();
  const canSeeQuestions = hasPermission(admin, 'questions.view');
  const canSeePillars = hasPermission(admin, 'results.manage');

  // A key that is not one of the four would render an unnamed page, so it is
  // normalised the same way everywhere else in Admin.
  const [key, setKey] = useState(DEFAULT_KY_NAV_KEY);
  const activeKey = isKyNavKey(key) ? key : DEFAULT_KY_NAV_KEY;
  const entry = getKyNavEntry(activeKey);

  // Only the LABELS are read from the API, so a business type renamed in the
  // database is renamed here too. Which questions and pillars belong to a root
  // is still decided entirely on the server. A failure here only costs the live
  // name — the constant label is the fallback, and the pages below load their
  // own copies regardless.
  const [businessTypes, setBusinessTypes] = useState([]);
  useEffect(() => {
    let live = true;
    api
      .businessTypes()
      .then((rows) => {
        if (live && Array.isArray(rows)) setBusinessTypes(rows);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="font-display text-2xl font-semibold text-mist">KY Questions</h1>
        <p className="mt-1 text-sm text-mist-muted">
          Every Know Yourself question bank in one place. Choose the root or business type you are
          editing; the questions and the six-pillar result structure below always belong to that
          selection.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {KY_NAV_ENTRIES.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => setKey(e.key)}
              aria-pressed={activeKey === e.key}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                activeKey === e.key
                  ? 'border-brand-accent/50 bg-brand-accent/10 text-brand-accentText'
                  : 'border-slate-200 bg-slate-50 text-mist-muted hover:border-slate-300 hover:text-mist'
              }`}
            >
              {navLabelFor(e, businessTypes)}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-mist-muted">
          {canSeeQuestions && canSeePillars
            ? 'Manufacturing and Services share one question bank, one six-pillar result structure and the domain-selection step. Start-Up and Non-Profit each own a separate bank with their own six pillars and no domain step.'
            : canSeeQuestions
              ? 'Start-Up and Non-Profit each own a separate question bank with their own six pillars and no domain step.'
              : 'You can view the pillar structures. Editing questions requires the questions permission.'}
        </p>
      </div>

      <div className="mt-5">
        {/* Keyed by root AND business type so switching between Manufacturing and
            Services (or to Start-Up / Non-Profit) fully resets the search box,
            filters, open editor and pillar selection. No state can leak from one
            bank into another. */}
        <KyRootWorkspace
          key={`${entry.root}::${entry.businessType || ''}`}
          root={entry.root}
          businessType={entry.businessType}
        />
      </div>
    </div>
  );
}
