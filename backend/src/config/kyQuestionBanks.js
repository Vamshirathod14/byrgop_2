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
    'Do you feel you spend most of your time tweaking features and pitching, rather than validating actual product-market fit (PMF) and customer retention?',
    [
      'Never; continuous cohort analysis, Sean Ellis Product-Market Fit (PMF) testing, and strict prioritization govern every release.',
      'Rarely; a defined roadmap is tied to core user metrics, though some roadmap drift occurs to close deals.',
      'Mostly; feature decisions are based on gut feel, and customer retention is tracked sporadically.',
      'Yes; constantly reacting to one-off requests and adding features without measuring retention cohorts.',
    ],
    [{ abbreviation: 'PMF', fullForm: 'Product-Market Fit' }]
  ),
  q(
    'startup-market-validation',
    'How acute and indispensable is the problem your product solves for your primary target profile?',
    [
      'Mission-critical infrastructure or urgent priority; removing the solution causes immediate operational disruption for the customer.',
      'Urgent workflow improvement for target users; customers report quantifiable time or cost savings.',
      'Solves an operational inconvenience, but alternatives (including manual spreadsheets) are easily substituted.',
      'Nice-to-have offering; prospects acknowledge the feature set but show high hesitation to pay or pilot.',
    ],
    []
  ),
  q(
    'startup-market-validation',
    'How systematically are user analytics, bug reports, and customer churn feedback turned into product decisions?',
    [
      'Automated behavioral analytics (event tracking, cohort churn logs, Net Promoter Score [NPS]) directly dictate sprint prioritization.',
      'User behavior metrics and churn reasons are reviewed monthly to guide feature backlogs.',
      'Support issues are resolved reactively, but product roadmap planning remains detached from churn data.',
      'Feedback is scattered across unstructured chats and emails with no formal review or logging.',
    ],
    [{ abbreviation: 'NPS', fullForm: 'Net Promoter Score' }]
  ),

  /* startup-product-technology */
  q(
    'startup-product-technology',
    'How predictable, reliable, and scalable are your current customer acquisition channels?',
    [
      'Two or more diversified, scalable acquisition channels operate with clear funnel conversion benchmarks.',
      'At least one acquisition channel delivers steady qualified leads with a measured cost per lead.',
      'Multiple marketing experiments run intermittently, but no single channel produces predictable lead volumes.',
      'Entirely reliant on founder hustle, personal networks, and unpredictable word-of-mouth.',
    ],
    []
  ),
  q(
    'startup-product-technology',
    'How structured and defensible is your pricing model relative to value delivery and buyer willingness-to-pay?',
    [
      'Value-metric-driven pricing with demonstrated pricing power, regular expansion revenue, and contract renewals.',
      'Standardized pricing tiers aligned with usage or seat count; discounts require formal approval thresholds.',
      'Cost-plus or competitor-copycat pricing with weak alignment to actual buyer return on investment (ROI).',
      'Arbitrary pricing decided case-by-case; heavy discounting is routine just to close prospects.',
    ],
    [{ abbreviation: 'ROI', fullForm: 'Return on Investment' }]
  ),
  q(
    'startup-product-technology',
    'How well-defined is your sales process from initial prospect qualification to signed contract?',
    [
      'Repeatable sales playbook with qualification criteria (Budget, Authority, Need, Timeline [BANT] / Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identify pain, Champion [MEDDPIC]), monitored sales cycle velocity, and pipeline forecasting.',
      'Standardized sales pipeline in a Customer Relationship Management (CRM) tool with defined deal stages and typical closing timelines.',
      'Opportunities are tracked in basic sheets, but deal qualification and stage transitions remain subjective.',
      'No pipeline visibility; sales cycles vary wildly with frequent silent drop-offs and stalled conversations.',
    ],
    [
      { abbreviation: 'BANT', fullForm: 'Budget, Authority, Need, Timeline' },
      { abbreviation: 'CRM', fullForm: 'Customer Relationship Management' },
      { abbreviation: 'MEDDPIC', fullForm: 'Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identify pain, Champion' },
    ]
  ),

  /* startup-unit-economics */
  q(
    'startup-unit-economics',
    'Can core business operations and day-to-day service delivery function without direct founder involvement?',
    [
      'Fully autonomous operating rhythm driven by clear Key Performance Indicators (KPIs), playbooks, and delegated authority matrices.',
      'Documented Standard Operating Procedures (SOPs) allow functional leads to handle normal operations independently.',
      'Team executes daily routines, but any non-standard exception or delivery escalation halts without founder intervention.',
      'Operations collapse within days if founders are not personally clearing roadblocks and coordinating tasks.',
    ],
    [
      { abbreviation: 'KPI', fullForm: 'Key Performance Indicator' },
      { abbreviation: 'SOP', fullForm: 'Standard Operating Procedure' },
    ]
  ),
  q(
    'startup-unit-economics',
    'How seamless, documented, and rapid is the post-sale onboarding process for a new customer?',
    [
      'Automated, self-serve or frictionless white-glove onboarding resulting in rapid product adoption and minimal drop-off.',
      'Standardized onboarding workflow with predictable time-to-value milestones and assigned account managers.',
      'Informal onboarding checklist exists, but handoffs between sales and delivery teams cause repeated friction.',
      'Completely manual and custom for every account; customer onboarding is plagued by long, frustrating delays.',
    ],
    []
  ),
  q(
    'startup-unit-economics',
    'What happens to delivery quality, error rates, and overhead costs when transaction volume doubles?',
    [
      'Elastic delivery architecture and automated systems produce increasing returns to scale without quality loss.',
      'Tech-enabled infrastructure and vendor workflows absorb volume increases with minor headcount adjustments.',
      'Capacity can grow only by hiring proportional manual support, compressing operational margins.',
      'Volume spikes result in system outages, delivery backlogs, service errors, or immediate customer churn.',
    ],
    []
  ),

  /* startup-growth-engine */
  q(
    'startup-growth-engine',
    'How many months of runway does your company possess based on its current liquid bank balances and net burn rate?',
    [
      '12+ months of runway or net cash-flow positive, backed by conservative budget controls and financial governance.',
      '6 to 12 months of runway with active cash-burn scenario models (best-case, base-case, downside-case).',
      '3 to 6 months of runway; runway management is reactive and dependent on closing impending capital injections.',
      'Less than 3 months of runway; organization operates under constant payroll and payables emergency.',
    ],
    []
  ),
  q(
    'startup-growth-engine',
    'How healthy, verified, and sustainable are your fundamental unit economics?',
    [
      'Superior unit economics with CAC-to-LTV exceeding 1:4, rapid payback (under 12 months), and strong net revenue retention.',
      'Unit economics break even or produce healthy gross margins with a CAC-to-LTV ratio near 1:3 and clear CAC payback timelines.',
      'Positive gross margins on paper, but CAC payback period exceeds 18–24 months when accounting for all sales/marketing costs.',
      'Negative contribution margin; fully loaded Customer Acquisition Cost (CAC) exceeds customer Lifetime Value (LTV).',
    ],
    [
      { abbreviation: 'CAC', fullForm: 'Customer Acquisition Cost' },
      { abbreviation: 'LTV', fullForm: 'Lifetime Value' },
    ]
  ),
  q(
    'startup-growth-engine',
    'How tightly are receivables, payables, billing collections, and vendor terms managed?',
    [
      'Automated billing, strict working-capital discipline, low Day Sales Outstanding (DSO), and rolling cash forecasts.',
      'Standard invoicing schedules, formal credit terms, and monthly accounts receivable/payable aging tracking in place.',
      'Invoices issued, but follow-up is irregular; aging receivables are addressed only when working capital tightens.',
      'Severe overdue payment cycles; uncollected accounts receivable frequently cause liquid cash shortfalls.',
    ],
    [{ abbreviation: 'DSO', fullForm: 'Day Sales Outstanding' }]
  ),

  /* startup-operations-velocity */
  q(
    'startup-operations-velocity',
    'How resilient is your team structure to the sudden exit of critical domain or technical leads?',
    [
      'High team talent density, institutionalized code/process documentation, and clear functional redundancies.',
      'Cross-functional knowledge sharing exists for key systems; recruitment pipeline active for future roles.',
      'Hiring is purely reactive to bandwidth crises; new hires face steep learning curves without documentation.',
      'Critical single-point dependencies everywhere; losing one developer or operator halts product/business functions.',
    ],
    []
  ),
  q(
    'startup-operations-velocity',
    'How are employee incentives, compensation packages, and equity schemes structured to drive ownership?',
    [
      'Fully articulated ESOP liquidity roadmap, transparent cap table visibility, and competitive compensation aligned with milestones.',
      'Registered ESOP pool with clear vesting schedules, grant letters, and performance-based compensation structures.',
      'Equity promises made informally or via handshake deals; no formal Employee Stock Option Plan (ESOP) policy in place.',
      'Cash-constrained compensation without transparent equity incentives, resulting in transactional team attitudes.',
    ],
    [{ abbreviation: 'ESOP', fullForm: 'Employee Stock Option Plan' }]
  ),
  q(
    'startup-operations-velocity',
    'How effectively are individual responsibilities, targets, and cultural health maintained across departments?',
    [
      'High-performance culture pairing clear outcome ownership with psychological safety, low unwanted turnover, and active mentorship.',
      'Objectives and Key Results (OKRs) or Key Performance Indicators (KPIs) tracked quarterly with transparent performance appraisals.',
      'Basic goal-setting, but evaluations are inconsistent and low performers linger without constructive remediation.',
      'Roles overlap constantly without clear ownership; finger-pointing occurs when targets and delivery deadlines are missed.',
    ],
    [
      { abbreviation: 'KPI', fullForm: 'Key Performance Indicator' },
      { abbreviation: 'OKR', fullForm: 'Objectives and Key Results' },
    ]
  ),

  /* startup-team-governance */
  q(
    'startup-team-governance',
    'What prevents well-funded competitors or incumbents from easily duplicating your offering and undercutting your business?',
    [
      'Compounding moat: strong network effects, high switching barriers, deep data assets, or registered intellectual property (IP).',
      'Growing defensibility through proprietary technology, operational efficiencies, or switching costs.',
      'Advantage relies solely on first-mover timing, temporary discounts, or personal customer relationships.',
      'No identifiable moat; product can be cloned within weeks by any competitor with engineering budget.',
    ],
    [{ abbreviation: 'IP', fullForm: 'Intellectual Property' }]
  ),
  q(
    'startup-team-governance',
    'How structured is your board oversight, regulatory reporting, and capitalization (cap) table hygiene?',
    [
      'Institutional-grade corporate governance, independent board advisors, clean audit reports, and investor reporting.',
      'Clean cap table, quarterly board meetings with recorded minutes, and regular monthly investor updates.',
      'Shareholder agreements in place, but investor communications are sporadic and board meetings lack structured agendas.',
      'Disputed or messy shareholding cap table; no regular board meetings, corporate secretarial reviews, or shareholder updates.',
    ],
    []
  ),
  q(
    'startup-team-governance',
    'What is your compliance posture regarding corporate filings, direct/indirect taxes, and data regulations?',
    [
      'Flawless legal standing: updated regulatory registrations (e.g., DPIIT startup recognition), strict data privacy compliance, and clean due-diligence health.',
      'Systematic compliance schedule maintaining timely RoC, GST, and direct tax filings along with labor and contract safeguards.',
      'Compliance handled reactively through outside accountants; filings scrape by close to penalty deadlines.',
      'Overdue statutory filings with the Registrar of Companies (RoC), pending Tax Deducted at Source (TDS) or Goods and Services Tax (GST) returns, and exposure to fines.',
    ],
    [
      { abbreviation: 'DPIIT', fullForm: 'Department for Promotion of Industry and Internal Trade' },
      { abbreviation: 'GST', fullForm: 'Goods and Services Tax' },
      { abbreviation: 'RoC', fullForm: 'Registrar of Companies' },
      { abbreviation: 'TDS', fullForm: 'Tax Deducted at Source' },
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
    'Are your tax and legal registrations up to date (Section 12AB of the Income-tax Act for registration of charitable trusts, Section 80G of the Income-tax Act for tax deductions on donations, and Corporate Social Responsibility Form-1 [CSR-1])?',
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
    'Do you file all required reports on time (Foreign Contribution (Regulation) Act [FCRA] / Registrar of Societies [RoS] / Registrar of Companies [RoC])?',
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
    'How do you handle conflicts of interest in your organization?',
    [
      'We have a written policy and a signed yearly declaration from every board member and staff member. People with a conflict must step away from the decision, and this is written in the meeting minutes. A safe way to report concerns (a whistleblower process) is available, and the board reviews all cases every year',
      'We have a written conflict of interest policy. Board members and staff sign it every year. If a problem comes up, we deal with it case by case',
      'We have a short, basic policy. But most people have not read or signed it, and we rarely follow it',
      'We have no policy on conflict of interest. Board members and staff can make decisions even when they or their relatives’ benefit. Nobody checks',
    ],
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
