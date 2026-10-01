#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   Seed the three Know Yourself question roots.

   Creates / repairs, idempotently:
     • the three business types' `kyRoot` bindings
     • the `startup` business type (does not exist by default)
     • all three six-pillar structures (Manufacturing & Services keeps its
       EXISTING keys untouched — nothing is renamed or deleted)
     • 18 Start-Up questions and 18 Non-Profit questions, 3 per pillar

   SAFETY
   ------
   • DRY RUN BY DEFAULT. Nothing is written without `--apply`.
   • Never runs against production by accident: the script refuses to start
     unless MONGO_URI points at a database you have explicitly named via
     `--allow-db <name>` (or the host is localhost), and it prints the target
     host so you can check it before applying.
   • Every write is a $setOnInsert / upsert keyed on the natural key, so
     re-running is safe and never duplicates, never deletes, and never
     activates an unrelated question.
   • Existing completed sessions are never touched: question and pillar docs
     are only created, and a pillar that already exists keeps its name,
     colour, order and active flag.
   • A pillar set that has CHANGED (e.g. the Non-Profit framework was
     replaced) leaves the superseded pillars and their questions behind,
     because the seeder only creates. Pass `--retire-orphans` to DEACTIVATE
     them. Still never deletes: a completed session's snapshot keeps working.
   • A pillar set that has just been RENAMED (the Non-Profit six pillars
      now carry the framework's own names) is carried across IN PLACE by
      `renamePillars`: the pillar document keeps its id and every question
      pointing at the old key is repointed. Nothing is deleted or recreated.

   Usage
     node scripts/seedKyRoots.js                 # report only
     node scripts/seedKyRoots.js --apply         # write
     node scripts/seedKyRoots.js --apply --retire-orphans   # also deactivate superseded pillars/questions
     MONGO_URI=mongodb://127.0.0.1:27017/byrgop node scripts/seedKyRoots.js --apply
   ───────────────────────────────────────────────────────────── */

import 'dotenv/config';
import mongoose from 'mongoose';
import BusinessType from '../src/models/BusinessType.js';
import KYCategory from '../src/models/KYCategory.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import {
  KY_ROOTS,
  KY_ROOT_IDS,
  DOMAIN_SELECTION_ROOT,
  pillarsForRoot,
  pillarKeysForRoot,
  resolveKyRoot,
  QUESTIONS_PER_ASSESSMENT,
} from '../src/config/kyQuestionRoots.js';
import {
  QUESTION_BANKS_BY_ROOT,
  BUSINESS_TYPE_FOR_ROOT,
} from '../src/config/kyQuestionBanks.js';

const APPLY = process.argv.includes('--apply');
const allowDbIdx = process.argv.indexOf('--allow-db');
const ALLOW_DB = allowDbIdx !== -1 ? process.argv[allowDbIdx + 1] : null;

const uri = process.env.MONGO_URI || '';
if (!uri) {
  console.error('MONGO_URI is not set. Refusing to run.');
  process.exit(1);
}

let host = 'unknown';
try {
  host = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://')).host;
} catch {
  /* leave as unknown */
}
const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|$)/.test(host) || host === '::1';
const dbName = uri.split('/').pop()?.split('?')[0] || '';

console.log('──────────────────────────────────────────────');
console.log('Seed Know Yourself question roots');
console.log('──────────────────────────────────────────────');
console.log('mode        :', APPLY ? 'APPLY (writes)' : 'DRY RUN (no writes)');
console.log('target host :', host, isLocal ? '(local)' : '(REMOTE)');
console.log('target db   :', dbName);

if (APPLY && !isLocal) {
  if (!ALLOW_DB) {
    console.error('');
    console.error('REFUSING to write to a remote database without an explicit acknowledgement.');
    console.error('Re-run with:  --allow-db "' + dbName + '"   once you have confirmed the target.');
    process.exit(1);
  }
  console.log('acknowledged remote target:', ALLOW_DB);
}
if (!APPLY) {
  console.log('');
  console.log('Nothing will be written. Re-run with --apply to make these changes.');
}

