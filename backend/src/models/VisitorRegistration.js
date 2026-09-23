import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    qrToken: { type: String, required: true, unique: true },
    qrIssuedAt: { type: Date, required: true },
    qrExpiresAt: { type: Date, required: true },
    attendanceStatus: { type: String, enum: ['not_attended', 'attended'], default: 'not_attended' },
    attendedAt: { type: Date, default: null },
  },
  { _id: true }
);

const visitorRegistrationSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    memberKey: { type: String, required: true, trim: true },
    memberName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    visitors: { type: [visitorSchema], required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

visitorRegistrationSchema.index({ registeredAt: -1 });

export default mongoose.model('VisitorRegistration', visitorRegistrationSchema);