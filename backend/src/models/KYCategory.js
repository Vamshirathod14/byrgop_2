import mongoose from 'mongoose';

// Result categories for the Know Yourself assessment (six-dimension scoring).
// Fully admin-managed: name/order/active drive both question mapping and the
// result visualisation. Kept separate from the onboarding `Category` model.
const kyCategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    color: { type: String, default: '#0A78CF' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

kyCategorySchema.index({ sortOrder: 1, name: 1 });

export default mongoose.model('KYCategory', kyCategorySchema);