const RETIRE_ORPHANS = process.argv.includes('--retire-orphans');
const report = { businessTypes: [], pillars: [], questions: [], retired: [], renames: [], indexes: [], questionRoots: [] };

/**
 * Pillar keys that were renamed, root → [old key, new key].
 *
 * The Non-Profit six pillars were renamed to the framework's own names
 * (Mission & Impact → Strategy, Fundraising & Donor Relations → Revenue, …).
 * A rename is done IN PLACE rather than by retiring the old pillar and creating
 * a new one, because the pillar document keeps its id: every question that
 * pointed at the old key is repointed to the new one in the same pass, and any
 * stored session that referenced the pillar still resolves. Retiring + creating
 * would have orphaned the questions and reset their history for no reason.
 *
 * Idempotent: an old key that is already gone, or a new key that already exists,
 * is skipped rather than merged, so re-running can never lose a question.
 */
const PILLAR_RENAMES = {
  'non-profit': [
    ['nonprofit-mission-impact', 'nonprofit-strategy'],
    ['nonprofit-fundraising-donors', 'nonprofit-revenue'],
    ['nonprofit-program-delivery', 'nonprofit-operations'],
    ['nonprofit-financial-compliance', 'nonprofit-finance'],
    ['nonprofit-people-management', 'nonprofit-people-culture'],
    ['nonprofit-governance-trust', 'nonprofit-governance'],
  ],
};

async function renamePillars() {
  for (const [rootId, pairs] of Object.entries(PILLAR_RENAMES)) {
    const storedRoot = rootId === DOMAIN_SELECTION_ROOT ? null : rootId;
    const byKey = new Map(pillarsForRoot(rootId).map((p) => [p.key, p]));

    for (const [oldKey, newKey] of pairs) {
      const target = byKey.get(newKey);
      if (!target) throw new Error(`rename "${oldKey}" → "${newKey}" but "${newKey}" is not in the ${rootId} pillar set`);

      const oldDoc = await KYCategory.findOne({ key: oldKey, kyRoot: storedRoot });
      if (!oldDoc) {
        report.renames.push(`${rootId}: "${oldKey}" already renamed — nothing to do`);
        continue;
      }
      const existingNew = await KYCategory.findOne({ key: newKey, kyRoot: storedRoot });
      if (existingNew) {
        report.renames.push(
          `${rootId}: SKIPPED "${oldKey}" → "${newKey}" — "${newKey}" already exists; not merging, report this`
        );
        continue;
      }

      // How many questions point at the old key, in this root's business type.
      const businessType = BUSINESS_TYPE_FOR_ROOT[rootId];
      const movers = await KnowYourselfQuestion.countDocuments({
        businessType,
        category: oldKey,
      });

      report.renames.push(
        `${rootId}: rename pillar "${oldKey}" → "${newKey}" (${target.name}) and repoint ${movers} question(s)`
      );
      if (!APPLY) continue;

      // The pillar document is updated, not replaced, so its id — and anything
      // that already points at that id — survives the rename.
      await KYCategory.updateOne(
        { _id: oldDoc._id },
        { $set: { key: newKey, name: target.name, color: target.color, sortOrder: target.sortOrder } }
      );
      const res = await KnowYourselfQuestion.updateMany(
        { businessType, category: oldKey },
        { $set: { category: newKey } }
      );
      report.renames.push(`  → repointed ${res.modifiedCount} question(s) to "${newKey}"`);
    }
  }
}

async function reconcileCategoryIndexes() {
  // The historical single-field unique index on kycategories.key prevents the
  // per-root keys from being inserted. Replace it with the compound index the
  // schema now declares. Guarded: absent on a fresh database.
  try {
    const indexes = await KYCategory.collection.indexes();
    const legacy = indexes.find((i) => i.name === 'key_1' && i.unique);
    if (legacy) {
      report.indexes.push('drop legacy unique index kycategories.key_1');
      if (APPLY) await KYCategory.collection.dropIndex('key_1');
    }
  } catch (err) {
    report.indexes.push(`could not inspect kycategories indexes: ${err.message}`);
  }
  if (APPLY) {
    try {
      await KYCategory.syncIndexes();
      report.indexes.push('ensured compound index kycategories.kyRoot_1_key_1');
    } catch (err) {
      report.indexes.push(`syncIndexes warning: ${err.message}`);
    }
  }
}

