import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      enum: ['strategic', 'operational', 'revenue'],
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
