import mongoose from 'mongoose';

// Main business types (Service Based / Product Based / NGO / Non-Profit).
// Admin-managed source of truth; every Domain belongs to exactly one type.
const businessTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    // Which Know Yourself question root this business type is assessed
    // against. The root decides two things at runtime:
    //   • whether the flow runs the domain-selection step, and
    //   • which six-pillar structure the result is scored on.
    // `manufacturing-services` is the default so every pre-existing type keeps
    // its current behaviour; `startup` and `non-profit` skip domain selection
    // and use their own question banks. See src/config/kyQuestionRoots.js.
    kyRoot: {
      type: String,
      enum: ['manufacturing-services', 'startup', 'non-profit'],
      default: 'manufacturing-services',
      lowercase: true,
      trim: true,
    },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

businessTypeSchema.index({ sortOrder: 1, name: 1 });

export function slugifyTypeKey(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default mongoose.model('BusinessType', businessTypeSchema);