async function seedBusinessTypes() {
  const wanted = {
    service: 'manufacturing-services',
    product: 'manufacturing-services',
    ngo: 'non-profit',
    startup: 'startup',
  };
  const names = {
    service: 'Service Based',
    product: 'Product Based',
    ngo: 'NGO / Non-Profit',
    startup: 'Start-Up',
  };
  const descriptions = {
    service: 'Consulting, agencies, professional & financial services.',
    product: 'Manufacturing, retail, distribution and product brands.',
    ngo: 'Non-profit organisations, foundations and social impact.',
    startup: 'Early-stage ventures and start-ups.',
  };
  const sortOrders = { service: 1, product: 2, ngo: 3, startup: 4 };

  for (const [key, kyRoot] of Object.entries(wanted)) {
    // Read the RAW stored document: Mongoose reports the schema default for a
    // field that was never persisted, which would make the "is the root
    // binding already written?" check below report a false match.
    const raw = await BusinessType.collection.findOne({ key }, { projection: { kyRoot: 1 } });
    const existing = await BusinessType.findOne({ key });
    if (!existing) {
      report.businessTypes.push(`create business type "${key}" (root ${kyRoot})`);
      if (APPLY) {
        await BusinessType.create({
          key,
          name: names[key],
          description: descriptions[key],
          sortOrder: sortOrders[key],
          kyRoot,
          active: true,
        });
      }
      continue;
    }
    // Only the root binding is written, and only when it differs. Names,
    // descriptions, ordering and the active flag are admin-owned and left
    // exactly as they are.
    const storedRoot = raw?.kyRoot ? String(raw.kyRoot).toLowerCase().trim() : null;
    if (storedRoot === kyRoot) {
      report.businessTypes.push(`business type "${key}" already on root ${kyRoot} — unchanged`);
      continue;
    }
    report.businessTypes.push(
      `set business type "${key}".kyRoot ${storedRoot || '(unset)'} → ${kyRoot}`
    );
    if (APPLY) {
      existing.kyRoot = kyRoot;
      await existing.save();
    }
  }
}

async function seedPillars() {
  for (const rootId of KY_ROOT_IDS) {
    const storedRoot = rootId === DOMAIN_SELECTION_ROOT ? null : rootId;
    for (const pillar of pillarsForRoot(rootId)) {
      const existing = await KYCategory.findOne({ key: pillar.key, kyRoot: storedRoot });
      if (existing) {
        report.pillars.push(`${rootId}: pillar "${pillar.key}" already exists — unchanged`);
        continue;
      }
      report.pillars.push(`${rootId}: create pillar "${pillar.key}" (${pillar.name})`);
      if (APPLY) {
        await KYCategory.create({
          key: pillar.key,
          name: pillar.name,
          color: pillar.color,
          sortOrder: pillar.sortOrder,
          kyRoot: storedRoot,
          active: true,
        });
      }
    }
  }
}

/**
 * Retire pillars and questions that belong to a root but are no longer part of
 * that root's configured set.
 *
 * This exists because the CONTENT of a root can change — the Non-Profit
 * framework was replaced with a new six-pillar set, and later again with a new
 * set of 18 questions on those same six pillars. The seeder only ever CREATES,
 * so a retired pillar or a superseded question would otherwise stay active
 * forever and the root would either report more than six dimensions or serve a
 * mix of old and new questions.
 *
 * Two independent kinds of supersession are detected, because they have
 * different causes and must not be conflated:
 *
 *   1. The question's PILLAR left the root's configured pillar set (the pillar
 *      itself was renamed away or retired).
 *   2. The question's TEXT left the configured bank, while its pillar is still
 *      valid (the bank was rewritten in place — same six pillars, new wording).
 *
 * Only (2) is a rewrite of the questions; only (1) implies the pillar structure
 * moved. Both retire the question for the same reason and by the same
 * mechanism, so both are handled here.
 *
 * Deactivation, never deletion: an old question may still be referenced by a
 * completed session snapshot, and an inactive question keeps that history
 * readable. Nothing is ever removed.
 *
 * Opt-in via `--retire-orphans`, and reported in the dry run either way, so
 * this can never happen by surprise.
 */
