import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
    // Every domain belongs to exactly one main business type (Admin-managed).
    businessTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessType',
      default: null,
    },
  },
  { timestamps: true }
);

domainSchema.index({ active: 1, slug: 1 });

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const Domain = mongoose.model('Domain', domainSchema);
export default Domain;