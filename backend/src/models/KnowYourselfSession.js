import mongoose from 'mongoose';

const kySelectedQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowYourselfQuestion', required: true },
    text: { type: String, required: true },
    source: { type: String, enum: ['generic', 'domain'], default: 'generic' },
    category: { type: String, default: null },
    // Question-level abbreviation glossary, snapshotted so resumed sessions
    // keep rendering the same tooltips the user saw originally. Historical
    // sessions may contain a legacy `description` field, which is ignored.
    glossary: [
      {
        abbreviation: { type: String, required: true },
        fullForm: { type: String, required: true },
      },
    ],
    options: [
      {
        optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        text: { type: String, required: true },
        score: { type: Number, required: true },
        // Option colour snapshotted from the source question so historical
        // sessions keep rendering the colours the user originally saw.
        color: { type: String, default: null },
      },
    ],
  },
  { _id: false }
);

const kyAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText: { type: String },
    source: { type: String, enum: ['generic', 'domain'], default: null },
    category: { type: String, default: null },
    optionId: { type: mongoose.Schema.Types.ObjectId },
    optionText: { type: String },
    score: { type: Number, default: 0 },
    // Colour (hex) of the chosen option, snapshotted for display on the
    // results / review screens and PDF report. Untouched by scoring.
    optionColor: { type: String, default: null },
    // Tracking-only response: the user marked this question "Not Applicable".
    // It counts toward progress (answered) but is excluded from scoring. When
    // true, optionId is null, optionText is "Not Applicable" and score is null.
    isNotApplicable: { type: Boolean, default: false },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const kyReportRequestSchema = new mongoose.Schema(
  {
    // Details the user supplies from the Result/Radar page when they ask for the
    // complete report to be delivered to their email. Stored against the session.
    ownerName: { type: String, default: null },
    companyName: { type: String, default: null },
    email: { type: String, default: null },
    website: { type: String, default: null },
    countryCode: { type: String, default: null },
    phone: { type: String, default: null },
    requested: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
    // Automatic delivery pipeline: one request per assessment triggers PDF
    // generation, SMTP delivery and a persisted delivery status.
    pdfGeneratedAt: { type: Date, default: null },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'skipped', null],
      default: null,
    },
    emailAttemptedAt: { type: Date, default: null },
    emailSentAt: { type: Date, default: null },
    emailMessageId: { type: String, default: null },
    emailError: { type: String, default: null },
  },
  { _id: false }
);

const knowYourselfSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    email: { type: String, default: null },
    // Anonymous client identifier (stored in the browser) so a returning user
    // without an email can still resume their in-progress assessment.
    browserId: { type: String, default: null },
    domain: { type: String, default: null },
    domainLabel: { type: String, default: null },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
    // Business type selected at entry: 'service' | 'product' | 'ngo'
    businessType: {
      type: String,
      enum: [null, 'service', 'product', 'ngo'],
      default: null,
    },
    businessTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessType',
      default: null,
    },
    // 1-based attempt counter across completed sessions for the same email
    attemptNumber: { type: Number, default: null },
    selectedQuestions: { type: [kySelectedQuestionSchema], default: [] },
    answers: { type: [kyAnswerSchema], default: [] },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    lastActiveAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    phone: { type: String, default: null },
    contactConsent: { type: Boolean, default: false },
    contactSubmittedAt: { type: Date, default: null },
    proBonoRequested: { type: Boolean, default: false },
    proBonoEmail: { type: String, default: null },
    proBonoPhone: { type: String, default: null },
    proBonoConsent: { type: Boolean, default: false },
    proBonoSubmittedAt: { type: Date, default: null },
    // Complete-report delivery request details collected on the Result page.
    reportRequest: { type: kyReportRequestSchema, default: undefined },
  },
  { timestamps: true }
);

knowYourselfSessionSchema.index({ email: 1 });
knowYourselfSessionSchema.index({ browserId: 1 });
knowYourselfSessionSchema.index({ domain: 1 });
knowYourselfSessionSchema.index({ status: 1 });
knowYourselfSessionSchema.index({ startedAt: -1 });

export default mongoose.model('KnowYourselfSession', knowYourselfSessionSchema);
