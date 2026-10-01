/* ─────────────────────────────────────────────────────────────
   KNOW YOURSELF — STARTUP AND NON-PROFIT QUESTION BANKS
   ─────────────────────────────────────────────────────────────
   18 questions per business model, spread over that root's own six
   pillars (3 per pillar) so every result always has six dimensions.

   Option / score convention — IDENTICAL to the existing
   Manufacturing & Services questions, so all four business models
   behave the same way:

     • options are stored best → worst;
     • the best option scores 4 and the worst scores 1, which is what
       buildKYResult expects (`percent = score / (count × 4) × 100`,
       higher = better, matching the 80% = "STRONG FOUNDATION" band);
     • the first two options are the affirmative ones and the last two
       the negative ones, which is how resolveOptionColor assigns the
       default green / red answer colours.

   Every question is written for its own business model. Nothing here
   duplicates the shared Manufacturing & Services bank, and the Start-Up
   and Non-Profit banks share no questions with each other.
   ───────────────────────────────────────────────────────────── */

/** Build the 4 options from best → worst text. Scores are 4, 3, 2, 1. */
const o = (best, good, fair, poor) => [
  { text: best, score: 4 },
  { text: good, score: 3 },
  { text: fair, score: 2 },
  { text: poor, score: 1 },
];

/** Build a question. `key` is the pillar key from kyQuestionRoots.js. */
const q = (pillar, text, options, glossary = []) => ({
  category: pillar,
  text,
  options: o(...options),
  glossary,
});

/* ─── STARTUP ──────────────────────────────────────────────── */