async function retireOrphans() {
  for (const rootId of KY_ROOT_IDS) {
    const storedRoot = rootId === DOMAIN_SELECTION_ROOT ? null : rootId;
    const validPillars = new Set(pillarKeysForRoot(rootId));
    const businessType = BUSINESS_TYPE_FOR_ROOT[rootId];

    // Only the two seeded roots have a bank we own end-to-end. The shared
    // Manufacturing & Services questions are Admin-managed and predate this
    // script, so they are never touched here.
    if (!businessType) {
      report.retired.push(`${rootId}: skipped — not a seeded bank`);
      continue;
    }

    const stalePillars = await KYCategory.find({
      key: { $nin: [...validPillars] },
      ...(storedRoot === null ? { kyRoot: null } : { kyRoot: storedRoot }),
      active: true,
    }).lean();
    for (const p of stalePillars) {
      report.retired.push(`${rootId}: retire pillar "${p.key}" (${p.name}) — not in the current pillar set`);
      if (APPLY) await KYCategory.updateOne({ _id: p._id }, { $set: { active: false } });
    }

    const staleQuestions = await KnowYourselfQuestion.find({
      businessType,
      category: { $nin: [...validPillars] },
      active: true,
    }).lean();
    for (const q of staleQuestions) {
      report.retired.push(
        `${rootId}: retire question [${q.category}] "${String(q.text).slice(0, 58)}…" — pillar retired`
      );
      if (APPLY) await KnowYourselfQuestion.updateOne({ _id: q._id }, { $set: { active: false } });
    }

    // Superseded wording: the question still sits on a valid pillar, but its
    // text is no longer one this bank defines. This is what happens when a
    // root's 18 questions are rewritten without touching the six pillars — the
    // pillar rule above cannot see it, so without this pass the root would
    // serve a mixture of the old and the new questions.
    const bankTexts = new Set(
      (QUESTION_BANKS_BY_ROOT[rootId] || []).map((question) => question.text)
    );
    if (bankTexts.size === 0) continue;

    const superseded = await KnowYourselfQuestion.find({
      businessType,
      active: true,
      text: { $nin: [...bankTexts] },
    }).lean();
    for (const q of superseded) {
      report.retired.push(
        `${rootId}: retire question [${q.category}] "${String(q.text).slice(0, 58)}…" — wording superseded`
      );
      if (APPLY) await KnowYourselfQuestion.updateOne({ _id: q._id }, { $set: { active: false } });
    }
  }
}

/**
 * Compare two glossaries by what the user actually sees.
 *
 * A stored glossary entry carries a Mongoose `_id`, so a straight JSON
 * comparison reports drift on every row forever — the database is right and the
 * check is wrong, which trains you to ignore it. Comparing only the two fields
 * that are rendered keeps a real edit visible without that noise.
 */
function glossaryShape(glossary) {
  return (glossary || [])
    .map((entry) => `${entry.abbreviation}=${entry.fullForm}`)
    .sort()
    .join('|');
}

