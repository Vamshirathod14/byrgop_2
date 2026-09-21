// Manufacturing & Product-Based Sector question bank — SOURCE OF TRUTH.
// Transcribed exactly from the provided NEW Manufacturing question bank.
// Each entry: domain (slug), pillar (mapped via PILLAR_TO_CATEGORY),
// text, options (A-D with scores 1-4), glossary (abbreviation/fullForm only).

export const PILLAR_TO_CATEGORY = {
  Strategy: 'strategic-direction',
  Finances: 'financial-performance',
  Finance: 'financial-performance',
  Marketing: 'sales-market-growth',
  Operations: 'operations-execution',
  People: 'people-organization',
  Technology: 'digital-innovation',
};

// The 6 Manufacturing (Product-Based) domains + their display slugs.
export const MANUFACTURING_DOMAINS = [
  'manufacturing',
  'real_estate_construction',
  'cpg_food_processing',
  'raw_materials_mining_metallurgy',
  'pharmaceuticals_biomanufacturing',
  'automotive_heavy_engineering',
];

export const DATA = [
  // ===== 15. Manufacturing & Industrial Operations =====
  { domain: 'manufacturing', pillar: 'Technology', text: 'What maintenance strategy is used to keep factory machinery running reliably?', options: [
    { text: 'Breakdown maintenance: Repairs occur exclusively after machinery breaks down.', score: 1 },
    { text: 'Periodic preventive maintenance: Physical servicing occurs based on fixed calendar intervals (e.g., monthly/quarterly).', score: 2 },
    { text: 'Usage-based maintenance: Running hours and digital logs trigger work orders in a Computerized Maintenance Management System (CMMS).', score: 3 },
    { text: 'Predictive maintenance: Internet of Things (IoT) sensors and vibration monitors forecast mechanical failures before lines halt.', score: 4 },
  ], glossary: [
    { abbreviation: 'CMMS', fullForm: 'Computerized Maintenance Management System' },
    { abbreviation: 'IoT', fullForm: 'Internet of Things' },
  ] },
  { domain: 'manufacturing', pillar: 'Technology', text: 'How is shop-floor execution and Work-in-Progress (WIP) tracked through production?', options: [
    { text: 'Paper route cards or job traveler sheets move physically with parts across work centers.', score: 1 },
    { text: 'Supervisors scan barcodes or enter daily production completions into Microsoft Excel sheets.', score: 2 },
    { text: "A Manufacturing Execution System (MES) tracks real-time Work-in-Progress (WIP), station routing, and operator sign-offs.", score: 3 },
    { text: 'Real-time Radio-Frequency Identification (RFID) tracking monitors live bottlenecks and dynamically reroutes jobs across available machines.', score: 4 },
  ], glossary: [
    { abbreviation: 'WIP', fullForm: 'Work-in-Progress' },
    { abbreviation: 'MES', fullForm: 'Manufacturing Execution System' },
    { abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' },
  ] },
  { domain: 'manufacturing', pillar: 'Operations', text: 'How do you track and evaluate Overall Equipment Effectiveness (OEE) — availability, performance, and quality?', options: [
    { text: 'Overall Equipment Effectiveness (OEE) is not calculated; productivity is evaluated purely on total output count per shift.', score: 1 },
    { text: 'Machine operators record downtime reasons and scrap quantities manually on paper sheets at the end of every shift.', score: 2 },
    { text: 'Operators log downtime reason codes and scrap directly into digital touchscreens or shop-floor tablets.', score: 3 },
    { text: 'Machine Programmable Logic Controllers (PLCs) connect to networks, tracking real-time Overall Equipment Effectiveness (OEE) and micro-stoppages automatically.', score: 4 },
  ], glossary: [
    { abbreviation: 'OEE', fullForm: 'Overall Equipment Effectiveness' },
    { abbreviation: 'PLC', fullForm: 'Programmable Logic Controller' },
  ] },
  { domain: 'manufacturing', pillar: 'Operations', text: 'How is part quality monitored and controlled during the manufacturing process?', options: [
    { text: 'End-of-line sorting: Rejection sorting happens entirely during final manual inspection before packing.', score: 1 },
    { text: 'In-process sampling: Operators measure sample parts hourly with manual gauges (e.g., vernier calipers) and log them on paper sheets.', score: 2 },
    { text: 'Statistical Process Control (SPC): Quality software plots real-time control charts, alerting operators before dimensions drift out of tolerance.', score: 3 },
    { text: 'Automated inspection: Integrated optical or laser scanning systems inspect parts inline and adjust machine tool offsets automatically.', score: 4 },
  ], glossary: [
    { abbreviation: 'SPC', fullForm: 'Statistical Process Control' },
  ] },
  { domain: 'manufacturing', pillar: 'Operations', text: 'How are production tooling, dies, jigs, and assembly fixtures managed?', options: [
    { text: 'Tooling is stored on open shop racks; operators search for needed dies manually.', score: 1 },
    { text: 'Tool issues and returns are recorded manually in a physical tool-crib register.', score: 2 },
    { text: 'Tool-room software tracks die storage locations, shot counts, and scheduled preventive regrinds.', score: 3 },
    { text: 'Radio-Frequency Identification (RFID) tagged smart tooling monitors live tool wear, automatically locking out worn dies from production.', score: 4 },
  ], glossary: [
    { abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' },
  ] },
  { domain: 'manufacturing', pillar: 'Strategy', text: 'How are factory production schedules and machine capacity planned?', options: [
    { text: 'Daily job sequencing is written on a physical whiteboard by the shop foreman.', score: 1 },
    { text: 'Production schedules are created in static Microsoft Excel spreadsheets without calculating machine capacity constraints.', score: 2 },
    { text: 'Enterprise Resource Planning (ERP) software schedules jobs against machine limits, tooling readiness, and raw material availability.', score: 3 },
    { text: 'Dynamic Advanced Planning and Scheduling (APS) engines reschedule production automatically when material delays or line stoppages occur.', score: 4 },
  ], glossary: [
    { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
    { abbreviation: 'APS', fullForm: 'Advanced Planning and Scheduling' },
  ] },
  { domain: 'manufacturing', pillar: 'Operations', text: 'How are Bills of Materials (BOM) and Engineering Change Orders (ECO) updated on the line?', options: [
    { text: 'Paper drawings are marked up by hand, with change orders communicated verbally to operators.', score: 1 },
    { text: 'Computer-Aided Design (CAD) drawings and Bill of Materials (BOM) files are saved in shared computer folders with manual version names.', score: 2 },
    { text: 'A Product Lifecycle Management (PLM) or Enterprise Resource Planning (ERP) system coordinates drawing revisions and digital Engineering Change Order (ECO) approval workflows.', score: 3 },
    { text: 'Connected engineering systems update digital work instructions and Bill of Materials (BOM) revisions instantly at all line-side operator screens.', score: 4 },
  ], glossary: [
    { abbreviation: 'BOM', fullForm: 'Bill of Materials' },
    { abbreviation: 'ECO', fullForm: 'Engineering Change Order' },
    { abbreviation: 'CAD', fullForm: 'Computer-Aided Design' },
    { abbreviation: 'PLM', fullForm: 'Product Lifecycle Management' },
    { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
  ] },
  { domain: 'manufacturing', pillar: 'Finance', text: 'How do you monitor energy consumption, power factors, and fuel costs on the plant floor?', options: [
    { text: 'Monthly utility bills from the state electricity distribution company (DISCOM) are reviewed without tracking individual machine draws.', score: 1 },
    { text: 'Periodic energy audits are conducted by external engineering consultants or manual panel meter readings.', score: 2 },
    { text: 'Digital sub-meters on high-load equipment (compressors, furnaces) track peak kilowatt (kW) demand and unit consumption trends.', score: 3 },
    { text: 'An Industrial Energy Management System (IEMS) balances machine startup cycles to eliminate maximum demand penalties and calculates energy cost per finished product.', score: 4 },
  ], glossary: [
    { abbreviation: 'DISCOM', fullForm: 'Distribution Company' },
    { abbreviation: 'IEMS', fullForm: 'Industrial Energy Management System' },
  ] },
  { domain: 'manufacturing', pillar: 'People', text: 'How are shop-floor safety incidents, near-misses, and worker compliance managed?', options: [
    { text: 'Accident forms are filled out only when an injury requires external hospital treatment.', score: 1 },
    { text: 'Monthly safety committee meetings review printed suggestion box notes, accident logs, and basic Personal Protective Equipment (PPE) checks.', score: 2 },
    { text: 'A digital Environment, Health, and Safety (EHS) platform manages machine guarding checklists, incident investigations, and safety training records.', score: 3 },
    { text: 'Artificial Intelligence (AI) optical monitors and wearable worker sensors detect hazard zone intrusions and automatically shut down machinery.', score: 4 },
  ], glossary: [
    { abbreviation: 'PPE', fullForm: 'Personal Protective Equipment' },
    { abbreviation: 'EHS', fullForm: 'Environment, Health, and Safety' },
    { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
  ] },

  // ===== 16. Real Estate, Construction & Infrastructure =====
  { domain: 'real_estate_construction', pillar: 'Strategy', text: 'How do you track project schedules, milestones, and critical path activities on job sites?', options: [
    { text: 'The job schedule is marked on a dry-erase whiteboard in the site office and reviewed in weekly meetings.', score: 1 },
    { text: 'Project managers maintain spreadsheet bar charts that are updated manually for monthly client/management reviews.', score: 2 },
    { text: 'Dedicated scheduling software (e.g., Primavera P6, Microsoft Project) tracks task dependencies, crew allocations, and critical path delays.', score: 3 },
    { text: '4D Building Information Modeling (BIM) links 3D architectural models directly to timelines to simulate phase-wise construction and detect spatial clashes.', score: 4 },
  ], glossary: [
    { abbreviation: 'BIM', fullForm: 'Building Information Modeling' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Operations', text: 'How are subcontractor trade bids, contracts, and procurement packages managed?', options: [
    { text: 'Trade bids are collected via WhatsApp or physical mail, and evaluated through informal paper comparative sheets.', score: 1 },
    { text: 'Project teams compile subcontractor bids in spreadsheets and manually draft contract scopes of work.', score: 2 },
    { text: 'A digital construction procurement portal manages Request for Proposals (RFP), electronic plan rooms, and structured bid-leveling matrices.', score: 3 },
    { text: 'An enterprise procurement platform tracks historical subcontractor performance ratings, verifies statutory labor compliance (e.g., Provident Fund), and models material cost trends.', score: 4 },
  ], glossary: [
    { abbreviation: 'RFP', fullForm: 'Request for Proposals' },
  ] },
  { domain: 'real_estate_construction', pillar: 'People', text: 'How are job-site safety inspections, daily hazard logs, and worker safety briefings handled?', options: [
    { text: 'Paper safety checklists are completed sporadically or when external safety inspectors visit the site.', score: 1 },
    { text: 'Weekly safety toolbox talks are documented on printed sign-in sheets filed in site trailers.', score: 2 },
    { text: 'A mobile safety app enables daily digital inspections, safety violation photos, and automated corrective task assignments.', score: 3 },
    { text: 'Internet of Things (IoT) job-site platforms utilize wearable worker sensors for fall detection and vision-based Personal Protective Equipment (PPE) compliance tracking.', score: 4 },
  ], glossary: [
    { abbreviation: 'IoT', fullForm: 'Internet of Things' },
    { abbreviation: 'PPE', fullForm: 'Personal Protective Equipment' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Technology', text: 'How are Requests for Information (RFI) and architectural drawing clarifications coordinated?', options: [
    { text: 'Requests for Information (RFI) are asked verbally or via unstructured messages, with submittals stored in physical site binders.', score: 1 },
    { text: 'Project engineers maintain spreadsheet logs of RFIs, manually emailing stamped Portable Document Format (PDF) files.', score: 2 },
    { text: 'Cloud construction management software (e.g., Procore, Autodesk Construction Cloud) routes RFIs and drawings with automated tracking and overdue alerts.', score: 3 },
    { text: 'A model-based field platform pins RFIs directly to 3D Building Information Modeling (BIM) geometry, calculating cost impacts and updating master drawings automatically.', score: 4 },
  ], glossary: [
    { abbreviation: 'RFI', fullForm: 'Request for Information' },
    { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
    { abbreviation: 'BIM', fullForm: 'Building Information Modeling' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Finance', text: 'How are job costs, budget commitments, and contractor running bills tracked?', options: [
    { text: 'Project profitability is evaluated only after project closeout by reviewing general bank account balances.', score: 1 },
    { text: 'Monthly cost-to-complete spreadsheets are reconciled manually against general accounting software (e.g., Tally) entries.', score: 2 },
    { text: 'Construction Enterprise Resource Planning (ERP) software tracks committed purchase orders, subcontractor Measurement Books (MB), and Running Account (RA) bills.', score: 3 },
    { text: 'Real-time Earned Value Management (EVM) dashboards link field production quantities to cost codes, forecasting final profit margins continuously.', score: 4 },
  ], glossary: [
    { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
    { abbreviation: 'EVM', fullForm: 'Earned Value Management' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Operations', text: 'How are quality checks and project punch lists (snag lists) executed?', options: [
    { text: 'Punch lists are handwritten on paper notepads during site walkthroughs and crossed off as contractors verbally report completion.', score: 1 },
    { text: 'Spreadsheets containing snag lists and cell phone photos are emailed to trade subcontractors.', score: 2 },
    { text: 'A mobile Quality Assurance and Quality Control (QA/QC) app allows engineers to pin punch list issues with photos directly onto 2D floor plans with digital sign-offs.', score: 3 },
    { text: '360-degree reality-capture cameras map weekly site photo walks against Building Information Modeling (BIM) design models to verify installation quality automatically.', score: 4 },
  ], glossary: [
    { abbreviation: 'QA/QC', fullForm: 'Quality Assurance / Quality Control' },
    { abbreviation: 'BIM', fullForm: 'Building Information Modeling' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Operations', text: 'How do you track heavy site equipment (e.g., excavators, cranes, transit mixers) and preventive maintenance?', options: [
    { text: 'Equipment is dispatched via phone calls, with maintenance performed only when machines break down on site.', score: 1 },
    { text: 'Equipment locations, running hours, and diesel consumption are tracked on a central office whiteboard or paper logbooks.', score: 2 },
    { text: 'Telematics software and Global Positioning System (GPS) tracking monitor operating hours, idle time, and scheduled service intervals.', score: 3 },
    { text: 'An integrated fleet platform monitors engine fault codes, detects fuel theft anomalies, and automates internal machinery rental costs per site.', score: 4 },
  ], glossary: [
    { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Operations', text: 'How are bulk material deliveries (e.g., ready-mix concrete, TMT steel, cement) and site staging coordinated?', options: [
    { text: 'Delivery trucks arrive unannounced, leading to site congestion, unloading delays, and vehicle detention charges.', score: 1 },
    { text: 'Deliveries are tracked on shared spreadsheets, and materials are staged wherever ground space is available.', score: 2 },
    { text: 'Digital delivery coordination software manages loading gate booking schedules and designated material staging zones.', score: 3 },
    { text: 'Just-In-Time (JIT) logistics systems track concrete transit mixers via Global Positioning System (GPS) geofencing, automating tower crane unloading upon vehicle arrival.', score: 4 },
  ], glossary: [
    { abbreviation: 'JIT', fullForm: 'Just-In-Time' },
    { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
  ] },
  { domain: 'real_estate_construction', pillar: 'Marketing', text: 'How are commercial property lease contracts, tenant queries, and renewals managed?', options: [
    { text: 'Physical lease agreements are stored in office filing cabinets, and rent collections are logged by hand.', score: 1 },
    { text: 'Spreadsheets track lease expiration dates and rent rolls, with manual preparation of monthly tenant invoices.', score: 2 },
    { text: 'Commercial property management software manages tenant billing, Consumer Price Index (CPI) rent escalations, and digital maintenance work requests.', score: 3 },
    { text: 'An integrated real estate asset portal automates digital lease execution, tracks space absorption trends, and drives commercial lead conversions.', score: 4 },
  ], glossary: [
    { abbreviation: 'CPI', fullForm: 'Consumer Price Index' },
  ] },

  // ===== 17. Consumer Packaged Goods (CPG) & Food Processing =====
  { domain: 'cpg_food_processing', pillar: 'Operations', text: 'How are product batch recipes and ingredient proportions scaled and controlled?', options: [
    { text: 'Operators scale ingredient quantities from memory or follow paper recipe cards taped to mixing tanks.', score: 1 },
    { text: 'Standardized recipe binders are followed, with operators calculating batch weight multipliers manually on paper.', score: 2 },
    { text: 'Digital batch formulation software connects to industrial scales, requiring operator sign-offs before adding each ingredient.', score: 3 },
    { text: 'Automated recipe management software controls computerized ingredient dosing, mixing temperatures, and agitator speeds with zero manual intervention.', score: 4 },
  ], glossary: [] },
  { domain: 'cpg_food_processing', pillar: 'Operations', text: 'How do you track raw material lot numbers and execute mock product recalls?', options: [
    { text: 'Lot numbers are written in paper batch binders, and performing a mock recall takes several days.', score: 1 },
    { text: 'Lot numbers are recorded in spreadsheets, with mock recall completion requiring 24 to 48 hours.', score: 2 },
    { text: 'A barcode-driven Enterprise Resource Planning (ERP) system links ingredient lots to finished pallet tags, enabling traceability in under 2 hours.', score: 3 },
    { text: 'An end-to-end digital traceability platform maps supplier lot genealogy directly to retail distribution centers, generating recall reports in minutes.', score: 4 },
  ], glossary: [
    { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
  ] },
  { domain: 'cpg_food_processing', pillar: 'Operations', text: 'How are Critical Control Points (CCP) and food safety logs (HACCP) monitored?', options: [
    { text: 'Operators record temperature, boiling, and sanitation checks on paper logs at irregular intervals during production.', score: 1 },
    { text: 'Critical Control Point (CCP) measurements are entered into spreadsheets at the conclusion of each manufacturing shift.', score: 2 },
    { text: 'Cloud food safety software guides operators through digital checklists using handheld Bluetooth-connected measurement probes.', score: 3 },
    { text: 'Automated inline Critical Control Point (CCP) sensors monitor continuous temperatures and metal detection, automatically diverting non-compliant products off the line.', score: 4 },
  ], glossary: [
    { abbreviation: 'CCP', fullForm: 'Critical Control Point' },
    { abbreviation: 'HACCP', fullForm: 'Hazard Analysis and Critical Control Points' },
  ] },
  { domain: 'cpg_food_processing', pillar: 'Operations', text: 'How are sanitation cycles and Clean-In-Place (CIP) systems verified?', options: [
    { text: 'Processing equipment is washed manually by operators without standardized water temperature or chemical titration records.', score: 1 },
    { text: 'Clean-In-Place (CIP) wash cycles are initiated manually, with operators logging wash times on paper log sheets.', score: 2 },
    { text: 'Automated Clean-In-Place (CIP) units run programmed wash cycles, with digital logging of Adenosine Triphosphate (ATP) hygiene swab tests prior to line clearance.', score: 3 },
    { text: 'Smart Clean-In-Place (CIP) systems optimize wash times, water usage, and chemical dosing based on real-time conductivity sensors, logging automated digital release certificates.', score: 4 },
  ], glossary: [
    { abbreviation: 'CIP', fullForm: 'Clean-In-Place' },
    { abbreviation: 'ATP', fullForm: 'Adenosine Triphosphate' },
  ] },
  { domain: 'cpg_food_processing', pillar: 'Finance', text: 'How do you control package filling weights and minimize product giveaway (overfilling)?', options: [
    { text: 'Filling equipment is adjusted by hand, with random manual scale checks resulting in high product overfill.', score: 1 },
    { text: 'Operators weigh sample packages hourly on a table scale and record weights on paper statistical tracking sheets.', score: 2 },
    { text: 'Automated inline checkweighers reject off-weight packages and display digital weight distribution curves to operators.', score: 3 },
    { text: 'Inline checkweighers provide continuous automated feedback loops that adjust upstream filling heads dynamically to eliminate giveaway.', score: 4 },
  ], glossary: [] },
  { domain: 'cpg_food_processing', pillar: 'Technology', text: 'How are batch codes, Maximum Retail Prices (MRP), and expiry dates printed and inspected?', options: [
    { text: 'Manual handheld stampers or mechanical roller coders are set by hand, occasionally leading to smudged or incorrect date stamps.', score: 1 },
    { text: 'Operators program standalone Continuous Inkjet (CIJ) coders manually at the beginning of each production run.', score: 2 },
    { text: 'Networked industrial coders receive automated date, batch, and Maximum Retail Price (MRP) data directly from production orders to prevent human error.', score: 3 },
    { text: 'High-speed machine vision cameras inspect and verify the legibility of every printed code, auto-rejecting flawed packages.', score: 4 },
  ], glossary: [
    { abbreviation: 'MRP', fullForm: 'Maximum Retail Price' },
    { abbreviation: 'CIJ', fullForm: 'Continuous Inkjet' },
  ] },
  { domain: 'cpg_food_processing', pillar: 'Operations', text: 'How are raw allergens (e.g., nuts, dairy, gluten) isolated in storage and managed during line changeovers?', options: [
    { text: 'Allergen-containing raw materials are stored alongside non-allergens without dedicated physical separation.', score: 1 },
    { text: 'Color-coded storage areas separate allergens, with paper sign-off sheets for sanitation washdowns between product runs.', score: 2 },
    { text: 'Digital allergen management protocols enforce barcode-scanned ingredient staging and mandatory pre-run allergen swab validations.', score: 3 },
    { text: 'Production scheduling algorithms sequence runs from least-to-most allergenic products, locking out line restarts until sanitation validation is logged.', score: 4 },
  ], glossary: [] },
  { domain: 'cpg_food_processing', pillar: 'Strategy', text: 'How do you align sales forecasts, trade promotions, and production plans (Sales and Operations Planning - S&OP)?', options: [
    { text: 'Production volumes are determined based purely on current stock levels in the finished goods warehouse.', score: 1 },
    { text: 'Sales forecasts are compiled monthly in spreadsheets without factoring in trade promotional schemes or packaging line limits.', score: 2 },
    { text: 'A Sales and Operations Planning (S&OP) monthly process reconciles marketing promotions, distributor backorders, and plant manufacturing capacity.', score: 3 },
    { text: 'An Integrated Business Planning (IBP) platform incorporates retail Point of Sale (POS) consumption feeds and machine learning to balance production schedules.', score: 4 },
  ], glossary: [
    { abbreviation: 'S&OP', fullForm: 'Sales and Operations Planning' },
    { abbreviation: 'IBP', fullForm: 'Integrated Business Planning' },
    { abbreviation: 'POS', fullForm: 'Point of Sale' },
  ] },
  { domain: 'cpg_food_processing', pillar: 'Finance', text: 'How do you monitor packaging scrap and material yield efficiency?', options: [
    { text: 'Packaging film, foil, and carton scrap are discarded without measuring scrap percentages.', score: 1 },
    { text: 'Packaging scrap weight is calculated from monthly scrap disposal and merchant sales invoices.', score: 2 },
    { text: 'Digital line monitoring measures packaging scrap rates per batch and tracks scrap root causes.', score: 3 },
    { text: 'Real-time yield monitoring optimizes packaging machine tensions, minimizing material trim loss and calculating packaging yield costs continuously.', score: 4 },
  ], glossary: [] },

  // ===== 18. Raw Materials, Mining & Metallurgy =====
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Technology', text: 'How are geological drilling logs, assays, and ore body models maintained?', options: [
    { text: 'Drill core logs and laboratory chemical assay test reports are filed in physical paper logbooks.', score: 1 },
    { text: 'Chemical assay data is maintained in spreadsheets and converted into 2D cross-sections in basic Computer-Aided Design (CAD) software.', score: 2 },
    { text: '3D geological modeling software (e.g., Datamine, Micromine) models ore body structures, thickness, and grade distributions.', score: 3 },
    { text: 'Dynamic 3D block models update continuously from automated Measurement-While-Drilling (MWD) sensor data and automated geostatistical algorithms.', score: 4 },
  ], glossary: [
    { abbreviation: 'CAD', fullForm: 'Computer-Aided Design' },
    { abbreviation: 'MWD', fullForm: 'Measurement-While-Drilling' },
  ] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Strategy', text: 'How are short-term mine extraction sequences and cut-off grades determined?', options: [
    { text: 'Extraction locations are decided daily by mine supervisors based on visual rock appearance and vehicle access.', score: 1 },
    { text: 'Mine plans are compiled in monthly spreadsheets using static commodity price assumptions.', score: 2 },
    { text: 'Mine planning software generates optimized open-pit boundaries, bench extraction schedules, and waste stripping ratios.', score: 3 },
    { text: 'Dynamic mine optimization engines adjust extraction sequencing and cut-off grades in real time based on live commodity market prices and plant recovery rates.', score: 4 },
  ], glossary: [] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Operations', text: 'How are haul trucks, dumpers, and loading equipment dispatched and monitored?', options: [
    { text: 'Haul truck operators are assigned to loading units verbally at shift start or over two-way walkie-talkie channels.', score: 1 },
    { text: 'A manual dispatch board in the quarry office tracks equipment allocations and trip counts via paper trip sheets.', score: 2 },
    { text: 'A Computerized Fleet Management System (FMS) with Global Positioning System (GPS) optimizes truck routing to shovels based on cycle times.', score: 3 },
    { text: 'Autonomous haulage and drilling systems operate with dynamic route optimization, anti-collision radar, and zero manual vehicle dispatching.', score: 4 },
  ], glossary: [
    { abbreviation: 'FMS', fullForm: 'Fleet Management System' },
    { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
  ] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Operations', text: 'How is mineral processing plant recovery and chemical reagent dosing controlled?', options: [
    { text: 'Reagent and water flow rates are adjusted manually based on visual inspection of flotation froth or slurry.', score: 1 },
    { text: 'Shift-end laboratory assays provide feedback, with operators adjusting chemical feed valves hours later.', score: 2 },
    { text: 'On-Stream Analyzers (OSA) provide continuous elemental slurry analysis with automated Proportional-Integral-Derivative (PID) feedback loops.', score: 3 },
    { text: 'Advanced Process Control (APC) expert systems utilize machine vision on flotation froths and predictive control models to maximize mineral recovery.', score: 4 },
  ], glossary: [
    { abbreviation: 'OSA', fullForm: 'On-Stream Analyzer' },
    { abbreviation: 'PID', fullForm: 'Proportional-Integral-Derivative' },
    { abbreviation: 'APC', fullForm: 'Advanced Process Control' },
  ] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Operations', text: 'How are smelting furnaces, temperatures, and alloy chemistry monitored?', options: [
    { text: 'Furnace burners, power inputs, and tapping timing are judged based on experienced operator visual estimation.', score: 1 },
    { text: 'Thermocouple temperatures are logged in control room spreadsheets with manual additions of corrective alloying elements.', score: 2 },
    { text: 'Supervisory Control and Data Acquisition (SCADA) automation controls furnace power inputs, oxygen lance injection, and automated alloy feed hoppers.', score: 3 },
    { text: 'A thermodynamic digital twin models molten bath chemistry and refractory lining wear in real time, optimizing energy use and tapping schedules.', score: 4 },
  ], glossary: [
    { abbreviation: 'SCADA', fullForm: 'Supervisory Control and Data Acquisition' },
  ] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Operations', text: 'How is tailings pond, ash dyke, and quarry wall geotechnical stability monitored?', options: [
    { text: 'Tailings bunds and rock slopes are inspected visually on physical drive-by checks.', score: 1 },
    { text: 'Manual readings of piezometers and settlement markers are recorded on paper forms monthly.', score: 2 },
    { text: 'Automated geotechnical instruments stream pore-water pressure, water table levels, and seismic vibration data to a central portal.', score: 3 },
    { text: 'Continuous monitoring platforms integrate satellite Interferometric Synthetic Aperture Radar (InSAR) surface displacement data with connected ground sensors to provide early warnings.', score: 4 },
  ], glossary: [
    { abbreviation: 'InSAR', fullForm: 'Interferometric Synthetic Aperture Radar' },
  ] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Operations', text: 'How are drill blast patterns, explosive loading, and rock fragmentation designed?', options: [
    { text: 'Drill hole spacing and explosive powder quantities are determined using past field thumb rules.', score: 1 },
    { text: 'Blast drill patterns are drafted in 2D software with manual powder factor calculations in spreadsheets.', score: 2 },
    { text: '3D blast design software calculates electronic detonator timing sequences, flyrock exclusion zones, and vibration limits near human settlements.', score: 3 },
    { text: 'Integrated blast optimization links rock hardness logs from drill rigs with automated drone image fragmentation analysis to maximize downstream mill throughput.', score: 4 },
  ], glossary: [] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'People', text: 'How is underground or confined-space air quality, ventilation, and worker safety managed?', options: [
    { text: 'Gas concentrations are checked with handheld detectors only when personnel report bad odors or fumes.', score: 1 },
    { text: 'Physical token or brass tag-in/tag-out boards track workers entering and exiting underground mine portals.', score: 2 },
    { text: 'Supervisory Control and Data Acquisition (SCADA) linked gas sensors (Carbon Monoxide - CO, Methane - CH4, and Nitrous Fumes - NOx) monitor air quality and control main ventilation fan speeds.', score: 3 },
    { text: 'Real-time tracking meshes locate all personnel underground, pairing with Ventilation-on-Demand (VOD) to direct clean airflow only to active working zones.', score: 4 },
  ], glossary: [
    { abbreviation: 'SCADA', fullForm: 'Supervisory Control and Data Acquisition' },
    { abbreviation: 'VOD', fullForm: 'Ventilation-on-Demand' },
  ] },
  { domain: 'raw_materials_mining_metallurgy', pillar: 'Finance', text: 'How do you monitor raw bulk material stockpiles and rail/port dispatch logistics?', options: [
    { text: 'Stockpile tonnage is estimated visually, with railway wagon or truck loading coordinated through phone calls.', score: 1 },
    { text: 'Land surveyors perform periodic physical stockpile surveys, with shipment logs tracked in spreadsheets.', score: 2 },
    { text: 'Drone Light Detection and Ranging (LiDAR) scans measure stockpile volumes, and automated rail loadout systems use dynamic weigh-in-motion scales.', score: 3 },
    { text: 'An integrated pit-to-port logistics system manages real-time ore grade blending across stockpiles, rail train sequencing, and automated ship loading.', score: 4 },
  ], glossary: [
    { abbreviation: 'LiDAR', fullForm: 'Light Detection and Ranging' },
  ] },

  // ===== 19. Pharmaceuticals & Bio-Manufacturing =====
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Operations', text: 'How are Good Manufacturing Practices (GMP) and Batch Manufacturing Records (BMR) maintained?', options: [
    { text: 'Paper Batch Manufacturing Records (BMR) are filled out by hand during production and stored in physical filing cabinets.', score: 1 },
    { text: 'Batch records are typed into Microsoft Excel or word processor templates, printed out, and signed manually.', score: 2 },
    { text: 'An Electronic Batch Record (eBR) system enforces step-by-step digital operator sign-offs and instrument data capture.', score: 3 },
    { text: 'A Manufacturing Execution System (MES) directly logs automated machine parameters, ensuring complete data integrity (ALCOA+) with zero paper records.', score: 4 },
  ], glossary: [
    { abbreviation: 'GMP', fullForm: 'Good Manufacturing Practices' },
    { abbreviation: 'BMR', fullForm: 'Batch Manufacturing Record' },
    { abbreviation: 'MES', fullForm: 'Manufacturing Execution System' },
    { abbreviation: 'ALCOA+', fullForm: 'Attributable, Legible, Contemporaneous, Original, Accurate' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Operations', text: 'How are deviations, Out of Specification (OOS) results, and Corrective and Preventive Actions (CAPA) managed?', options: [
    { text: 'Production deviations and lab failures are handled informally between shop-floor supervisors and quality managers.', score: 1 },
    { text: 'Deviations and Out of Specification (OOS) investigation forms are filled out on paper and tracked in a central spreadsheet.', score: 2 },
    { text: 'A digital Quality Management System (QMS) manages deviation workflows, root-cause investigations, and automated CAPA task assignments.', score: 3 },
    { text: 'Enterprise Quality Management System (QMS) analytics identify systemic quality risks across manufacturing lines and predict audit vulnerabilities.', score: 4 },
  ], glossary: [
    { abbreviation: 'OOS', fullForm: 'Out of Specification' },
    { abbreviation: 'CAPA', fullForm: 'Corrective and Preventive Action' },
    { abbreviation: 'QMS', fullForm: 'Quality Management System' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Technology', text: 'How are cleanroom heating, ventilation, and air conditioning (HVAC) systems monitored?', options: [
    { text: 'Room differential pressure, humidity, and temperatures are checked on physical wall gauges and logged on paper once per shift.', score: 1 },
    { text: 'Standalone data loggers record temperature and humidity, with files downloaded manually each week.', score: 2 },
    { text: 'A centralized Building Management System (BMS) continuously tracks room pressure and air particulate levels, triggering alarms for deviations.', score: 3 },
    { text: 'An integrated Building Management System (BMS) automatically modulates cleanroom airflow and fan speeds to guarantee continuous cleanroom classification compliance.', score: 4 },
  ], glossary: [
    { abbreviation: 'HVAC', fullForm: 'Heating, Ventilation, and Air Conditioning' },
    { abbreviation: 'BMS', fullForm: 'Building Management System' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Operations', text: 'How is cold-chain integrity monitored during temperature-sensitive drug storage and transport?', options: [
    { text: 'Cold-room temperatures are checked on analog wall thermometers and logged in a physical register twice daily.', score: 1 },
    { text: 'Standalone temperature data loggers accompany shipments, with data reviewed manually only after delivery at destination.', score: 2 },
    { text: 'Internet of Things (IoT) temperature loggers stream real-time environmental data to the cloud, sending instant alerts for thermal excursions.', score: 3 },
    { text: 'Connected cold-chain platforms combine Global Positioning System (GPS) tracking with live thermal monitoring to reroute shipments facing temperature spikes.', score: 4 },
  ], glossary: [
    { abbreviation: 'IoT', fullForm: 'Internet of Things' },
    { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Operations', text: 'How are cleaning validations and equipment cross-contamination protocols verified?', options: [
    { text: 'Equipment is washed using manual scrub downs without standardized chemical titration or rinse water test logs.', score: 1 },
    { text: 'Cleaning procedures are written in manuals, with operators logging chemical rinse times on physical batch log sheets.', score: 2 },
    { text: 'Validated cleaning protocols enforce Total Organic Carbon (TOC) and High-Performance Liquid Chromatography (HPLC) swab tests before equipment release.', score: 3 },
    { text: 'Automated Clean-In-Place (CIP) systems monitor rinse conductivity and Total Organic Carbon (TOC) in real time, locking out line restarts until digital release is granted.', score: 4 },
  ], glossary: [
    { abbreviation: 'TOC', fullForm: 'Total Organic Carbon' },
    { abbreviation: 'HPLC', fullForm: 'High-Performance Liquid Chromatography' },
    { abbreviation: 'CIP', fullForm: 'Clean-In-Place' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Strategy', text: 'How does the facility prepare for regulatory quality audits (e.g., US FDA, WHO, State Licensing Authorities)?', options: [
    { text: 'Audit preparation begins only after an official inspection notice is received by cleaning files and compiling missing records.', score: 1 },
    { text: 'Periodic mock audits are conducted internally by senior staff, tracking findings on spreadsheets.', score: 2 },
    { text: 'A digital audit-readiness system maintains validated document trails, change control approvals, and calibration logs ready for inspection.', score: 3 },
    { text: 'A continuous regulatory intelligence platform tracks evolving Good Manufacturing Practices (cGMP) guidelines, automatically auditing shop-floor data logs against global standards.', score: 4 },
  ], glossary: [
    { abbreviation: 'FDA', fullForm: 'Food and Drug Administration' },
    { abbreviation: 'WHO', fullForm: 'World Health Organization' },
    { abbreviation: 'cGMP', fullForm: 'Current Good Manufacturing Practices' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'People', text: 'How is employee training and standard operating procedure (SOP) qualification tracked?', options: [
    { text: 'Standard operating procedure (SOP) printouts are circulated for physical signatures, and training is tracked informally.', score: 1 },
    { text: 'Training attendance is recorded on paper sign-in sheets and entered manually into a Human Resources (HR) spreadsheet.', score: 2 },
    { text: 'A digital Learning Management System (LMS) tracks employee SOP version approvals, quiz scores, and annual qualification renewals.', score: 3 },
    { text: 'The Learning Management System (LMS) is linked directly to the Manufacturing Execution System (MES), preventing operators from accessing machines or batch records if their certifications have expired.', score: 4 },
  ], glossary: [
    { abbreviation: 'SOP', fullForm: 'Standard Operating Procedure' },
    { abbreviation: 'LMS', fullForm: 'Learning Management System' },
    { abbreviation: 'MES', fullForm: 'Manufacturing Execution System' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Finance', text: 'How are API (Active Pharmaceutical Ingredient) synthesis yields and material batch losses monitored?', options: [
    { text: 'Raw chemical usage is reconciled only at the end of the month based on physical store stock reconciliations.', score: 1 },
    { text: 'Theoretical vs. actual chemical yields are calculated manually on paper batch records at the end of synthesis runs.', score: 2 },
    { text: 'Enterprise Resource Planning (ERP) batch costing tracks raw material consumption variances, highlighting solvent recovery rates and yield losses per run.', score: 3 },
    { text: 'Real-time process analytical technology (PAT) monitors reaction kinetics, optimizing chemical conversion efficiency and calculating API unit manufacturing cost automatically.', score: 4 },
  ], glossary: [
    { abbreviation: 'API', fullForm: 'Active Pharmaceutical Ingredient' },
    { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
    { abbreviation: 'PAT', fullForm: 'Process Analytical Technology' },
  ] },
  { domain: 'pharmaceuticals_biomanufacturing', pillar: 'Marketing', text: 'How are institutional tenders, government hospital contracts, and export documentation managed?', options: [
    { text: 'Tender submissions and export dossiers are compiled manually using paper files and disorganized digital folders.', score: 1 },
    { text: 'Tender deadlines, earnest money deposits (EMD), and distributor price lists are tracked in Microsoft Excel spreadsheets.', score: 2 },
    { text: 'A specialized customer relationship and tender management system coordinates bidding schedules, drug master file (DMF) submissions, and commercial terms.', score: 3 },
    { text: 'An integrated export compliance platform automates electronic Common Technical Document (eCTD) submissions, tracks distributor orders, and manages country-specific regulatory approvals.', score: 4 },
  ], glossary: [
    { abbreviation: 'EMD', fullForm: 'Earnest Money Deposit' },
    { abbreviation: 'DMF', fullForm: 'Drug Master File' },
    { abbreviation: 'eCTD', fullForm: 'Electronic Common Technical Document' },
  ] },

  // ===== 20. Automotive & Heavy Engineering (Others) =====
  { domain: 'automotive_heavy_engineering', pillar: 'Operations', text: 'How are line-side parts and sub-assemblies delivered to main assembly stations?', options: [
    { text: 'Operators walk to the central stockroom to pick parts and fasteners manually when their bins run empty.', score: 1 },
    { text: 'Material handlers push manual hand-trolleys to restock parts based on verbal requests or visual empty bin sightings.', score: 2 },
    { text: 'A manual or barcode-driven Kanban system triggers regular material kitting deliveries to assembly stations.', score: 3 },
    { text: 'Automated Guided Vehicles (AGVs) or Autonomous Mobile Robots (AMRs) deliver kitted parts directly to line-side stations synchronized with live assembly sequencing.', score: 4 },
  ], glossary: [
    { abbreviation: 'AGV', fullForm: 'Automated Guided Vehicle' },
    { abbreviation: 'AMR', fullForm: 'Autonomous Mobile Robot' },
  ] },
  { domain: 'automotive_heavy_engineering', pillar: 'Strategy', text: 'How are supplier part qualification and Production Part Approval Processes (PPAP) handled?', options: [
    { text: 'Component vendors supply trial samples that are inspected informally before full production orders are placed.', score: 1 },
    { text: 'Production Part Approval Process (PPAP) documents and initial inspection reports are submitted via email and reviewed manually.', score: 2 },
    { text: 'A Supplier Quality Management (SQM) portal standardizes PPAP submissions, dimensional inspections, and failure mode reviews.', score: 3 },
    { text: 'Supplier portals integrate live statistical quality feeds from vendor facilities, auto-qualifying component batches before they leave the supplier\'s warehouse.', score: 4 },
  ], glossary: [
    { abbreviation: 'PPAP', fullForm: 'Production Part Approval Process' },
    { abbreviation: 'SQM', fullForm: 'Supplier Quality Management' },
  ] },
  { domain: 'automotive_heavy_engineering', pillar: 'Operations', text: 'How are end-of-line testing and safety-critical component calibrations performed?', options: [
    { text: 'Finished assemblies undergo basic manual functional checks, with pass/fail outcomes recorded on paper tags.', score: 1 },
    { text: 'Operators use dedicated physical test rigs, writing test numbers and torque readings into inspection registers.', score: 2 },
    { text: 'Digital testing benches automatically measure electrical/mechanical parameters and print unique serial-number test certificates.', score: 3 },
    { text: 'Automated end-of-line testing stations feed torque, pressure, and dyno test curves directly into the vehicle or part traceability record.', score: 4 },
  ], glossary: [] },
  { domain: 'automotive_heavy_engineering', pillar: 'Finance', text: 'How is manufacturing scrap, metal cut-loss, and machining chip waste monitored and monetized?', options: [
    { text: 'Scrap metal and rejected castings are dumped in open yards and sold periodically without recording scrap weight by part number.', score: 1 },
    { text: 'Scrap weights are recorded at factory weighbridges, and total scrap revenue is reconciled against monthly sales invoices.', score: 2 },
    { text: 'Enterprise Resource Planning (ERP) scrap accounting tracks scrap percentages by machine and part number, identifying process yield losses.', score: 3 },
    { text: 'Automated scrap handling systems segregate clean alloy chips for maximum recycling recovery value, calculating net scrap loss per finished product in real time.', score: 4 },
  ], glossary: [
    { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
  ] },
  { domain: 'automotive_heavy_engineering', pillar: 'Technology', text: 'How are Computer Numerical Control (CNC) machine programs and tool offset data managed?', options: [
    { text: 'Machine operators write and edit G-code programs directly at machine control panels, saving them locally on machine memory.', score: 1 },
    { text: 'CNC programs are stored on Universal Serial Bus (USB) thumb drives and transferred manually between machines.', score: 2 },
    { text: 'A Direct Numerical Control (DNC) network centralizes CNC program distribution, version tracking, and tool offset uploads.', score: 3 },
    { text: 'Connected smart machine networks pull tool wear telemetry, dynamically adjusting tool offset values and updating machine programs in real time.', score: 4 },
  ], glossary: [
    { abbreviation: 'CNC', fullForm: 'Computer Numerical Control' },
    { abbreviation: 'USB', fullForm: 'Universal Serial Bus' },
    { abbreviation: 'DNC', fullForm: 'Direct Numerical Control' },
  ] },
  { domain: 'automotive_heavy_engineering', pillar: 'People', text: 'How are technician assembly skills, welding certifications, and cross-training tracked?', options: [
    { text: 'Assembly and welding tasks are allocated verbally based on who is present on the shop floor.', score: 1 },
    { text: 'A physical skill-matrix board in the shop office tracks operator proficiencies using colored stickers.', score: 2 },
    { text: 'A digital skill matrix database tracks operator qualification levels, welding re-certification dates, and cross-training requirements.', score: 3 },
    { text: 'Digital workstation login requires badge scanning that verifies operator certifications, physically locking machine interlocks if qualifications are expired.', score: 4 },
  ], glossary: [] },
  { domain: 'automotive_heavy_engineering', pillar: 'Operations', text: 'How are assembly line bottlenecks and cycle times balanced across workstations?', options: [
    { text: 'Line balance is adjusted informally by operators assisting slower stations when queues build up.', score: 1 },
    { text: 'Industrial engineers conduct periodic stopwatch time studies, recording cycle times on paper or spreadsheets.', score: 2 },
    { text: 'Video-assisted line balancing software breaks down operator movements, standardizing work elements and takt times.', score: 3 },
    { text: 'Real-time line monitoring uses optical sensors to track workstation dwell times, automatically alerting supervisors when station cycle times deviate.', score: 4 },
  ], glossary: [] },
  { domain: 'automotive_heavy_engineering', pillar: 'Operations', text: 'How are customer warranty claims and field component failures analyzed?', options: [
    { text: 'Returned warranty parts are inspected sporadically, with credit notes issued without formal root-cause analysis.', score: 1 },
    { text: 'Warranty claims are compiled in spreadsheets, and quarterly meetings discuss recurring failure modes.', score: 2 },
    { text: 'A digital warranty tracking system links field failures to production batch serial numbers, triggering formal 8D problem-solving workflows.', score: 3 },
    { text: 'Connected vehicle or equipment Internet of Things (IoT) telemetry monitors field component operating stresses, triggering preventive recalls before customer breakdowns occur.', score: 4 },
  ], glossary: [
    { abbreviation: '8D', fullForm: 'Eight Disciplines of Problem Solving' },
    { abbreviation: 'IoT', fullForm: 'Internet of Things' },
  ] },
  { domain: 'automotive_heavy_engineering', pillar: 'Marketing', text: 'How are Original Equipment Manufacturer (OEM) customer requests for quotation (RFQ) and engineering drawings managed?', options: [
    { text: 'Customer inquiries are received over email or WhatsApp, with price quotations estimated on paper scratch pads.', score: 1 },
    { text: 'Engineering quotations are calculated using standardized Microsoft Excel cost-breakup models.', score: 2 },
    { text: 'A dedicated Customer Relationship Management (CRM) and cost-estimation platform tracks quotation status, drawing revisions, and customer win rates.', score: 3 },
    { text: 'An integrated commercial portal models tool manufacturing lead times, raw material commodity index pricing, and component cost curves to automate quotation turnarounds.', score: 4 },
  ], glossary: [
    { abbreviation: 'OEM', fullForm: 'Original Equipment Manufacturer' },
    { abbreviation: 'RFQ', fullForm: 'Request for Quotation' },
    { abbreviation: 'CRM', fullForm: 'Customer Relationship Management' },
  ] },
];
