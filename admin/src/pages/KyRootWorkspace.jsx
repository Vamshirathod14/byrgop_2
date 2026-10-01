import { useCallback, useState } from 'react';
import { useAuth, hasPermission } from '../context/AuthContext.jsx';
import KnowYourselfQuestions from './KnowYourselfQuestions.jsx';
import KYCategories from './KYCategories.jsx';
import KYPillarManager from './KYPillarManager.jsx';
import { getKyRoot, managesPillarsInline } from '../lib/kyRoots.js';

/* ─────────────────────────────────────────────────────────────
   One Know Yourself question root.

   Inside a root the two things you can edit — the question bank and the
   pillar structure — sit next to each other, because they are two views
   of the SAME root: a question is only valid against a pillar from its
   own root, and changing one without the other is how banks and result
   structures drift apart.

   HOW A ROOT'S PILLARS ARE MANAGED
   --------------------------------
   Manufacturing & Services — frozen. Its pillar UI is the pre-existing
   `KYCategories` page behind a tab, untouched, and `managesPillarsInline`
   is false for that root, which is the only thing that could route it
   onto the new manager.

   Start-Up and Non-Profit — they own their pillar sets outright, so their
   workspace shows the questions and a `KYPillarManager` section in the
   same page. The manager writes to the same pillar API the old page
   used, scoped to the same `?root=`, so nothing about how a pillar is
   stored changes between the two.
   ───────────────────────────────────────────────────────────── */

/**
 * One Know Yourself root.
 *
 * `businessType` is a VIEW scope only, used when Manufacturing and Services are
 * selected as separate entries inside the unified KY Questions area. Both are
 * the same `manufacturing-services` root, so passing one changes only which
 * already-existing business-type tab is opened first — the bank, the pillars,
 * the domain system and the editor are the same code with no branch on it.
 * Omit it (as the old per-root nav did) and the page is byte-for-byte the
 * previous whole-root view.
 */
export default function KyRootWorkspace({ root, businessType = null }) {
  const { admin } = useAuth();
  const kyRoot = getKyRoot(root);
  const canSeeQuestions = hasPermission(admin, 'questions.view');
  const canSeePillars = hasPermission(admin, 'results.manage');

  // Start-Up and Non-Profit manage their own pillars on this page. Manufacturing
  // & Services never reaches this branch, so their pillar page stays the one it
  // has always been.
  const inlinePillars = managesPillarsInline(kyRoot.id);

  // Pillars are a permission-gated view; a user who cannot manage results
  // always lands on the questions, which is the whole point of the root.
  const [view, setView] = useState(canSeePillars && !canSeeQuestions ? 'pillars' : 'questions');

  /* Two counters, one per direction, so the questions view and the pillar
     manager can never disagree about what is on screen:
       · `pillars` is bumped by the manager after a pillar is added, renamed,
         reactivated or retired. The questions view includes it in the
         dependency list of its own load, so the Pillar dropdown picks the new
         pillar up immediately — no page reload needed.
       · `questions` is bumped by the questions view after it saves a question
         or moves one between pillars, which re-reads the manager's counts.
     Both setters come from useState, so their identities are stable for the
     lifetime of the workspace and neither can trigger a re-fetch loop. */
  const [revision, setRevision] = useState({ questions: 0, pillars: 0 });
  const bumpQuestions = useCallback(
    () => setRevision((r) => ({ ...r, questions: r.questions + 1 })),
    []
  );
  const bumpPillars = useCallback(
    () => setRevision((r) => ({ ...r, pillars: r.pillars + 1 })),
    []
  );

  if (!canSeeQuestions && !canSeePillars) return null;

  const showPillarTab = !inlinePillars && canSeePillars;

  const views = [
    ...(canSeeQuestions ? [{ key: 'questions', label: 'Questions' }] : []),
    ...(showPillarTab ? [{ key: 'pillars', label: 'Pillars (result structure)' }] : []),
  ];

  return (
    <div>
      {showPillarTab && (
        <nav className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v.key
                  ? 'bg-brand-accent/15 text-brand-accentText'
                  : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
      )}

      {/* Keyed by root AND business type so switching roots — or switching
          between Manufacturing and Services, which are one root — resets every
          filter, search box and open form. No state leaks from one bank into
          another's. */}
      {canSeeQuestions && (inlinePillars || view === 'questions') && (
        <KnowYourselfQuestions
          key={`q-${kyRoot.id}-${businessType || ''}`}
          root={kyRoot.id}
          businessType={businessType}
          pillarRevision={revision.pillars}
          onDataChanged={bumpQuestions}
        />
      )}

      {showPillarTab && view === 'pillars' && (
        <KYCategories key={`p-${kyRoot.id}`} root={kyRoot.id} />
      )}

      {/* The Start-Up / Non-Profit pillar manager, on the same page as the
          questions it files. Keyed by root so switching roots resets it. */}
      {inlinePillars && canSeePillars && (
        <KYPillarManager
          key={`pm-${kyRoot.id}`}
          root={kyRoot.id}
          questionsRevision={revision.questions}
          onChanged={bumpPillars}
        />
      )}
    </div>
  );
}