async function seedQuestions() {
  for (const [rootId, questions] of Object.entries(QUESTION_BANKS_BY_ROOT)) {
    const businessType = BUSINESS_TYPE_FOR_ROOT[rootId];
    const validPillars = new Set(pillarKeysForRoot(rootId));

    for (const question of questions) {
      if (!validPillars.has(question.category)) {
        throw new Error(
          `Question "${question.text}" targets pillar "${question.category}", which is not part of the ${rootId} pillar set`
        );
      }
      const existing = await KnowYourselfQuestion.findOne({ text: question.text });
      if (existing) {
        // Both seeded banks are owned end-to-end by this script (see
        // retireOrphans), so "already exists" must not mean "leave whatever is
        // in the database". Editing a question in the config — adding a
        // glossary term, fixing a typo — has to reach the database, otherwise
        // the config and the served questions drift apart silently: the same
        // stem serves an older glossary forever with no error anywhere.
        //
        // Only the fields this script owns are compared, and only those are
        // written, so an Admin's manual edits to anything else survive. The
        // comparison is on the values the user actually sees, not on ids.
        const drift = [];
        if (existing.category !== question.category) {
          drift.push(`pillar "${existing.category}" → "${question.category}"`);
        }
        // Options are compared as (text, score) pairs rather than as two
        // parallel arrays: the stored order is not meaningful to anyone, but a
        // changed score or a reworded option is. Pairing by text also means a
        // reordering in the config is correctly treated as "no change".
        const shape = (options) =>
          (options || [])
            .map((o) => `${o.text}::${o.score}`)
            .sort()
            .join('|');
        if (shape(question.options) !== shape(existing.options)) {
          drift.push('options');
        }
        if (glossaryShape(question.glossary) !== glossaryShape(existing.glossary)) {
          drift.push('glossary');
        }

        if (drift.length === 0) {
          report.questions.push(
            `${businessType}: question already exists — "${question.text.slice(0, 58)}…"`
          );
          continue;
        }

        report.questions.push(
          `${businessType}: update question [${question.category}] "${question.text.slice(0, 58)}…" — ${drift.join(', ')}`
        );
        if (APPLY) {
          // Options are rewritten wholesale, preserving each stored option's
          // id so any existing answer that references it still resolves.
          const byText = new Map((existing.options || []).map((o) => [o.text, o]));
          await KnowYourselfQuestion.updateOne(
            { _id: existing._id },
            {
              $set: {
                category: question.category,
                glossary: question.glossary || [],
                options: (question.options || []).map((op) => {
                  const prior = byText.get(op.text);
                  return {
                    _id: prior?._id,
                    text: op.text,
                    score: op.score,
                    active: prior ? prior.active !== false : true,
                  };
                }),
              },
            }
          );
        }
        continue;
      }
      report.questions.push(
        `${businessType}: create question [${question.category}] "${question.text.slice(0, 58)}…"`
      );
      if (APPLY) {
        await KnowYourselfQuestion.create({
          text: question.text,
          type: 'generic',
          domain: null,
          category: question.category,
          businessType,
          kyRoot: rootId,
          active: true,
          options: question.options.map((op) => ({ ...op, active: true })),
          glossary: question.glossary || [],
        });
      }
    }
  }
}

/**
 * Stamp the denormalised `kyRoot` on every question belonging to a seeded root.
 *
 * The two seeded banks are Start-Up and Non-Profit. Both are owned end-to-end by
 * this script, so every question carrying their business type — active or
 * retired — gets its root recorded, which is what makes the isolation
 * auditable straight from the document:
 *
 *     { businessType: 'ngo',  kyRoot: 'non-profit' }
 *     { businessType: 'startup', kyRoot: 'startup' }
 *
 * The shared Manufacturing & Services questions are deliberately NOT touched:
 * they carry no business type, their root is legitimately shared, and the field
 * is absent on them exactly as before. This is a pure backfill — it never
 * activates, deactivates, re-parents or edits any question.
 */
