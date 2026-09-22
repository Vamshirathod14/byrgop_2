// Manufacturing-Based Sector KY question bank — 6 domains x 9 questions.
// One question bank per domain slug (the slugs match the `domains` collection;
// underscore slugs follow the existing Manufacturing/Product domain pattern).
// Each option carries its mark value (A=1 ... D=4). `glossary` entries are the
// acronyms expanded inline in the option text (rendered as hover tooltips).
export const MANUFACTURING_DOMAINS = [
  {
    slug: 'manufacturing',
    name: 'Manufacturing & Industrial Operations',
    questions: [
      {
        text: 'What maintenance strategy is used to keep factory machinery running reliably?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'CMMS', fullForm: 'Computerized Maintenance Management System' },
          { abbreviation: 'IoT', fullForm: 'Internet of Things' },
        ],
        options: [
          { text: 'Breakdown maintenance: Repairs occur exclusively after machinery breaks down.', score: 1 },
          { text: 'Periodic preventive maintenance: Physical servicing occurs based on fixed calendar intervals (e.g., monthly/quarterly).', score: 2 },
          { text: 'Usage-based maintenance: Running hours and digital logs trigger work orders in a CMMS (Computerized Maintenance Management System).', score: 3 },
          { text: 'Predictive maintenance: IoT (Internet of Things) sensors and vibration monitors forecast mechanical failures before lines halt.', score: 4 },
        ],
      },
      {
        text: 'How is shop-floor execution and Work-in-Progress (WIP) tracked through production?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'WIP', fullForm: 'Work-In-Progress' },
          { abbreviation: 'MES', fullForm: 'Manufacturing Execution System' },
          { abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' },
        ],
        options: [
          { text: 'Paper route cards or job traveler sheets move physically with parts across work centers.', score: 1 },
          { text: 'Supervisors scan barcodes or enter daily production completions into Microsoft Excel sheets.', score: 2 },
          { text: 'A MES (Manufacturing Execution System) tracks real-time WIP (Work-In-Progress), station routing, and operator sign-offs.', score: 3 },
          { text: 'Real-time RFID (Radio-Frequency Identification) tracking monitors live bottlenecks and dynamically reroutes jobs across available machines.', score: 4 },
        ],
      },
      {
        text: 'How do you track and evaluate Overall Equipment Effectiveness (OEE) — availability, performance, and quality?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'OEE', fullForm: 'Overall Equipment Effectiveness' },
          { abbreviation: 'PLC', fullForm: 'Programmable Logic Controller' },
        ],
        options: [
          { text: 'OEE (Overall Equipment Effectiveness) is not calculated; productivity is evaluated purely on total output count per shift.', score: 1 },
          { text: 'Machine operators record downtime reasons and scrap quantities manually on paper sheets at the end of every shift.', score: 2 },
          { text: 'Operators log downtime reason codes and scrap directly into digital touchscreens or shop-floor tablets.', score: 3 },
          { text: 'Machine PLCs (Programmable Logic Controllers) connect to networks, tracking real-time OEE (Overall Equipment Effectiveness) and micro-stoppages automatically.', score: 4 },
        ],
      },
      {
        text: 'How is part quality monitored and controlled during the manufacturing process?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'SPC', fullForm: 'Statistical Process Control' }],
        options: [
          { text: 'End-of-line sorting: Rejection sorting happens entirely during final manual inspection before packing.', score: 1 },
          { text: 'In-process sampling: Operators measure sample parts hourly with manual gauges (e.g., vernier calipers) and log them on paper sheets.', score: 2 },
          { text: 'SPC (Statistical Process Control): Quality software plots real-time control charts, alerting operators before dimensions drift out of tolerance.', score: 3 },
          { text: 'Automated inspection: Integrated optical or laser scanning systems inspect parts inline and adjust machine tool offsets automatically.', score: 4 },
        ],
      },
      {
        text: 'How are production tooling, dies, jigs, and assembly fixtures managed?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' }],
        options: [
          { text: 'Tooling is stored on open shop racks; operators search for needed dies manually.', score: 1 },
          { text: 'Tool issues and returns are recorded manually in a physical tool-crib register.', score: 2 },
          { text: 'Tool-room software tracks die storage locations, shot counts, and scheduled preventive regrinds.', score: 3 },
          { text: 'RFID (Radio-Frequency Identification) tagged smart tooling monitors live tool wear, automatically locking out worn dies from production.', score: 4 },
        ],
      },
      {
        text: 'How are factory production schedules and machine capacity planned?',
        category: 'strategic-direction',
        glossary: [
          { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
          { abbreviation: 'APS', fullForm: 'Advanced Planning and Scheduling' },
        ],
        options: [
          { text: 'Daily job sequencing is written on a physical whiteboard by the shop foreman.', score: 1 },
          { text: 'Production schedules are created in static Microsoft Excel spreadsheets without calculating machine capacity constraints.', score: 2 },
          { text: 'ERP (Enterprise Resource Planning) software schedules jobs against machine limits, tooling readiness, and raw material availability.', score: 3 },
          { text: 'Dynamic APS (Advanced Planning and Scheduling) engines reschedule production automatically when material delays or line stoppages occur.', score: 4 },
        ],
      },
      {
        text: 'How are Bills of Materials (BOM) and Engineering Change Orders (ECO) updated on the line?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'BOM', fullForm: 'Bill of Materials' },
          { abbreviation: 'ECO', fullForm: 'Engineering Change Order' },
          { abbreviation: 'CAD', fullForm: 'Computer-Aided Design' },
          { abbreviation: 'PLM', fullForm: 'Product Lifecycle Management' },
          { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
        ],
        options: [
          { text: 'Paper drawings are marked up by hand, with change orders communicated verbally to operators.', score: 1 },
          { text: 'CAD (Computer-Aided Design) drawings and BOM (Bill of Materials) files are saved in shared computer folders with manual version names.', score: 2 },
          { text: 'A PLM (Product Lifecycle Management) or ERP (Enterprise Resource Planning) system coordinates drawing revisions and digital ECO (Engineering Change Order) approval workflows.', score: 3 },
          { text: 'Connected engineering systems update digital work instructions and BOM (Bill of Materials) revisions instantly at all line-side operator screens.', score: 4 },
        ],
      },
      {
        text: 'How do you monitor energy consumption, power factors, and fuel costs on the plant floor?',
        category: 'financial-performance',
        glossary: [
          { abbreviation: 'DISCOM', fullForm: 'Electricity Distribution Company' },
          { abbreviation: 'kW', fullForm: 'Kilowatt' },
          { abbreviation: 'IEMS', fullForm: 'Industrial Energy Management System' },
        ],
        options: [
          { text: 'Monthly utility bills from the state electricity distribution company (DISCOM) are reviewed without tracking individual machine draws.', score: 1 },
          { text: 'Periodic energy audits are conducted by external engineering consultants or manual panel meter readings.', score: 2 },
          { text: 'Digital sub-meters on high-load equipment (compressors, furnaces) track peak kilowatt (kW) demand and unit consumption trends.', score: 3 },
          { text: 'An IEMS (Industrial Energy Management System) balances machine startup cycles to eliminate maximum demand penalties and calculates energy cost per finished product.', score: 4 },
        ],
      },
      {
        text: 'How are shop-floor safety incidents, near-misses, and worker compliance managed?',
        category: 'people-organization',
        glossary: [
          { abbreviation: 'PPE', fullForm: 'Personal Protective Equipment' },
          { abbreviation: 'EHS', fullForm: 'Environment, Health, and Safety' },
          { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
        ],
        options: [
          { text: 'Accident forms are filled out only when an injury requires external hospital treatment.', score: 1 },
          { text: 'Monthly safety committee meetings review printed suggestion box notes, accident logs, and basic PPE (Personal Protective Equipment) checks.', score: 2 },
          { text: 'A digital EHS (Environment, Health, and Safety) platform manages machine guarding checklists, incident investigations, and safety training records.', score: 3 },
          { text: 'AI (Artificial Intelligence) optical monitors and wearable worker sensors detect hazard zone intrusions and automatically shut down machinery.', score: 4 },
        ],
      },
    ],
  },
  {
    slug: 'real_estate_construction',
    name: 'Real Estate, Construction & Infrastructure',
    questions: [
      {
        text: 'How do you track project schedules, milestones, and critical path activities on job sites?',
        category: 'strategic-direction',
        glossary: [{ abbreviation: 'BIM', fullForm: 'Building Information Modeling' }],
        options: [
          { text: 'The job schedule is marked on a dry-erase whiteboard in the site office and reviewed in weekly meetings.', score: 1 },
          { text: 'Project managers maintain spreadsheet bar charts that are updated manually for monthly client/management reviews.', score: 2 },
          { text: 'Dedicated scheduling software (e.g., Primavera P6, Microsoft Project) tracks task dependencies, crew allocations, and critical path delays.', score: 3 },
          { text: '4D BIM (Building Information Modeling) links 3D architectural models directly to timelines to simulate phase-wise construction and detect spatial clashes.', score: 4 },
        ],
      },
      {
        text: 'How are subcontractor trade bids, contracts, and procurement packages managed?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'RFP', fullForm: 'Request for Proposal' }],
        options: [
          { text: 'Trade bids are collected via WhatsApp or physical mail, and evaluated through informal paper comparative sheets.', score: 1 },
          { text: 'Project teams compile subcontractor bids in spreadsheets and manually draft contract scopes of work.', score: 2 },
          { text: 'A digital construction procurement portal manages RFP (Request for Proposal), electronic plan rooms, and structured bid-leveling matrices.', score: 3 },
          { text: 'An enterprise procurement platform tracks historical subcontractor performance ratings, verifies statutory labor compliance (e.g., Provident Fund), and models material cost trends.', score: 4 },
        ],
      },
      {
        text: 'How are job-site safety inspections, daily hazard logs, and worker safety briefings handled?',
        category: 'people-organization',
        glossary: [
          { abbreviation: 'IoT', fullForm: 'Internet of Things' },
          { abbreviation: 'PPE', fullForm: 'Personal Protective Equipment' },
        ],
        options: [
          { text: 'Paper safety checklists are completed sporadically or when external safety inspectors visit the site.', score: 1 },
          { text: 'Weekly safety toolbox talks are documented on printed sign-in sheets filed in site trailers.', score: 2 },
          { text: 'A mobile safety app enables daily digital inspections, safety violation photos, and automated corrective task assignments.', score: 3 },
          { text: 'IoT (Internet of Things) job-site platforms utilize wearable worker sensors for fall detection and vision-based PPE (Personal Protective Equipment) compliance tracking.', score: 4 },
        ],
      },
      {
        text: 'How are Requests for Information (RFI) and architectural drawing clarifications coordinated?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'RFI', fullForm: 'Request for Information' },
          { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
          { abbreviation: 'BIM', fullForm: 'Building Information Modeling' },
        ],
        options: [
          { text: 'RFIs (Requests for Information) are asked verbally or via unstructured messages, with submittals stored in physical site binders.', score: 1 },
          { text: 'Project engineers maintain spreadsheet logs of RFIs, manually emailing stamped PDF (Portable Document Format) files.', score: 2 },
          { text: 'Cloud construction management software (e.g., Procore, Autodesk Construction Cloud) routes RFIs and drawings with automated tracking and overdue alerts.', score: 3 },
          { text: 'A model-based field platform pins RFIs directly to 3D BIM (Building Information Modeling) geometry, calculating cost impacts and updating master drawings automatically.', score: 4 },
        ],
      },
      {
        text: 'How are job costs, budget commitments, and contractor running bills tracked?',
        category: 'financial-performance',
        glossary: [
          { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
          { abbreviation: 'MB', fullForm: 'Measurement Book' },
          { abbreviation: 'RA', fullForm: 'Running Account' },
          { abbreviation: 'EVM', fullForm: 'Earned Value Management' },
        ],
        options: [
          { text: 'Project profitability is evaluated only after project closeout by reviewing general bank account balances.', score: 1 },
          { text: 'Monthly cost-to-complete spreadsheets are reconciled manually against general accounting software (e.g., Tally) entries.', score: 2 },
          { text: 'Construction ERP (Enterprise Resource Planning) software tracks committed purchase orders, subcontractor MB (Measurement Book), and RA (Running Account) bills.', score: 3 },
          { text: 'Real-time EVM (Earned Value Management) dashboards link field production quantities to cost codes, forecasting final profit margins continuously.', score: 4 },
        ],
      },
      {
        text: 'How are quality checks and project punch lists (snag lists) executed?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'QA/QC', fullForm: 'Quality Assurance and Quality Control' },
          { abbreviation: 'BIM', fullForm: 'Building Information Modeling' },
        ],
        options: [
          { text: 'Punch lists are handwritten on paper notepads during site walkthroughs and crossed off as contractors verbally report completion.', score: 1 },
          { text: 'Spreadsheets containing snag lists and cell phone photos are emailed to trade subcontractors.', score: 2 },
          { text: 'A mobile QA/QC (Quality Assurance and Quality Control) app allows engineers to pin punch list issues with photos directly onto 2D floor plans with digital sign-offs.', score: 3 },
          { text: '360-degree reality-capture cameras map weekly site photo walks against BIM (Building Information Modeling) design models to verify installation quality automatically.', score: 4 },
        ],
      },
      {
        text: 'How do you track heavy site equipment (e.g., excavators, cranes, transit mixers) and preventive maintenance?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'GPS', fullForm: 'Global Positioning System' }],
        options: [
          { text: 'Equipment is dispatched via phone calls, with maintenance performed only when machines break down on site.', score: 1 },
          { text: 'Equipment locations, running hours, and diesel consumption are tracked on a central office whiteboard or paper logbooks.', score: 2 },
          { text: 'Telematics software and GPS (Global Positioning System) tracking monitor operating hours, idle time, and scheduled service intervals.', score: 3 },
          { text: 'An integrated fleet platform monitors engine fault codes, detects fuel theft anomalies, and automates internal machinery rental costs per site.', score: 4 },
        ],
      },
      {
        text: 'How are bulk material deliveries (e.g., ready-mix concrete, TMT steel, cement) and site staging coordinated?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'JIT', fullForm: 'Just-In-Time' },
          { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
        ],
        options: [
          { text: 'Delivery trucks arrive unannounced, leading to site congestion, unloading delays, and vehicle detention charges.', score: 1 },
          { text: 'Deliveries are tracked on shared spreadsheets, and materials are staged wherever ground space is available.', score: 2 },
          { text: 'Digital delivery coordination software manages loading gate booking schedules and designated material staging zones.', score: 3 },
          { text: 'JIT (Just-In-Time) logistics systems track concrete transit mixers via GPS (Global Positioning System) geofencing, automating tower crane unloading upon vehicle arrival.', score: 4 },
        ],
      },
      {
        text: 'How are commercial property lease contracts, tenant queries, and renewals managed?',
        category: 'sales-market-growth',
        glossary: [{ abbreviation: 'CPI', fullForm: 'Consumer Price Index' }],
        options: [
          { text: 'Physical lease agreements are stored in office filing cabinets, and rent collections are logged by hand.', score: 1 },
          { text: 'Spreadsheets track lease expiration dates and rent rolls, with manual preparation of monthly tenant invoices.', score: 2 },
          { text: 'Commercial property management software manages tenant billing, CPI (Consumer Price Index) rent escalations, and digital maintenance work requests.', score: 3 },
          { text: 'An integrated real estate asset portal automates digital lease execution, tracks space absorption trends, and drives commercial lead conversions.', score: 4 },
        ],
      },
    ],
  },
  {
    slug: 'cpg_food_processing',
    name: 'Consumer Packaged Goods (CPG) & Food Processing',
    questions: [
      {
        text: 'How are product batch recipes and ingredient proportions scaled and controlled?',
        category: 'operations-execution',
        glossary: [],
        options: [
          { text: 'Operators scale ingredient quantities from memory or follow paper recipe cards taped to mixing tanks.', score: 1 },
          { text: 'Standardized recipe binders are followed, with operators calculating batch weight multipliers manually on paper.', score: 2 },
          { text: 'Digital batch formulation software connects to industrial scales, requiring operator sign-offs before adding each ingredient.', score: 3 },
          { text: 'Automated recipe management software controls computerized ingredient dosing, mixing temperatures, and agitator speeds with zero manual intervention.', score: 4 },
        ],
      },
      {
        text: 'How do you track raw material lot numbers and execute mock product recalls?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' }],
        options: [
          { text: 'Lot numbers are written in paper batch binders, and performing a mock recall takes several days.', score: 1 },
          { text: 'Lot numbers are recorded in spreadsheets, with mock recall completion requiring 24 to 48 hours.', score: 2 },
          { text: 'A barcode-driven ERP (Enterprise Resource Planning) system links ingredient lots to finished pallet tags, enabling traceability in under 2 hours.', score: 3 },
          { text: 'An end-to-end digital traceability platform maps supplier lot genealogy directly to retail distribution centers, generating recall reports in minutes.', score: 4 },
        ],
      },
      {
        text: 'How are Critical Control Points (CCP) and food safety logs (HACCP) monitored?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'CCP', fullForm: 'Critical Control Point' },
          { abbreviation: 'HACCP', fullForm: 'Hazard Analysis and Critical Control Points' },
        ],
        options: [
          { text: 'Operators record temperature, boiling, and sanitation checks on paper logs at irregular intervals during production.', score: 1 },
          { text: 'CCP (Critical Control Point) measurements are entered into spreadsheets at the conclusion of each manufacturing shift.', score: 2 },
          { text: 'Cloud food safety software guides operators through digital checklists using handheld Bluetooth-connected measurement probes.', score: 3 },
          { text: 'Automated inline CCP (Critical Control Point) sensors monitor continuous temperatures and metal detection, automatically diverting non-compliant products off the line.', score: 4 },
        ],
      },
      {
        text: 'How are sanitation cycles and Clean-In-Place (CIP) systems verified?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'CIP', fullForm: 'Clean-In-Place' },
          { abbreviation: 'ATP', fullForm: 'Adenosine Triphosphate' },
        ],
        options: [
          { text: 'Processing equipment is washed manually by operators without standardized water temperature or chemical titration records.', score: 1 },
          { text: 'CIP (Clean-In-Place) wash cycles are initiated manually, with operators logging wash times on paper log sheets.', score: 2 },
          { text: 'Automated CIP (Clean-In-Place) units run programmed wash cycles, with digital logging of ATP (Adenosine Triphosphate) hygiene swab tests prior to line clearance.', score: 3 },
          { text: 'Smart CIP (Clean-In-Place) systems optimize wash times, water usage, and chemical dosing based on real-time conductivity sensors, logging automated digital release certificates.', score: 4 },
        ],
      },
      {
        text: 'How do you control package filling weights and minimize product giveaway (overfilling)?',
        category: 'financial-performance',
        glossary: [],
        options: [
          { text: 'Filling equipment is adjusted by hand, with random manual scale checks resulting in high product overfill.', score: 1 },
          { text: 'Operators weigh sample packages hourly on a table scale and record weights on paper statistical tracking sheets.', score: 2 },
          { text: 'Automated inline checkweighers reject off-weight packages and display digital weight distribution curves to operators.', score: 3 },
          { text: 'Inline checkweighers provide continuous automated feedback loops that adjust upstream filling heads dynamically to eliminate giveaway.', score: 4 },
        ],
      },
      {
        text: 'How are batch codes, Maximum Retail Prices (MRP), and expiry dates printed and inspected?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'MRP', fullForm: 'Maximum Retail Price' },
          { abbreviation: 'CIJ', fullForm: 'Continuous Inkjet' },
        ],
        options: [
          { text: 'Manual handheld stampers or mechanical roller coders are set by hand, occasionally leading to smudged or incorrect date stamps.', score: 1 },
          { text: 'Operators program standalone CIJ (Continuous Inkjet) coders manually at the beginning of each production run.', score: 2 },
          { text: 'Networked industrial coders receive automated date, batch, and MRP (Maximum Retail Price) data directly from production orders to prevent human error.', score: 3 },
          { text: 'High-speed machine vision cameras inspect and verify the legibility of every printed code, auto-rejecting flawed packages.', score: 4 },
        ],
      },
      {
        text: 'How are raw allergens (e.g., nuts, dairy, gluten) isolated in storage and managed during line changeovers?',
        category: 'operations-execution',
        glossary: [],
        options: [
          { text: 'Allergen-containing raw materials are stored alongside non-allergens without dedicated physical separation.', score: 1 },
          { text: 'Color-coded storage areas separate allergens, with paper sign-off sheets for sanitation washdowns between product runs.', score: 2 },
          { text: 'Digital allergen management protocols enforce barcode-scanned ingredient staging and mandatory pre-run allergen swab validations.', score: 3 },
          { text: 'Production scheduling algorithms sequence runs from least-to-most allergenic products, locking out line restarts until sanitation validation is logged.', score: 4 },
        ],
      },
      {
        text: 'How do you align sales forecasts, trade promotions, and production plans (Sales and Operations Planning - S&OP)?',
        category: 'strategic-direction',
        glossary: [
          { abbreviation: 'S&OP', fullForm: 'Sales and Operations Planning' },
          { abbreviation: 'IBP', fullForm: 'Integrated Business Planning' },
          { abbreviation: 'POS', fullForm: 'Point of Sale' },
        ],
        options: [
          { text: 'Production volumes are determined based purely on current stock levels in the finished goods warehouse.', score: 1 },
          { text: 'Sales forecasts are compiled monthly in spreadsheets without factoring in trade promotional schemes or packaging line limits.', score: 2 },
          { text: 'An S&OP (Sales and Operations Planning) monthly process reconciles marketing promotions, distributor backorders, and plant manufacturing capacity.', score: 3 },
          { text: 'An IBP (Integrated Business Planning) platform incorporates retail POS (Point of Sale) consumption feeds and machine learning to balance production schedules.', score: 4 },
        ],
      },
      {
        text: 'How do you monitor packaging scrap and material yield efficiency?',
        category: 'financial-performance',
        glossary: [],
        options: [
          { text: 'Packaging film, foil, and carton scrap are discarded without measuring scrap percentages.', score: 1 },
          { text: 'Packaging scrap weight is calculated from monthly scrap disposal and merchant sales invoices.', score: 2 },
          { text: 'Digital line monitoring measures packaging scrap rates per batch and tracks scrap root causes.', score: 3 },
          { text: 'Real-time yield monitoring optimizes packaging machine tensions, minimizing material trim loss and calculating packaging yield costs continuously.', score: 4 },
        ],
      },
    ],
  },
  {
    slug: 'raw_materials_mining_metallurgy',
    name: 'Raw Materials, Mining & Metallurgy',
    questions: [
      {
        text: 'How are geological drilling logs, assays, and ore body models maintained?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'CAD', fullForm: 'Computer-Aided Design' },
          { abbreviation: 'MWD', fullForm: 'Measurement-While-Drilling' },
        ],
        options: [
          { text: 'Drill core logs and laboratory chemical assay test reports are filed in physical paper logbooks.', score: 1 },
          { text: 'Chemical assay data is maintained in spreadsheets and converted into 2D cross-sections in basic CAD (Computer-Aided Design) software.', score: 2 },
          { text: '3D geological modeling software (e.g., Datamine, Micromine) models ore body structures, thickness, and grade distributions.', score: 3 },
          { text: 'Dynamic 3D block models update continuously from automated MWD (Measurement-While-Drilling) sensor data and automated geostatistical algorithms.', score: 4 },
        ],
      },
      {
        text: 'How are short-term mine extraction sequences and cut-off grades determined?',
        category: 'strategic-direction',
        glossary: [],
        options: [
          { text: 'Extraction locations are decided daily by mine supervisors based on visual rock appearance and vehicle access.', score: 1 },
          { text: 'Mine plans are compiled in monthly spreadsheets using static commodity price assumptions.', score: 2 },
          { text: 'Mine planning software generates optimized open-pit boundaries, bench extraction schedules, and waste stripping ratios.', score: 3 },
          { text: 'Dynamic mine optimization engines adjust extraction sequencing and cut-off grades in real time based on live commodity market prices and plant recovery rates.', score: 4 },
        ],
      },
      {
        text: 'How are haul trucks, dumpers, and loading equipment dispatched and monitored?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'FMS', fullForm: 'Fleet Management System' },
          { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
        ],
        options: [
          { text: 'Haul truck operators are assigned to loading units verbally at shift start or over two-way walkie-talkie channels.', score: 1 },
          { text: 'A manual dispatch board in the quarry office tracks equipment allocations and trip counts via paper trip sheets.', score: 2 },
          { text: 'A computerized FMS (Fleet Management System) with GPS (Global Positioning System) optimizes truck routing to shovels based on cycle times.', score: 3 },
          { text: 'Autonomous haulage and drilling systems operate with dynamic route optimization, anti-collision radar, and zero manual vehicle dispatching.', score: 4 },
        ],
      },
      {
        text: 'How is mineral processing plant recovery and chemical reagent dosing controlled?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'OSA', fullForm: 'On-Stream Analyzer' },
          { abbreviation: 'PID', fullForm: 'Proportional-Integral-Derivative' },
          { abbreviation: 'APC', fullForm: 'Advanced Process Control' },
        ],
        options: [
          { text: 'Reagent and water flow rates are adjusted manually based on visual inspection of flotation froth or slurry.', score: 1 },
          { text: 'Shift-end laboratory assays provide feedback, with operators adjusting chemical feed valves hours later.', score: 2 },
          { text: 'OSAs (On-Stream Analyzers) provide continuous elemental slurry analysis with automated PID (Proportional-Integral-Derivative) feedback loops.', score: 3 },
          { text: 'APC (Advanced Process Control) expert systems utilize machine vision on flotation froths and predictive control models to maximize mineral recovery.', score: 4 },
        ],
      },
      {
        text: 'How are smelting furnaces, temperatures, and alloy chemistry monitored?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'SCADA', fullForm: 'Supervisory Control and Data Acquisition' }],
        options: [
          { text: 'Furnace burners, power inputs, and tapping timing are judged based on experienced operator visual estimation.', score: 1 },
          { text: 'Thermocouple temperatures are logged in control room spreadsheets with manual additions of corrective alloying elements.', score: 2 },
          { text: 'SCADA (Supervisory Control and Data Acquisition) automation controls furnace power inputs, oxygen lance injection, and automated alloy feed hoppers.', score: 3 },
          { text: 'A thermodynamic digital twin models molten bath chemistry and refractory lining wear in real time, optimizing energy use and tapping schedules.', score: 4 },
        ],
      },
      {
        text: 'How is tailings pond, ash dyke, and quarry wall geotechnical stability monitored?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'InSAR', fullForm: 'Interferometric Synthetic Aperture Radar' }],
        options: [
          { text: 'Tailings bunds and rock slopes are inspected visually on physical drive-by checks.', score: 1 },
          { text: 'Manual readings of piezometers and settlement markers are recorded on paper forms monthly.', score: 2 },
          { text: 'Automated geotechnical instruments stream pore-water pressure, water table levels, and seismic vibration data to a central portal.', score: 3 },
          { text: 'Continuous monitoring platforms integrate satellite InSAR (Interferometric Synthetic Aperture Radar) surface displacement data with connected ground sensors to provide early warnings.', score: 4 },
        ],
      },
      {
        text: 'How are drill blast patterns, explosive loading, and rock fragmentation designed?',
        category: 'operations-execution',
        glossary: [],
        options: [
          { text: 'Drill hole spacing and explosive powder quantities are determined using past field thumb rules.', score: 1 },
          { text: 'Blast drill patterns are drafted in 2D software with manual powder factor calculations in spreadsheets.', score: 2 },
          { text: '3D blast design software calculates electronic detonator timing sequences, flyrock exclusion zones, and vibration limits near human settlements.', score: 3 },
          { text: 'Integrated blast optimization links rock hardness logs from drill rigs with automated drone image fragmentation analysis to maximize downstream mill throughput.', score: 4 },
        ],
      },
      {
        text: 'How is underground or confined-space air quality, ventilation, and worker safety managed?',
        category: 'people-organization',
        glossary: [
          { abbreviation: 'SCADA', fullForm: 'Supervisory Control and Data Acquisition' },
          { abbreviation: 'CO', fullForm: 'Carbon Monoxide' },
          { abbreviation: 'CH4', fullForm: 'Methane' },
          { abbreviation: 'NOx', fullForm: 'Nitrous Fumes' },
          { abbreviation: 'VOD', fullForm: 'Ventilation-on-Demand' },
        ],
        options: [
          { text: 'Gas concentrations are checked with handheld detectors only when personnel report bad odors or fumes.', score: 1 },
          { text: 'Physical token or brass tag-in/tag-out boards track workers entering and exiting underground mine portals.', score: 2 },
          { text: 'SCADA (Supervisory Control and Data Acquisition) linked gas sensors (Carbon Monoxide - CO, Methane - CH4, and Nitrous Fumes - NOx) monitor air quality and control main ventilation fan speeds.', score: 3 },
          { text: 'Real-time tracking meshes locate all personnel underground, pairing with VOD (Ventilation-on-Demand) to direct clean airflow only to active working zones.', score: 4 },
        ],
      },
      {
        text: 'How do you monitor raw bulk material stockpiles and rail/port dispatch logistics?',
        category: 'financial-performance',
        glossary: [{ abbreviation: 'LiDAR', fullForm: 'Light Detection and Ranging' }],
        options: [
          { text: 'Stockpile tonnage is estimated visually, with railway wagon or truck loading coordinated through phone calls.', score: 1 },
          { text: 'Land surveyors perform periodic physical stockpile surveys, with shipment logs tracked in spreadsheets.', score: 2 },
          { text: 'Drone LiDAR (Light Detection and Ranging) scans measure stockpile volumes, and automated rail loadout systems use dynamic weigh-in-motion scales.', score: 3 },
          { text: 'An integrated pit-to-port logistics system manages real-time ore grade blending across stockpiles, rail train sequencing, and automated ship loading.', score: 4 },
        ],
      },
    ],
  },
  {
    slug: 'pharmaceuticals_biomanufacturing',
    name: 'Pharmaceuticals & Bio-Manufacturing',
    questions: [
      {
        text: 'How are Good Manufacturing Practices (GMP) and Batch Manufacturing Records (BMR) maintained?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'GMP', fullForm: 'Good Manufacturing Practices' },
          { abbreviation: 'BMR', fullForm: 'Batch Manufacturing Record' },
          { abbreviation: 'eBR', fullForm: 'Electronic Batch Record' },
          { abbreviation: 'MES', fullForm: 'Manufacturing Execution System' },
          { abbreviation: 'ALCOA', fullForm: 'Attributable, Legible, Contemporaneous, Original, Accurate' },
        ],
        options: [
          { text: 'Paper BMR (Batch Manufacturing Record) are filled out by hand during production and stored in physical filing cabinets.', score: 1 },
          { text: 'Batch records are typed into Microsoft Excel or word processor templates, printed out, and signed manually.', score: 2 },
          { text: 'An eBR (Electronic Batch Record) system enforces step-by-step digital operator sign-offs and instrument data capture.', score: 3 },
          { text: 'A MES (Manufacturing Execution System) directly logs automated machine parameters, ensuring complete data integrity (ALCOA+) with zero paper records.', score: 4 },
        ],
      },
      {
        text: 'How are deviations, Out of Specification (OOS) results, and Corrective and Preventive Actions (CAPA) managed?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'OOS', fullForm: 'Out of Specification' },
          { abbreviation: 'CAPA', fullForm: 'Corrective and Preventive Action' },
          { abbreviation: 'QMS', fullForm: 'Quality Management System' },
        ],
        options: [
          { text: 'Production deviations and lab failures are handled informally between shop-floor supervisors and quality managers.', score: 1 },
          { text: 'Deviations and OOS (Out of Specification) investigation forms are filled out on paper and tracked in a central spreadsheet.', score: 2 },
          { text: 'A digital QMS (Quality Management System) manages deviation workflows, root-cause investigations, and automated CAPA (Corrective and Preventive Action) task assignments.', score: 3 },
          { text: 'Enterprise QMS (Quality Management System) analytics identify systemic quality risks across manufacturing lines and predict audit vulnerabilities.', score: 4 },
        ],
      },
      {
        text: 'How are cleanroom heating, ventilation, and air conditioning (HVAC) systems monitored?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'HVAC', fullForm: 'Heating, Ventilation, and Air Conditioning' },
          { abbreviation: 'BMS', fullForm: 'Building Management System' },
        ],
        options: [
          { text: 'Room differential pressure, humidity, and temperatures are checked on physical wall gauges and logged on paper once per shift.', score: 1 },
          { text: 'Standalone data loggers record temperature and humidity, with files downloaded manually each week.', score: 2 },
          { text: 'A centralized BMS (Building Management System) continuously tracks room pressure and air particulate levels, triggering alarms for deviations.', score: 3 },
          { text: 'An integrated BMS (Building Management System) automatically modulates cleanroom airflow and fan speeds to guarantee continuous cleanroom classification compliance.', score: 4 },
        ],
      },
      {
        text: 'How is cold-chain integrity monitored during temperature-sensitive drug storage and transport?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'IoT', fullForm: 'Internet of Things' },
          { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
        ],
        options: [
          { text: 'Cold-room temperatures are checked on analog wall thermometers and logged in a physical register twice daily.', score: 1 },
          { text: 'Standalone temperature data loggers accompany shipments, with data reviewed manually only after delivery at destination.', score: 2 },
          { text: 'IoT (Internet of Things) temperature loggers stream real-time environmental data to the cloud, sending instant alerts for thermal excursions.', score: 3 },
          { text: 'Connected cold-chain platforms combine GPS (Global Positioning System) tracking with live thermal monitoring to reroute shipments facing temperature spikes.', score: 4 },
        ],
      },
      {
        text: 'How are cleaning validations and equipment cross-contamination protocols verified?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'TOC', fullForm: 'Total Organic Carbon' },
          { abbreviation: 'HPLC', fullForm: 'High-Performance Liquid Chromatography' },
          { abbreviation: 'CIP', fullForm: 'Clean-In-Place' },
        ],
        options: [
          { text: 'Equipment is washed using manual scrub downs without standardized chemical titration or rinse water test logs.', score: 1 },
          { text: 'Cleaning procedures are written in manuals, with operators logging chemical rinse times on physical batch log sheets.', score: 2 },
          { text: 'Validated cleaning protocols enforce TOC (Total Organic Carbon) and HPLC (High-Performance Liquid Chromatography) swab tests before equipment release.', score: 3 },
          { text: 'Automated CIP (Clean-In-Place) systems monitor rinse conductivity and TOC (Total Organic Carbon) in real time, locking out line restarts until digital release is granted.', score: 4 },
        ],
      },
      {
        text: 'How does the facility prepare for regulatory quality audits (e.g., US FDA, WHO, State Licensing Authorities)?',
        category: 'strategic-direction',
        glossary: [{ abbreviation: 'cGMP', fullForm: 'Current Good Manufacturing Practices' }],
        options: [
          { text: 'Audit preparation begins only after an official inspection notice is received by cleaning files and compiling missing records.', score: 1 },
          { text: 'Periodic mock audits are conducted internally by senior staff, tracking findings on spreadsheets.', score: 2 },
          { text: 'A digital audit-readiness system maintains validated document trails, change control approvals, and calibration logs ready for inspection.', score: 3 },
          { text: 'A continuous regulatory intelligence platform tracks evolving cGMP (Current Good Manufacturing Practices) guidelines, automatically auditing shop-floor data logs against global standards.', score: 4 },
        ],
      },
      {
        text: 'How is employee training and standard operating procedure (SOP) qualification tracked?',
        category: 'people-organization',
        glossary: [
          { abbreviation: 'SOP', fullForm: 'Standard Operating Procedure' },
          { abbreviation: 'HR', fullForm: 'Human Resources' },
          { abbreviation: 'LMS', fullForm: 'Learning Management System' },
          { abbreviation: 'MES', fullForm: 'Manufacturing Execution System' },
        ],
        options: [
          { text: 'SOP (Standard Operating Procedure) printouts are circulated for physical signatures, and training is tracked informally.', score: 1 },
          { text: 'Training attendance is recorded on paper sign-in sheets and entered manually into an HR (Human Resources) spreadsheet.', score: 2 },
          { text: 'A digital LMS (Learning Management System) tracks employee SOP version approvals, quiz scores, and annual qualification renewals.', score: 3 },
          { text: 'The LMS (Learning Management System) is linked directly to the MES (Manufacturing Execution System), preventing operators from accessing machines or batch records if their certifications have expired.', score: 4 },
        ],
      },
      {
        text: 'How are API (Active Pharmaceutical Ingredient) synthesis yields and material batch losses monitored?',
        category: 'financial-performance',
        glossary: [
          { abbreviation: 'API', fullForm: 'Active Pharmaceutical Ingredient' },
          { abbreviation: 'PAT', fullForm: 'Process Analytical Technology' },
          { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
        ],
        options: [
          { text: 'Raw chemical usage is reconciled only at the end of the month based on physical store stock reconciliations.', score: 1 },
          { text: 'Theoretical vs. actual chemical yields are calculated manually on paper batch records at the end of synthesis runs.', score: 2 },
          { text: 'ERP (Enterprise Resource Planning) batch costing tracks raw material consumption variances, highlighting solvent recovery rates and yield losses per run.', score: 3 },
          { text: 'Real-time PAT (Process Analytical Technology) monitors reaction kinetics, optimizing chemical conversion efficiency and calculating API (Active Pharmaceutical Ingredient) unit manufacturing cost automatically.', score: 4 },
        ],
      },
      {
        text: 'How are institutional tenders, government hospital contracts, and export documentation managed?',
        category: 'sales-market-growth',
        glossary: [
          { abbreviation: 'EMD', fullForm: 'Earnest Money Deposit' },
          { abbreviation: 'DMF', fullForm: 'Drug Master File' },
          { abbreviation: 'eCTD', fullForm: 'Electronic Common Technical Document' },
        ],
        options: [
          { text: 'Tender submissions and export dossiers are compiled manually using paper files and disorganized digital folders.', score: 1 },
          { text: 'Tender deadlines, EMD (Earnest Money Deposit), and distributor price lists are tracked in Microsoft Excel spreadsheets.', score: 2 },
          { text: 'A specialized customer relationship and tender management system coordinates bidding schedules, DMF (Drug Master File) submissions, and commercial terms.', score: 3 },
          { text: 'An integrated export compliance platform automates eCTD (Electronic Common Technical Document) submissions, tracks distributor orders, and manages country-specific regulatory approvals.', score: 4 },
        ],
      },
    ],
  },
  {
    slug: 'automotive_heavy_engineering',
    name: 'Automotive & Heavy Engineering',
    questions: [
      {
        text: 'How are line-side parts and sub-assemblies delivered to main assembly stations?',
        category: 'operations-execution',
        glossary: [
          { abbreviation: 'AGV', fullForm: 'Automated Guided Vehicle' },
          { abbreviation: 'AMR', fullForm: 'Autonomous Mobile Robot' },
        ],
        options: [
          { text: 'Operators walk to the central stockroom to pick parts and fasteners manually when their bins run empty.', score: 1 },
          { text: 'Material handlers push manual hand-trolleys to restock parts based on verbal requests or visual empty bin sightings.', score: 2 },
          { text: 'A manual or barcode-driven Kanban system triggers regular material kitting deliveries to assembly stations.', score: 3 },
          { text: 'AGVs (Automated Guided Vehicles) or AMRs (Autonomous Mobile Robots) deliver kitted parts directly to line-side stations synchronized with live assembly sequencing.', score: 4 },
        ],
      },
      {
        text: 'How are supplier part qualification and Production Part Approval Processes (PPAP) handled?',
        category: 'strategic-direction',
        glossary: [
          { abbreviation: 'PPAP', fullForm: 'Production Part Approval Process' },
          { abbreviation: 'SQM', fullForm: 'Supplier Quality Management' },
        ],
        options: [
          { text: 'Component vendors supply trial samples that are inspected informally before full production orders are placed.', score: 1 },
          { text: 'PPAP (Production Part Approval Process) documents and initial inspection reports are submitted via email and reviewed manually.', score: 2 },
          { text: 'An SQM (Supplier Quality Management) portal standardizes PPAP (Production Part Approval Process) submissions, dimensional inspections, and failure mode reviews.', score: 3 },
          { text: 'Supplier portals integrate live statistical quality feeds from vendor facilities, auto-qualifying component batches before they leave the supplier\'s warehouse.', score: 4 },
        ],
      },
      {
        text: 'How are end-of-line testing and safety-critical component calibrations performed?',
        category: 'operations-execution',
        glossary: [],
        options: [
          { text: 'Finished assemblies undergo basic manual functional checks, with pass/fail outcomes recorded on paper tags.', score: 1 },
          { text: 'Operators use dedicated physical test rigs, writing test numbers and torque readings into inspection registers.', score: 2 },
          { text: 'Digital testing benches automatically measure electrical/mechanical parameters and print unique serial-number test certificates.', score: 3 },
          { text: 'Automated end-of-line testing stations feed torque, pressure, and dyno test curves directly into the vehicle or part traceability record.', score: 4 },
        ],
      },
      {
        text: 'How is manufacturing scrap, metal cut-loss, and machining chip waste monitored and monetized?',
        category: 'financial-performance',
        glossary: [{ abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' }],
        options: [
          { text: 'Scrap metal and rejected castings are dumped in open yards and sold periodically without recording scrap weight by part number.', score: 1 },
          { text: 'Scrap weights are recorded at factory weighbridges, and total scrap revenue is reconciled against monthly sales invoices.', score: 2 },
          { text: 'ERP (Enterprise Resource Planning) scrap accounting tracks scrap percentages by machine and part number, identifying process yield losses.', score: 3 },
          { text: 'Automated scrap handling systems segregate clean alloy chips for maximum recycling recovery value, calculating net scrap loss per finished product in real time.', score: 4 },
        ],
      },
      {
        text: 'How are Computer Numerical Control (CNC) machine programs and tool offset data managed?',
        category: 'digital-innovation',
        glossary: [
          { abbreviation: 'CNC', fullForm: 'Computer Numerical Control' },
          { abbreviation: 'USB', fullForm: 'Universal Serial Bus' },
          { abbreviation: 'DNC', fullForm: 'Direct Numerical Control' },
        ],
        options: [
          { text: 'Machine operators write and edit G-code programs directly at machine control panels, saving them locally on machine memory.', score: 1 },
          { text: 'CNC (Computer Numerical Control) programs are stored on USB (Universal Serial Bus) thumb drives and transferred manually between machines.', score: 2 },
          { text: 'A DNC (Direct Numerical Control) network centralizes CNC program distribution, version tracking, and tool offset uploads.', score: 3 },
          { text: 'Connected smart machine networks pull tool wear telemetry, dynamically adjusting tool offset values and updating machine programs in real time.', score: 4 },
        ],
      },
      {
        text: 'How are technician assembly skills, welding certifications, and cross-training tracked?',
        category: 'people-organization',
        glossary: [],
        options: [
          { text: 'Assembly and welding tasks are allocated verbally based on who is present on the shop floor.', score: 1 },
          { text: 'A physical skill-matrix board in the shop office tracks operator proficiencies using colored stickers.', score: 2 },
          { text: 'A digital skill matrix database tracks operator qualification levels, welding re-certification dates, and cross-training requirements.', score: 3 },
          { text: 'Digital workstation login requires badge scanning that verifies operator certifications, physically locking machine interlocks if qualifications are expired.', score: 4 },
        ],
      },
      {
        text: 'How are assembly line bottlenecks and cycle times balanced across workstations?',
        category: 'operations-execution',
        glossary: [],
        options: [
          { text: 'Line balance is adjusted informally by operators assisting slower stations when queues build up.', score: 1 },
          { text: 'Industrial engineers conduct periodic stopwatch time studies, recording cycle times on paper or spreadsheets.', score: 2 },
          { text: 'Video-assisted line balancing software breaks down operator movements, standardizing work elements and takt times.', score: 3 },
          { text: 'Real-time line monitoring uses optical sensors to track workstation dwell times, automatically alerting supervisors when station cycle times deviate.', score: 4 },
        ],
      },
      {
        text: 'How are customer warranty claims and field component failures analyzed?',
        category: 'operations-execution',
        glossary: [{ abbreviation: 'IoT', fullForm: 'Internet of Things' }],
        options: [
          { text: 'Returned warranty parts are inspected sporadically, with credit notes issued without formal root-cause analysis.', score: 1 },
          { text: 'Warranty claims are compiled in spreadsheets, and quarterly meetings discuss recurring failure modes.', score: 2 },
          { text: 'A digital warranty tracking system links field failures to production batch serial numbers, triggering formal 8D problem-solving workflows.', score: 3 },
          { text: 'Connected vehicle or equipment IoT (Internet of Things) telemetry monitors field component operating stresses, triggering preventive recalls before customer breakdowns occur.', score: 4 },
        ],
      },
      {
        text: 'How are Original Equipment Manufacturer (OEM) customer requests for quotation (RFQ) and engineering drawings managed?',
        category: 'sales-market-growth',
        glossary: [
          { abbreviation: 'OEM', fullForm: 'Original Equipment Manufacturer' },
          { abbreviation: 'RFQ', fullForm: 'Request for Quotation' },
          { abbreviation: 'CRM', fullForm: 'Customer Relationship Management' },
        ],
        options: [
          { text: 'Customer inquiries are received over email or WhatsApp, with price quotations estimated on paper scratch pads.', score: 1 },
          { text: 'Engineering quotations are calculated using standardized Microsoft Excel cost-breakup models.', score: 2 },
          { text: 'A dedicated CRM (Customer Relationship Management) and cost-estimation platform tracks quotation status, drawing revisions, and customer win rates.', score: 3 },
          { text: 'An integrated commercial portal models tool manufacturing lead times, raw material commodity index pricing, and component cost curves to automate quotation turnarounds.', score: 4 },
        ],
      },
    ],
  },
];