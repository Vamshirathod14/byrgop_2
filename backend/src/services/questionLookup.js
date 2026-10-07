import mongoose from 'mongoose';
import Question from '../models/Question.js';

/**
 * Tolerant Question lookups for the intro onboarding bank.
 *
 * Some onboarding question rows predate the schema and carry a legacy STRING
 * _id (e.g. "q-startup-strategic", "q-startup-operational"). Because the
 * Question schema declares `_id` as ObjectId, `Question.findById(legacyId)`
 * throws a CastError — which broke Admin delete/edit and the participant
 * answer path for those rows. All Question lookups that take an external id
 * should go through `findQuestionById`, which uses the normal Mongoose path
 * for ObjectId rows and the raw driver (no casting) for legacy string-id rows.
 *
 * The raw branch returns a plain document (not a Mongoose Document); the
 * consumers in sessionFlow only read fields (options, text, weight, _id), so
 * the response shape is identical. Writes against legacy rows in
 * onboardingAdminService use the raw driver too.
 */
export function isObjectIdQuestionId(id) {
  return id != null && String(id).length > 0 && mongoose.isValidObjectId(id);
}

export async function findQuestionById(id) {
  if (id == null || String(id).trim() === '') return null;
  return isObjectIdQuestionId(id)
    ? Question.findById(id)
    : Question.collection.findOne({ _id: String(id) });
}