export const STARTUP_QUESTIONS = [
  /* startup-market-validation */
  q(
    'startup-market-validation',
    'How many potential customers has your team spoken to in the last six months?',
    [
      'More than 60, including at least a dozen who have paid, signed a letter of intent, or committed a budget',
      'Between 25 and 60, with several expressing clear buying intent',
      'Fewer than 25, mostly informal conversations with friends, family or peers',
      'Almost none — our assumptions about the market have not been tested with real buyers',
    ],
    [
      { abbreviation: 'TAM', fullForm: 'Total Addressable Market' },
      { abbreviation: 'ICP', fullForm: 'Ideal Customer Profile' },
    ]
  ),
  q(
    'startup-market-validation',
    'How would you describe your current product-market fit?',
    [
      'Clear and measurable: retention, referrals or inbound demand arrive at a repeatable rate we can forecast',
      'Early pull in one segment, but growth still depends heavily on founder-led selling',
      'Uncertain — different segments react very differently to the same positioning',
      'No evidence yet; we are still deciding who the customer is and what problem we solve',
    ],
    [{ abbreviation: 'PMF', fullForm: 'Product-Market Fit' }]
  ),
  q(
    'startup-market-validation',
    'How confident are you that your target segment has this problem urgently?',
    [
      'We have quantified the cost of the problem and interviewed the segment repeatedly to confirm it',
      'Interviews show real pain, but urgency, budget and authority are still unconfirmed',
      'The problem is generally recognised but treated as a nice-to-have rather than urgent',
      'We assume the problem exists; no target customer has confirmed it to us',
    ],
    [
      { abbreviation: 'ICP', fullForm: 'Ideal Customer Profile' },
      { abbreviation: 'POC', fullForm: 'Proof of Concept' },
    ]
  ),

  /* startup-product-technology */
  q(
    'startup-product-technology',
    'How often does the team ship a meaningful product improvement?',
    [
      'Weekly or better, through an automated build and release pipeline',
      'Roughly monthly, with a release process the whole team can follow',
      'Every few months; releases are planned weeks in advance and are disruptive',
      'Ad hoc, whenever someone has time; there is no repeatable release process',
    ],
    [
      { abbreviation: 'CI', fullForm: 'Continuous Integration' },
      { abbreviation: 'CD', fullForm: 'Continuous Delivery' },
    ]
  ),
  q(
    'startup-product-technology',
    'How is product quality assured?',
    [
      'Automated tests and monitoring, with incidents usually detected before customers report them',
      'Monitoring and manual QA are in place, with partial automated coverage',
      'Mostly manual testing; quality problems surface through customer complaints',
      'No formal quality process beyond occasional spot checks',
    ],
    [
      { abbreviation: 'QA', fullForm: 'Quality Assurance' },
      { abbreviation: 'SLA', fullForm: 'Service Level Agreement' },
    ]
  ),
  q(
    'startup-product-technology',
    'How documented and transferable is the technical foundation?',
    [
      'Documented architecture, owned runbooks, and every engineer can cover another’s work',
      'Mostly documented, with gaps the team works around',
      'Knowledge is concentrated in one or two founders',
      'Undocumented — the code can only be safely maintained by its original author',
    ],
    [
      { abbreviation: 'IP', fullForm: 'Intellectual Property' },
      { abbreviation: 'SOP', fullForm: 'Standard Operating Procedure' },
    ]
  ),

  /* startup-unit-economics */
  q(
    'startup-unit-economics',
    'Do you know the unit economics behind every new customer?',
    [
      'Yes — CAC, average revenue per account, gross margin and payback period are measured and reviewed monthly',
      'Partially; we know acquisition cost and revenue, but not true margin or payback',
      'We have rough estimates that have never been validated against actuals',
      'No — we only know total revenue and total spend',
    ],
    [
      { abbreviation: 'CAC', fullForm: 'Customer Acquisition Cost' },
      { abbreviation: 'LTV', fullForm: 'Lifetime Value' },
      { abbreviation: 'ARPU', fullForm: 'Average Revenue Per User' },
    ]
  ),
  q(
    'startup-unit-economics',
    'How is the business currently funded?',
    [
      'Committed runway beyond 18 months, or revenue that already covers a growing team',
      'Between 12 and 18 months of runway, with a financing plan under way',
      'Under 12 months of runway, dependent on closing the next round',
      'Under 6 months, or the next funding is not secured',
    ],
    [
      { abbreviation: 'Runway', fullForm: 'The period a business can operate on its current cash' },
      { abbreviation: 'Cap Table', fullForm: 'The register of who owns what share of a company' },
    ]
  ),
  q(
    'startup-unit-economics',
    'How predictable is revenue per account over time?',
    [
      'High and improving retention, with revenue per account expanding without heavy discounting',
      'Stable, with modest expansion and occasional churn',
      'Erratic — revenue swings with a handful of large deals each quarter',
      'Entirely dependent on one-off sales, with no repeat pattern',
    ],
    [
      { abbreviation: 'NRR', fullForm: 'Net Revenue Retention' },
      { abbreviation: 'Churn', fullForm: 'The rate at which customers stop buying' },
    ]
  ),

  /* startup-growth-engine */
  q(
    'startup-growth-engine',
    'Which acquisition channel drives most of your growth?',
    [
      'Two or more channels work profitably, and each is measured separately',
      'One channel works, and we measure it weekly',
      'One channel works, but we cannot yet attribute results to it',
      'No channel is repeatable — every new customer arrives by a different route',
    ],
    [
      { abbreviation: 'CAC', fullForm: 'Customer Acquisition Cost' },
      { abbreviation: 'PLG', fullForm: 'Product-Led Growth' },
    ]
  ),
  q(
    'startup-growth-engine',
    'How is the sales cycle run?',
    [
      'Documented pipeline stages with known conversion rates and a defined close process',
      'A pipeline exists in our CRM, but stage definitions are loose',
      'Deals are tracked informally and forecasting is based on founder judgement',
      'There is no pipeline — opportunities live in inboxes and notebooks',
    ],
    [{ abbreviation: 'CRM', fullForm: 'Customer Relationship Management' }]
  ),
  q(
    'startup-growth-engine',
    'How do you price and package what you sell?',
    [
      'Tiered pricing tested against real willingness to pay, with usage-based add-ons',
      'Fixed tiers exist and customers buy them roughly as intended',
      'Pricing is set case by case during each negotiation',
      'We have not settled on pricing and discount heavily to close deals',
    ],
    [
      { abbreviation: 'ARPU', fullForm: 'Average Revenue Per User' },
      { abbreviation: 'SKU', fullForm: 'Stock Keeping Unit' },
    ]
  ),

  /* startup-operations-velocity */
  q(
    'startup-operations-velocity',
    'How are priorities decided and communicated to the team?',
    [
      'A written roadmap with quarterly priorities that everyone can see and trusts',
      'Priorities exist, but they change often with no formal update rhythm',
      'Work is decided week to week by whoever is available',
      'There is no shared view of priorities; everyone works on whatever looks most urgent',
    ],
    [{ abbreviation: 'OKR', fullForm: 'Objectives and Key Results' }]
  ),
  q(
    'startup-operations-velocity',
    'How are legal, compliance and data-protection obligations handled?',
    [
      'Contracts, privacy terms and registrations are current and reviewed on a schedule',
      'Core documents exist, but they are only reviewed when something changes',
      'Templates are used, but some obligations are not addressed at all',
      'Handled ad hoc; compliance is largely undefined',
    ],
    [
      { abbreviation: 'GDPR', fullForm: 'General Data Protection Regulation' },
      { abbreviation: 'MSA', fullForm: 'Master Services Agreement' },
    ]
  ),
  q(
    'startup-operations-velocity',
    'How well would the business survive losing one key person for a month?',
    [
      'Key roles have documented backups and a continuity plan that has been tested',
      'Most critical work can be covered, but a few roles remain single points of failure',
      'One or two people hold knowledge the business cannot operate without',
      'The business would stop for a significant period if one person were unavailable',
    ],
    [
      { abbreviation: 'BCP', fullForm: 'Business Continuity Plan' },
      { abbreviation: 'SLA', fullForm: 'Service Level Agreement' },
    ]
  ),

  /* startup-team-governance */
  q(
    'startup-team-governance',
    'How are equity and ownership handled?',
    [
      'A current cap table with documented vesting and a shareholders’ agreement',
      'A cap table exists; vesting and agreements are only partly documented',
      'Equity has been promised informally with no formal record',
      'There is no cap table, or it has diverged substantially from reality',
    ],
    [
      { abbreviation: 'Cap Table', fullForm: 'The register of who owns what share of a company' },
      { abbreviation: 'Vesting', fullForm: 'A schedule by which founder or employee shares are earned over time' },
    ]
  ),
  q(
    'startup-team-governance',
    'How are decisions and accountability structured?',
    [
      'A named owner for every area, with a regular review cadence',
      'Roles are broadly understood, but ownership is unclear in a few areas',
      'Accountability rests mainly with the founders on an ad hoc basis',
      'No defined ownership; it is unclear who decides or who is answerable',
    ],
    [{ abbreviation: 'RACI', fullForm: 'Responsible, Accountable, Consulted, Informed' }]
  ),
  q(
    'startup-team-governance',
    'How do you attract and retain the people you need?',
    [
      'A clear employer proposition reliably produces referrals, and regrettable attrition is low',
      'Hiring works, but it takes a long time and retention is acceptable',
      'Recruitment is difficult, and key hires have already left',
      'There is no structured hiring, and the critical skills are unavailable or unaffordable',
    ],
    [
      { abbreviation: 'Attrition', fullForm: 'The rate at which employees leave an organisation' },
    ]
  ),
];

