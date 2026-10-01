import mongoose from 'mongoose';
import { KY_ROOT_IDS } from '../config/kyQuestionRoots.js';

// Result categories ("pillars") for the Know Yourself assessment (six-dimension
// scoring). Fully admin-managed: name/order/active drive both question mapping
// and the result visualisation. Kept separate from the onboarding `Category`
// model.
//
// Each category belongs to a Know Yourself question root. A null `kyRoot` means
// the shared Manufacturing & Services set, which is where every pre-existing
// category lives — their keys are unchanged, so no existing question, session
// snapshot or result has to be rewritten. Start-Up and Non-Profit each get their
// own six pillars under their own root, which is what stops their questions
// from ever being scored against the Services pillars.
const kyCategorySchema = new mongoose.Schema(
  {
    // Unique per root, not globally, so the same key can exist in two roots.
    // `kyRoot` may be null/'' (the shared set), so the constraint is the
    // compound index declared below.
    key: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    color: { type: String, default: '#0A78CF' },
    // null = the shared Manufacturing & Services pillar set.
    kyRoot: {
      type: String,
      enum: [...KY_ROOT_IDS, null, ''],
      default: null,
      lowercase: true,
      trim: true,
    },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One key per root. The historical single-field `key_1` unique index has to be
// dropped before per-root keys become insertable; scripts/seedKyRoots.js
// reconciles the indexes idempotently.
kyCategorySchema.index({ kyRoot: 1, key: 1 }, { unique: true, name: 'kyRoot_1_key_1' });
kyCategorySchema.index({ sortOrder: 1, name: 1 });

export default mongoose.model('KYCategory', kyCategorySchema);
