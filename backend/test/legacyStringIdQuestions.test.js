/* ─────────────────────────────────────────────────────────────────────────
   LEGACY STRING-_id ONBOARDING QUESTIONS.

   Two Atlas onboarding rows predate the schema and carry a legacy STRING
   `_id` ("q-startup-strategic", "q-startup-operational"). Because the
   Question schema declares `_id` as ObjectId, `Question.findById(legacyId)`
   throws a CastError — which surfaced as "Cast to ObjectId failed ... at
   path \"_id\" for model \"Question\"" when an Admin deleted the startup
   Strategic question, and would equally break editing and the participant
   answer path for those rows.

   These tests prove every admin operation (get / update / setActive /
   delete) and the participant lookup (`findQuestionById`) tolerate such
   rows, using a self-cleaning scratch row created with a string `_id`.

   The live group skips when no Atlas URI is configured (fresh CI checkout
   without backend/.env), matching the pattern in singleSourceOfTruth.test.js
   and nonprofitBank.test.js.
   ───────────────────────────────────────────────────────────────────────── */

import 'dotenv/config';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import { connectDB, resolveMongoUri, isLocalMongoUri } from '../src/config/db.js';
import Question from '../src/models/Question.js';
import { findQuestionById } from '../src/services/questionLookup.js';
import {
  getOnboardingQuestion,
  updateOnboardingQuestion,
  setOnboardingQuestionActive,
  deleteOnboardingQuestion,
} from '../src/services/onboardingAdminService.js';

const uri = resolveMongoUri();
const liveAvailable = Boolean(uri) && !isLocalMongoUri(uri);

describe('legacy string-_id onboarding questions (live)', { skip: !liveAvailable }, () => {
  // A legacy row that would fail `Question.findById` (non-castable string _id).
  const SCRATCH_ID = `q-fix-${Date.now()}`;

  before(async () => {
    try {
      await connectDB();
    } catch {
      // connectDB exits on unreachable clusters; a configured-but-unreachable
      // URI is out of scope for this suite.
    }
    await Question.collection.insertOne({
      _id: SCRATCH_ID,
      text: 'Legacy scratch strategic question',
      businessType: 'startup',
      category: new mongoose.Types.ObjectId(),
      stageKey: null,
      weight: 10,
      displayOrder: 0,
      active: true,
      options: [
        { _id: new mongoose.Types.ObjectId(), text: 'Yes', score: 1, active: true, color: '#0A78CF' },
        { _id: new mongoose.Types.ObjectId(), text: 'No', score: 0, active: true, color: '#E53935' },
      ],
    });
  });

  after(async () => {
    // Self-cleaning even if a test failed mid-way.
    await Question.collection.deleteOne({ _id: SCRATCH_ID });
    await mongoose.disconnect();
  });

  test('the reported bug: Question.findById throws CastError on a string _id', async () => {
    await assert.rejects(
      Question.findById(SCRATCH_ID),
      /Cast to ObjectId failed/
    );
  });

  test('findQuestionById resolves the legacy row via the raw driver (participant answer path)', async () => {
    const q = await findQuestionById(SCRATCH_ID);
    assert.ok(q);
    assert.equal(String(q._id), SCRATCH_ID);
    assert.equal(q.businessType, 'startup');
    assert.equal(q.options.length, 2);
    assert.ok(q.options.every((o) => o._id), 'options carry subdocument _ids');
  });

  test('getOnboardingQuestion reads a legacy string-id row without casting', async () => {
    const q = await getOnboardingQuestion({ id: SCRATCH_ID, businessType: 'startup' });
    assert.equal(String(q._id), SCRATCH_ID);
    assert.equal(q.businessType, 'startup');
    assert.ok(q.category, 'category resolved');
  });

  test('updateOnboardingQuestion persists edits to a legacy string-id row', async () => {
    const q = await updateOnboardingQuestion({
      id: SCRATCH_ID,
      businessType: 'startup',
      patch: { text: 'Legacy scratch strategic question (edited)', weight: 11 },
    });
    assert.equal(q.text, 'Legacy scratch strategic question (edited)');
    assert.equal(q.weight, 11);

    const stored = await Question.collection.findOne({ _id: SCRATCH_ID });
    assert.equal(stored.text, 'Legacy scratch strategic question (edited)');
    assert.equal(stored.weight, 11);
    assert.equal(String(stored._id), SCRATCH_ID, '_id kept as the legacy string');
  });

  test('setOnboardingQuestionActive toggles a legacy string-id row', async () => {
    const q = await setOnboardingQuestionActive({
      id: SCRATCH_ID,
      businessType: 'startup',
      active: false,
    });
    assert.equal(q.active, false);
    const stored = await Question.collection.findOne({ _id: SCRATCH_ID });
    assert.equal(stored.active, false);
  });

  test('deleteOnboardingQuestion removes a legacy string-id row (reported failure)', async () => {
    const q = await deleteOnboardingQuestion({ id: SCRATCH_ID, businessType: 'startup' });
    assert.equal(String(q._id), SCRATCH_ID);
    assert.equal(await Question.collection.findOne({ _id: SCRATCH_ID }), null);
    assert.equal(await findQuestionById(SCRATCH_ID), null);
  });
});