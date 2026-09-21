import mongoose from 'mongoose';

const resultContentSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    minScore: { type: Number, required: true, min: 0, max: 100 },
    maxScore: { type: Number, required: true, min: 0, max: 100 },
    title: { type: String, required: true, trim: true },
    interpretation: { type: String, required: true },
    recommendations: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    mark: { type: String, index: true },
  },
  { timestamps: true }
);

resultContentSchema.index({ category: 1, active: 1, minScore: 1 });

export default mongoose.model('ResultContent', resultContentSchema);
