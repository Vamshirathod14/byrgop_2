import mongoose from 'mongoose';
import { ONBOARDING_BUSINESS_TYPE_KEYS } from '../config/onboarding.js';
import { normalizeOptionColor } from '../config/optionColors.js';

const answerOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    stageKey: { type: String, default: null, lowercase: true, trim: true },
    active: { type: Boolean, default: true },
    // Hex colour rendered on the Yes / No answer button. Missing values are
    // backfilled to the defaults during pre-validate; a present value that is
    // not a valid hex colour is rejected.
    color: { type: String, default: null },
  },
  { _id: true }
);

export function validateActiveQuestion(q) {
  const errors = [];
  const weight = Number(q.weight);
  if (!Number.isFinite(weight) || weight <= 0) {
    errors.push('Weight must be greater than 0');
  }

  if (q.active) {
    const options = (q.options || []).filter((o) => o.active);
    const text = (o) => String(o.text || '').trim().toLowerCase();
    const yes = options.find((o) => text(o) === 'yes');
    const no = options.find((o) => text(o) === 'no');

    if (!yes) errors.push('Active question must have an active Yes option');
    if (!no) errors.push('Active question must have an active No option');
    if (yes && Number(yes.score) !== 1) errors.push('Yes option score must be exactly 1');
    if (no && Number(no.score) !== 0) errors.push('No option score must be exactly 0');
  }

  return errors;
}

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    weight: { type: Number, required: true, default: 10 },
    stageKey: { type: String, default: null, lowercase: true, trim: true },
    options: { type: [answerOptionSchema], default: [] },
    active: { type: Boolean, default: true },
    mark: { type: String, index: true },
    // Intro onboarding scope. Every onboarding question belongs to exactly one
    // of the four business types — there is no generic/common question bank.
    // The Intro flow resolves questions strictly by this field.
    businessType: {
      type: String,
      required: true,
      enum: ONBOARDING_BUSINESS_TYPE_KEYS,
      lowercase: true,
      trim: true,
    },
    // Client-side ordering used to pick the deterministic onboarding question
    // for a (businessType, category) pair.
    displayOrder: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

questionSchema.path('weight').validate(function (v) {
  return Number(v) > 0;
}, 'Weight must be greater than 0');

questionSchema.pre('validate', function (next) {
  // Backfill missing answer colours (Yes → default green, No → default red)
  // and reject malformed ones. Legacy documents without colours stay valid.
  if (Array.isArray(this.options)) {
    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      try {
        opt.color = normalizeOptionColor({
          text: opt.text,
          color: opt.color,
          index: i,
        });
      } catch (err) {
        err.status = 400;
        return next(err);
      }
    }
  }

  const errors = validateActiveQuestion(this);
  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    return next(err);
  }
  next();
});

questionSchema.index({ category: 1, active: 1 });
questionSchema.index({ category: 1, active: 1, businessType: 1 });

export default mongoose.model('Question', questionSchema);