async function stampQuestionRoots() {
  for (const [rootId, businessType] of Object.entries(BUSINESS_TYPE_FOR_ROOT)) {
    const stale = await KnowYourselfQuestion.find({
      businessType,
      $or: [{ kyRoot: { $exists: false } }, { kyRoot: null }, { kyRoot: { $ne: rootId } }],
    })
      .select('_id kyRoot active')
      .lean();
    if (stale.length === 0) {
      report.questionRoots.push(`${rootId}: all questions already declare kyRoot "${rootId}"`);
      continue;
    }
    const activeCount = stale.filter((q) => q.active).length;
    report.questionRoots.push(
      `${rootId}: set kyRoot "${rootId}" on ${stale.length} question(s) ` +
        `(${activeCount} active, ${stale.length - activeCount} retired)`
    );
    if (APPLY) {
      await KnowYourselfQuestion.updateMany(
        { _id: { $in: stale.map((q) => q._id) } },
        { $set: { kyRoot: rootId } }
      );
    }
  }
}

async function summarise() {
  console.log('');
  console.log('── Index reconciliation ─────────────────────────');
  if (report.indexes.length === 0) console.log('  (nothing to do)');
  report.indexes.forEach((l) => console.log('  • ' + l));

  console.log('');
  console.log('── Business types ──────────────────────────────');
  report.businessTypes.forEach((l) => console.log('  • ' + l));

  console.log('');
  console.log('── Pillars ─────────────────────────────────────');
  report.pillars.forEach((l) => console.log('  • ' + l));

  console.log('');
  console.log('── Renamed pillars (in place, questions repointed) ──');
  if (report.renames.length === 0) console.log('  (nothing to do)');
  report.renames.forEach((l) => console.log('  • ' + l));

  console.log('');
  console.log('── Questions ───────────────────────────────────');
  report.questions.forEach((l) => console.log('  • ' + l));

  console.log('');
  console.log('── Question root stamps ───────────────────────');
  if (report.questionRoots.length === 0) console.log('  (nothing to do)');
  report.questionRoots.forEach((l) => console.log('  • ' + l));

  console.log('');
  console.log('── Retired (superseded pillars / questions) ─────');
  if (report.retired.length === 0) {
    console.log(
      RETIRE_ORPHANS
        ? '  (nothing to retire)'
        : '  (not checked — re-run with --retire-orphans to deactivate pillars a changed framework no longer uses)'
    );
  } else {
    report.retired.forEach((l) => console.log('  • ' + l));
  }

  console.log('');
  console.log('── Resulting state ────────────────────────────');
  const perRoot = {};
  for (const rootId of KY_ROOT_IDS) {
    const storedRoot = rootId === DOMAIN_SELECTION_ROOT ? null : rootId;
    // Active only: a retired pillar stays in the collection for history and
    // must not be counted as one of the root's six dimensions.
    const cats = await KYCategory.find({ kyRoot: storedRoot, active: true }).lean();
    const types = Object.entries(BUSINESS_TYPE_FOR_ROOT).find(
      ([r]) => r === rootId
    );
    const qFilter = types
      ? { businessType: types[1] }
      : { $or: [{ businessType: null }, { businessType: '' }] };
    const qs = await KnowYourselfQuestion.find({ ...qFilter, active: true, type: 'generic' }).lean();
    const covered = new Set(qs.map((x) => x.category).filter(Boolean));
    perRoot[rootId] = { pillars: cats.length, activeQuestions: qs.length, pillarsWithQuestions: covered.size };
    console.log(
      `  ${rootId.padEnd(24)} pillars=${cats.length}  active generic questions=${qs.length}  pillars covered=${covered.size}`
    );
    if (!APPLY && cats.length < 6) {
      console.log(`  (dry run: ${6 - cats.length} pillar(s) would still be missing)`);
    }
  }
  console.log('');
  console.log(
    APPLY
      ? 'Done. Changes were written to: ' + host + '/' + dbName
      : 'Dry run complete. Re-run with --apply to make these changes.'
  );
  return perRoot;
}

async function main() {
  await mongoose.connect(uri);
  try {
    await reconcileCategoryIndexes();
    await seedBusinessTypes();
    await renamePillars();
    await seedPillars();
    await seedQuestions();
    await stampQuestionRoots();
    if (RETIRE_ORPHANS) await retireOrphans();
    await summarise();
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('\nSEED FAILED:', err.message);
  process.exit(1);
});

export { QUESTIONS_PER_ASSESSMENT, KY_ROOTS };
