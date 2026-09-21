import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

contactSchema.index({ submittedAt: -1 });
contactSchema.index({ email: 1 });

export default mongoose.model('Contact', contactSchema);