/* ─── NON-PROFIT ───────────────────────────────────────────── */

/* ─── NON-PROFIT ────────────────────────────────────────────
   The six Non-Profit pillars are Strategy, Revenue, Operations,
   Finance, People & Culture, and Governance — three questions
   each, 18 in total, in that order.

   The source framework is written worst → best: its option "A" is
   the weakest response and "D" the strongest, scored 1 → 4 points.
   This file stores options best → worst (see the convention note at
   the top of the file), so every question below passes its options
   in D, C, B, A order. The `o()` helper then assigns 4, 3, 2, 1 —
   which means a strong organisation answering "D" scores 100% and a
   weak one answering "A" scores 25%, and the first two (the
   affirmative) options keep their green answer colour. The A/B/C/D
   meaning of each response is exactly as the framework defines it. */

export const NONPROFIT_QUESTIONS = [

  /* ── Strategy ───────────────────────────────────── */

  q(
    'nonprofit-strategy',
    'Does your organization have a clear plan for long-term change in the community, not just counting activities?',
    [
      'We have a Logframe or a Monitoring, Evaluation, and Learning (MEL) system that we always use. It matches national goals, such as NITI Aayog’s Aspirational Districts or the SDGs',
      'We have a Logframe (a table that links activities to goals) with clear milestones. But we do not update it every year',
      'We have loose goals for change. We count what we do often. But we only know about long-term change from stories, not numbers',
      'We only count what we do (for example, meals given, people who came). We have no Theory of Change (ToC), which is a plan showing how our work leads to lasting change',
    ],
    [
      { abbreviation: 'Logframe', fullForm: 'Logical Framework Approach — a table that links what you do to the goals you want, with milestones' },
      { abbreviation: 'MEL', fullForm: 'Monitoring, Evaluation, and Learning — the regular cycle of checking results and feeding them back into the work' },
      { abbreviation: 'ToC', fullForm: 'Theory of Change — a plan showing how and why your work leads to lasting change' },
    ]
  ),
  q(
    'nonprofit-strategy',
    'How do you collect and check the results of your programs?',
    [
      'We have a strong MEL system that always runs. Outside experts check our results and follow CSR Rule 8(3) and Social Audit rules',
      'We have clear Monitoring & Evaluation (M&E) steps. An outside group checks a few big projects from time to time',
      'Our team does simple surveys before and after. No outsider checks them',
      'We do not do surveys before and after our programs. We rely on internal stories and examples',
    ],
    [
      { abbreviation: 'CSR', fullForm: 'Corporate Social Responsibility — company funding and oversight obligations' },
      { abbreviation: 'M&E', fullForm: 'Monitoring & Evaluation — checking before and after whether a programme actually worked' },
      { abbreviation: 'MEL', fullForm: 'Monitoring, Evaluation, and Learning — the regular cycle of checking results and feeding them back into the work' },
    ]
  ),
  q(
    'nonprofit-strategy',
    'How do leaders decide which grants, Request for Proposal (RFP) calls and donor requests to accept?',
    [
      'Trustees have approved a written checklist to see if funding fits our mission. We always say no to funding that does not fit',
      'We have a written policy on our focus areas. But we make exceptions when money is tight',
      'Leaders check grants in an informal way. We often change our work to fit the grant',
      'We take any grant we can get to keep cash coming in. It does not matter if it fits our mission',
    ],
    [
      { abbreviation: 'RFP', fullForm: 'Request for Proposal — a funder’s formal call asking organisations to quote for a piece of work' },
    ]
  ),

  /* ── Revenue ────────────────────────────────────── */

  q(
    'nonprofit-revenue',
    'Where does your yearly money come from?',
    [
      'Money comes from many types of donors: CSR partners, small donors, wealthy individuals (HNIs), and big funders. No single source gives more than 25%',
      'Money comes from 4–6 big donors. No single donor gives more than 35% of our budget',
      'We depend on 2–3 big donors. We get little from individuals or other sources',
      'More than 70% comes from one source (one CSR foundation, one family, or one government grant)',
    ],
    [
      { abbreviation: 'CSR', fullForm: 'Corporate Social Responsibility — company funding and oversight obligations' },
    ]
  ),
  q(
    'nonprofit-revenue',
    'How well do you keep donors and follow the tax rules for donations?',
    [
      'We use a donor database (CRM) to track repeat donors. Form 10BE is made automatically. We talk to donors personally, so most of them give again every year',
      'We send donor updates twice a year. We file Form 10BD on time and send Form 10BE certificates quickly',
      'We send yearly receipts. Other updates are occasional and unplanned. We have no campaigns to keep donors',
      'We only contact donors when it is time to renew. We are often late or miss Form 10BD filings and Form 10BE certificates',
    ],
    [
      { abbreviation: 'CRM', fullForm: 'Customer Relationship Management' },
    ]
  ),
  q(
    'nonprofit-revenue',
    'How do you share money reports with donors and CSR committees?',
    [
      'We keep detailed accounts for each project. Our audited UCs match bank records. We share budget vs. actual spending before donors ask for it',
      'A Chartered Accountant (CA) signs our Utilisation Certificates (UCs), and we send them on the donor’s schedule',
      'We send simple, unaudited spending sheets. They do not separate direct costs from overhead costs',
      'We share money reports only when asked or when there is an audit problem. Some of our spending is often rejected',
    ],
    [
      { abbreviation: 'CA', fullForm: 'Chartered Accountant — the qualified accountant who certifies a non-profit’s accounts' },
      { abbreviation: 'CSR', fullForm: 'Corporate Social Responsibility — company funding and oversight obligations' },
      { abbreviation: 'UCs', fullForm: 'Utilisation Certificates — statements accounting for how a specific grant was spent' },
    ]
  ),

  /* ── Operations ─────────────────────────────────── */

  q(
    'nonprofit-operations',
    'How well are your on-ground field execution procedures written down and followed?',
    [
      'We have standard guidelines, emergency safety rules, and mobile apps to track work. Field teams use them actively',
      'We have up-to-date written Standard Operating Procedures (SOPs) for our main work. Field staff learn them when they join',
      'We have basic written guidelines. Field staff rarely use them',
      'Steps are passed on by word of mouth. Each field coordinator does things their own way',
    ],
  ),
  q(
    'nonprofit-operations',
    'How do you find and fix problems that slow down field work?',
    [
      'We use live dashboards (MIS) that show when work goes off track. We hold monthly Corrective and Preventive Action (CAPA) reviews',
      'We review work every month to find delays. We keep a risk list for big regional projects',
      'Staff report problems by message or call. We fix them quickly, but we do not look for the cause',
      'We find problems only after they happen or at the end-of-year grant review',
    ],
    [
      { abbreviation: 'CAPA', fullForm: 'Corrective and Preventive Action — the review that fixes what went wrong and stops it recurring' },
      { abbreviation: 'MIS', fullForm: 'Management Information System' },
    ]
  ),
  q(
    'nonprofit-operations',
    'How can community members give feedback or make complaints?',
    [
      'We have a formal feedback and complaint system (toll-free line, drop boxes, village committee reviews). We keep records of our replies that can be checked',
      'We collect feedback during monitoring visits. We sometimes hold community group discussions',
      'Project leads sometimes ask people questions during visits. Nothing is written down',
      'Communities cannot give feedback or complain. Programs are decided only from the top',
    ],
  ),

  /* ── Finance ────────────────────────────────────── */

  q(
    'nonprofit-finance',
    'How many months of spare cash do you have in case payments are late?',
    [
      '6+ months, kept in easy-to-access savings. The board has approved rules for using it',
      '3–5 months of basic costs, kept in easy-to-use bank accounts',
      '1–2 months. Late payments from donors hurt us',
      'Less than 1 month. We need new grant money to pay salaries',
    ],
  ),
  q(
    'nonprofit-finance',
    'Are your tax and legal registrations up to date (Section 12AB, Section 80G, CSR-1)?',
    [
      'All registrations (12AB, 80G, CSR-1, NGO-DARPAN) are current. The Income Tax Department has never sent us a notice',
      'All approvals (12AB, 80G, CSR-1) are valid. We file audits and tax returns on time',
      'Registrations are valid, but we renew and file at the last minute. We have no fixed calendar',
      'Key registrations (Section 12AB or 80G) have expired or are missing, or our tax return (ITR-7) is often late',
    ],
    [
      { abbreviation: 'CSR', fullForm: 'Corporate Social Responsibility — company funding and oversight obligations' },
      { abbreviation: 'ITR-7', fullForm: 'Income Tax Return Form 7 — the income tax return form for non-profit organisations' },
    ]
  ),
  q(
    'nonprofit-finance',
    'How do you manage admin costs across different funders?',
    [
      'We track costs carefully using timesheets. We separate program, admin, and equipment costs. We follow legal limits, such as the 20% admin cap under FCRA 2020',
      'We have a policy that shares admin costs fairly and stays within donor limits',
      'We have basic cost groups. We often cover admin costs from personal money or by delaying salaries',
      'We do not separate project costs from admin costs. Our admin costs go over funder limits',
    ],
    [
      { abbreviation: 'FCRA', fullForm: 'Foreign Contribution Regulation Act, 2010, including its 2020 amendments' },
    ]
  ),

  /* ── People & Culture ───────────────────────────── */

  q(
    'nonprofit-people-culture',
    'How do you check staff pay, workload, and burnout?',
    [
      'We often compare pay with development sector standards. We watch workloads and run peer support programs',
      'Pay follows social sector wage levels. We have written HR leave policies, appraisals, and wellness programs',
      'Pay changes only when needed. We have no regular reviews, workload checks, or leave rules',
      'Pay is much lower than the sector average. Many frontline staff leave',
    ],
    [
      { abbreviation: 'HR', fullForm: 'Human Resources' },
    ]
  ),
  q(
    'nonprofit-people-culture',
    'How do you manage and screen volunteers?',
    [
      'We manage volunteers from start to finish, with clear roles, required PoSH and child protection training, and recognition for good work',
      'We train new volunteers and give them clear project tasks. They sign Child Protection and Prevention of Sexual Harassment (PoSH) forms',
      'We take applications. But volunteers get little training, guidance, or supervision',
      'Volunteers fill gaps with no management. We do no screening or background checks, and there is no signed code of conduct',
    ],
    [
      { abbreviation: 'PoSH', fullForm: 'Prevention of Sexual Harassment — the rules every organisation and its staff must follow to prevent and respond to harassment' },
    ]
  ),
  q(
    'nonprofit-people-culture',
    'What happens if a top leader or key program head leaves suddenly?',
    [
      'We have a written succession plan. Donor relationships belong to the organization, not one person. Senior staff are trained to cover every key job',
      'We have a named second-in-command. Duties are shared, but the main vision stays with one person',
      'Other staff do the daily work. But outside relationships and money approvals stay with the founders',
      'We depend fully on 1–2 founders or directors. Work stops if they are away',
    ],
  ),

  /* ── Governance ─────────────────────────────────── */

  q(
    'nonprofit-governance',
    'How does your governing body/ board oversee the organization?',
    [
      'The board is strong and independent. It has sub-committees (Audit/Finance, Program Oversight, Ethics) and reviews its own performance',
      'The board is diverse and includes independent experts. It meets at least every 3 months, records minutes, and reviews finances',
      'The board meets sometimes. Meetings just approve things without real discussion',
      'The board is only close family and friends. They meet only on paper to sign yearly returns',
    ],
  ),
  q(
    'nonprofit-governance',
    'Do you file all required reports on time (FCRA / RoS / RoC)?',
    [
      'We follow every rule. We file the FCRA yearly return (Form FC-4) on time and use the designated SBI New Delhi Main Branch account. We send yearly returns to the Charity Commissioner, RoS, or Registrar of Companies (RoC), and keep our NGO-DARPAN profile updated',
      'We file on time on all needed portals (MCA21, Income Tax Department, NGO-DARPAN)',
      'Filings get done, but often with late fees or last-minute fixes',
      'Filings with the Registrar of Societies (RoS), Charity Commissioner, or Ministry of Corporate Affairs (MCA) are missed or disputed. Foreign money is handled wrongly',
    ],
    [
      { abbreviation: 'FCRA', fullForm: 'Foreign Contribution Regulation Act, 2010, including its 2020 amendments' },
      { abbreviation: 'MCA', fullForm: 'Ministry of Corporate Affairs — the government department companies register with' },
      { abbreviation: 'RoC', fullForm: 'Registrar of Companies — the body a company registers with under the Companies Act' },
      { abbreviation: 'RoS', fullForm: 'Registrar of Societies — the body a non-profit registers with under the Societies Registration Act' },
      { abbreviation: 'SBI', fullForm: 'State Bank of India' },
    ]
  ),
  q(
    'nonprofit-governance',
    'How open are your accounts, reports and governance details to the public and to donors?',
    [
      'Everything is public. Anyone can read our audited accounts, annual reports, board members’ names and our annual return filings on our website or on NGO-DARPAN, without asking us. We also publish what our board members are paid',
      'Our audited accounts, annual reports and board list are on our website for anyone to read. Pay details of board members are shared only on request',
      'Our annual report is given to funders when they ask for it. We do not put reports or board details on any public page',
      'Our accounts and board details are internal. Donors and the public have to ask us, and we usually say no',
    ],
    [
      { abbreviation: 'NGO-DARPAN', fullForm: 'NGO-DARPAN — the government portal where every non-profit must register and show its public details' },
    ]
  ),
];

/** Question banks by KY question root. Only the two direct roots are seeded
 *  here; Manufacturing & Services already has its questions in the database. */
export const QUESTION_BANKS_BY_ROOT = {
  startup: STARTUP_QUESTIONS,
  'non-profit': NONPROFIT_QUESTIONS,
};

/** Business type key each seeded bank belongs to. */
export const BUSINESS_TYPE_FOR_ROOT = {
  startup: 'startup',
  'non-profit': 'ngo',
};
