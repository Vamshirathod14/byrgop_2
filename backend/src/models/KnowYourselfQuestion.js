import mongoose from 'mongoose';

const kyOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 4 },
    active: { type: Boolean, default: true },
    // Optional per-option colour hex. KY questions are not configured with
    // colours from admin; when present (e.g. legacy data) the value is passed
    // through and rendered as-is, and missing values default at render time.
    color: { type: String, default: null },
  },
  { _id: true }
);

// Question-level abbreviation glossary. Entries apply to this question's own
// text and to every active option. Each abbreviation must be unique within a
// single question (validated in pre('validate')).
const kyGlossarySchema = new mongoose.Schema(
  {
    abbreviation: { type: String, required: true, trim: true },
    fullForm: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const DOMAIN_KEYS = [
  'technology_saas',
  'financial_services',
  'supply_chain_logistics',
  'professional_services',
  'retail_ecommerce',
  'franchise_multi_unit',
  'hospitality_food_beverage',
  'fitness_gym_wellness_operations',
  'healthcare_life_sciences',
  'non_profit_social_sector',
  'non_profit_healthcare_wellness',
  'humanitarian_aid_relief_logistics',
  'education_research_think_tanks',
  'civic_tech_open_source',
  'advocacy_environmental_trade',
  'manufacturing',
  'real_estate_construction',
  'cpg_food_processing',
  'raw_materials_mining_metallurgy',
  'pharmaceuticals_biomanufacturing',
  'automotive_heavy_engineering',
];

const DOMAIN_LABELS = {
  technology_saas: 'Technology & SaaS / Digital Products',
  financial_services: 'Financial Services & FinTech',
  supply_chain_logistics: 'Supply Chain, Logistics & Distribution',
  professional_services: 'Professional Services & Consulting',
  retail_ecommerce: 'Retail & E-Commerce',
  franchise_multi_unit: 'Franchise & Multi-Unit Chains',
  hospitality_food_beverage: 'Hospitality, Food & Beverage',
  fitness_gym_wellness_operations: 'Fitness, Gym & Wellness Operations',
  healthcare_life_sciences: 'Healthcare & Life Sciences Operations',
  non_profit_social_sector: 'Non-Profit & Social Sector',
  non_profit_healthcare_wellness: 'Non-Profit Healthcare, Mental Health & Community Wellness',
  humanitarian_aid_relief_logistics: 'Humanitarian Aid, Relief Logistics & Social Welfare',
  education_research_think_tanks: 'Education, Research & Think Tanks',
  civic_tech_open_source: 'Civic Tech, Open-Source & Public Digital Infrastructure',
  advocacy_environmental_trade: 'Advocacy, Environmental & Trade Associations',
  manufacturing: 'Manufacturing & Industrial Operations',
  real_estate_construction: 'Real Estate, Construction & Infrastructure',
  cpg_food_processing: 'Consumer Packaged Goods (CPG) & Food Processing',
  raw_materials_mining_metallurgy: 'Raw Materials, Mining & Metallurgy',
  pharmaceuticals_biomanufacturing: 'Pharmaceuticals & Bio-Manufacturing',
  automotive_heavy_engineering: 'Automotive & Heavy Engineering',
};

const knowYourselfQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ['generic', 'domain'], default: 'generic' },
    domain: { type: String, default: null, trim: true },
    options: { type: [kyOptionSchema], default: [] },
    active: { type: Boolean, default: true },
    // Result category key (KYCategory). Questions without a category are never
    // selected for new assessments until an admin assigns one.
    category: { type: String, default: null, trim: true, lowercase: true },
    // Optional targeting: null/'' = applies to every business type.
    businessType: {
      type: String,
      enum: [null, '', 'service', 'product', 'ngo'],
      default: null,
      lowercase: true,
      trim: true,
    },
    // Abbreviation tooltips for this question and its options (question-level).
    glossary: { type: [kyGlossarySchema], default: [] },
  },
  { timestamps: true }
);

knowYourselfQuestionSchema.pre('validate', function (next) {
  const errors = [];

  const glossary = this.glossary || [];
  const seen = new Set();
  for (const g of glossary) {
    const abbr = String(g.abbreviation || '').trim();
    if (!abbr) {
      errors.push('Glossary abbreviations must not be empty');
      continue;
    }
    const key = abbr.toLowerCase();
    if (seen.has(key)) {
      errors.push(`Duplicate glossary abbreviation: ${abbr}`);
    }
    seen.add(key);
  }
  if (this.active) {
    const options = (this.options || []).filter((o) => o.active);
    if (options.length < 4) {
      errors.push('Active question must have exactly 4 active options');
    }
    const scores = options.map((o) => Number(o.score));
    for (const s of scores) {
      if (!Number.isInteger(s) || s < 1 || s > 4) {
        errors.push('Each option score must be an integer from 1 to 4');
      }
    }
    if (this.type === 'domain' && !this.domain) {
      errors.push('Domain questions must specify a domain');
    }
  }
  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    return next(err);
  }
  next();
});

knowYourselfQuestionSchema.index({ active: 1, type: 1, domain: 1 });

export { DOMAIN_KEYS, DOMAIN_LABELS };
export default mongoose.model('KnowYourselfQuestion', knowYourselfQuestionSchema);
