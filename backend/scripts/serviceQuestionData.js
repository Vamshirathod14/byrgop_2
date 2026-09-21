// Service-Based Sector question bank — SOURCE OF TRUTH (transcribed exactly).
// Each entry: domain (slug), category (KYCategory key derived from Pillar),
// text, options (A-D with scores 1-4), glossary (abbreviation/fullForm).

const PILLAR_TO_CATEGORY = {
  'Strategy': 'strategic-direction',
  'Finances': 'financial-performance',
  'Marketing': 'sales-market-growth',
  'Operations': 'operations-execution',
  'People': 'people-organization',
  'Technology': 'digital-innovation',
};

const DATA = [
  // ===== Technology & SaaS / Digital Products =====
  {
    domain: 'technology-saas', pillar: 'Technology',
    text: 'How does your team release new features and software updates?',
    options: [
      { text: 'We manually copy-paste or upload files directly to the live server.', score: 1 },
      { text: 'A developer manually runs update scripts on the server.', score: 2 },
      { text: 'We use an automated CI/CD (Continuous Integration / Continuous Deployment) pipeline that tests code before deploying.', score: 3 },
      { text: 'Our updates are fully automated across multiple regions with zero downtime, gradual canary rollouts, and instant rollbacks.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'CI/CD', fullForm: 'Continuous Integration / Continuous Deployment' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Operations',
    text: 'What happens to your system when user traffic suddenly spikes?',
    options: [
      { text: 'The website or app slows down or crashes; we have to restart the server manually.', score: 1 },
      { text: 'We manually upgrade server power (CPU / RAM) when we expect a rush.', score: 2 },
      { text: 'Our cloud servers automatically add more instances based on set CPU and memory limits.', score: 3 },
      { text: 'We use containerized, cloud-native architecture (such as Kubernetes or Serverless) that auto-scales instantly based on live traffic.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'CPU', fullForm: 'Central Processing Unit' },
      { abbreviation: 'RAM', fullForm: 'Random Access Memory' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Operations',
    text: 'How do you find out about technical bugs, crashes, or slow performance?',
    options: [
      { text: 'We only find out when customers contact support or complain on social media.', score: 1 },
      { text: 'Our engineers manually log in and review error log files after an issue is reported.', score: 2 },
      { text: 'We use centralized APM (Application Performance Monitoring) tools with automated email/Slack alerts for critical errors.', score: 3 },
      { text: 'We have live distributed tracing and observability dashboards that detect and isolate errors before users notice.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'APM', fullForm: 'Application Performance Monitoring' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Marketing',
    text: 'How do you track if customers are happy or about to stop using your product?',
    options: [
      { text: 'We only know a customer is leaving after they cancel their plan or stop paying.', score: 1 },
      { text: 'We manually check account login dates at the end of each month.', score: 2 },
      { text: 'We track in-app health scores based on login frequency and core feature usage.', score: 3 },
      { text: 'The system uses automated behavioral tracking to spot drop-off signs early and trigger automated re-engagement messages.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'technology-saas', pillar: 'Marketing',
    text: 'What is the welcome and setup process for a new customer?',
    options: [
      { text: 'Users land on an empty dashboard with no guidance, or receive a basic PDF (Portable Document Format) guide.', score: 1 },
      { text: 'We send a standard automated welcome email with links to our help center.', score: 2 },
      { text: 'We provide interactive in-app setup checklists and product walkthrough tours.', score: 3 },
      { text: 'We provide personalized setup journeys based on user roles, complete with milestone tracking and automated check-ins.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Strategy',
    text: 'How easily can external software or partner apps connect to your product?',
    options: [
      { text: 'We do not offer APIs (Application Programming Interfaces) or third-party integrations.', score: 1 },
      { text: 'We share custom integration links on a case-by-case basis with manual instructions.', score: 2 },
      { text: 'We offer standardized, documented REST (Representational State Transfer) or GraphQL (Graph Query Language) APIs with secure access key management.', score: 3 },
      { text: 'We provide a self-service developer portal with instant API keys, interactive sandboxes, webhooks, and pre-built SDKs (Software Development Kits).', score: 4 },
    ],
    glossary: [
      { abbreviation: 'API', fullForm: 'Application Programming Interface' },
      { abbreviation: 'REST', fullForm: 'Representational State Transfer' },
      { abbreviation: 'GraphQL', fullForm: 'Graph Query Language' },
      { abbreviation: 'SDK', fullForm: 'Software Development Kit' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Technology',
    text: 'How do you check for security flaws and software vulnerabilities?',
    options: [
      { text: 'We only address security issues if an incident or data breach occurs.', score: 1 },
      { text: 'We run occasional manual security reviews or periodic annual audits.', score: 2 },
      { text: 'Automated vulnerability and code quality scans run on every pull request before code is merged.', score: 3 },
      { text: 'We run continuous automated testing (SAST / DAST), routine dependency patching, and regular penetration testing.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'SAST', fullForm: 'Static Application Security Testing' },
      { abbreviation: 'DAST', fullForm: 'Dynamic Application Security Testing' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Operations',
    text: 'What happens if your main database crashes completely?',
    options: [
      { text: 'We rely on occasional manual backups; a crash would cause significant, permanent data loss.', score: 1 },
      { text: 'We have daily automated backups, but restoring them has not been recently tested.', score: 2 },
      { text: 'We run automated daily off-site backups with documented recovery targets—RTO (Recovery Time Objective) and RPO (Recovery Point Objective).', score: 3 },
      { text: 'We have live multi-region data replication with automated failover and zero data loss architecture.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RTO', fullForm: 'Recovery Time Objective' },
      { abbreviation: 'RPO', fullForm: 'Recovery Point Objective' },
    ],
  },
  {
    domain: 'technology-saas', pillar: 'Strategy',
    text: 'How does your team track how people actually use your platform?',
    options: [
      { text: 'We rely on basic website page views and total visitor counts.', score: 1 },
      { text: 'We only track basic conversion steps (e.g., website visit to account creation).', score: 2 },
      { text: 'We use event-based analytics tools to track user journeys, feature adoption, and retention cohorts.', score: 3 },
      { text: 'We run a unified CDP (Customer Data Platform) that connects in-app behavior directly to personalized features, messaging, and experimentation.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'CDP', fullForm: 'Customer Data Platform' },
    ],
  },

  // ===== Financial Services & FinTech =====
  {
    domain: 'financial_services', pillar: 'Operations',
    text: 'How do you verify customer identity during sign-up?',
    options: [
      { text: 'We collect and check physical paper ID photocopies by hand.', score: 1 },
      { text: 'Customers upload document photos, and our team checks them manually.', score: 2 },
      { text: 'Software automatically checks IDs and live photos using digital KYC (Know Your Customer).', score: 3 },
      { text: 'Verification is 100% instant and automatic using e-KYC (electronic Know Your Customer) and anti-crime database checks.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'KYC', fullForm: 'Know Your Customer' },
    ],
  },
  {
    domain: 'financial_services', pillar: 'Finances',
    text: 'How do you match and balance daily transactions across bank accounts?',
    options: [
      { text: 'We manually check numbers on paper bank statements or Excel sheets at month-end.', score: 1 },
      { text: 'We manually match bank statements in Excel once a week.', score: 2 },
      { text: 'Software automatically matches bank statements daily and flags payment differences.', score: 3 },
      { text: 'Our system matches and balances all transactions across all banks instantly in real time.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'financial_services', pillar: 'Operations',
    text: 'How do you detect and stop fraudulent payments?',
    options: [
      { text: 'We only find out after a customer complains or a bank alerts us.', score: 1 },
      { text: 'Our staff manually reviews high-value or suspicious transactions one by one.', score: 2 },
      { text: 'Basic software rules automatically block suspicious payments (e.g., wrong country or repeated failed attempts).', score: 3 },
      { text: 'Smart AI (Artificial Intelligence) instantly scores payment risk in milliseconds and blocks fraud before money leaves.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
    ],
  },
  {
    domain: 'financial_services', pillar: 'Technology',
    text: 'How do you protect customer bank details and card numbers?',
    options: [
      { text: 'Details are saved in regular files or spreadsheets without password protection or encryption.', score: 1 },
      { text: 'Basic database security is turned on, but passwords and permissions are managed manually.', score: 2 },
      { text: 'We follow standard card security rules (PCI-DSS) and mask card numbers so raw data is never saved.', score: 3 },
      { text: 'We use high-grade bank-level security hardware (HSM) and strict data locks with annual security audits.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PCI-DSS', fullForm: 'Payment Card Industry Data Security Standard' },
      { abbreviation: 'HSM', fullForm: 'Hardware Security Module' },
    ],
  },
  {
    domain: 'financial_services', pillar: 'Finances',
    text: 'How do you check and approve loan or credit applications?',
    options: [
      { text: 'Loan officers manually read paper forms, salary slips, and physical signatures.', score: 1 },
      { text: 'We manually check online credit scores (like CIBIL) and calculate eligibility in Excel.', score: 2 },
      { text: 'Software automatically fetches credit bureau scores and gives quick approvals.', score: 3 },
      { text: 'The system checks live bank statements and cash flows to approve and disburse loans instantly.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'financial_services', pillar: 'Operations',
    text: 'How do you prepare and file government/regulatory compliance reports?',
    options: [
      { text: 'We manually create reports in Excel when regulators or auditors ask for them.', score: 1 },
      { text: 'We run database reports and format the numbers by hand to file them.', score: 2 },
      { text: 'Specialized software automatically generates monthly filings and suspicious activity logs.', score: 3 },
      { text: 'Automated compliance tools (RegTech) track rules 24/7 and file reports directly to regulators without manual effort.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RegTech', fullForm: 'Regulatory Technology' },
    ],
  },
  {
    domain: 'financial_services', pillar: 'Strategy',
    text: 'How do partner businesses and apps connect to your software?',
    options: [
      { text: 'Partners must email data files or send spreadsheets manually.', score: 1 },
      { text: 'We create custom connection links and manual setup guides when requested.', score: 2 },
      { text: 'We provide standard, secure connection links (APIs) with a test area.', score: 3 },
      { text: 'We offer a self-service developer portal where partners can connect and go live instantly.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'API', fullForm: 'Application Programming Interface' },
    ],
  },
  {
    domain: 'financial_services', pillar: 'Operations',
    text: 'What happens when a payment fails or a customer disputes a charge?',
    options: [
      { text: 'Customers must submit physical forms or call; fixing the issue takes weeks.', score: 1 },
      { text: 'Support staff manually emails the payment gateway or bank to trace the issue.', score: 2 },
      { text: 'An in-app dispute button sends the issue straight into our support system with fixed turnaround times.', score: 3 },
      { text: 'The system retries failed payments automatically and resolves disputes with banks with zero human effort.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'financial_services', pillar: 'Finances',
    text: 'How do you track and manage overall cash flow and bank balances?',
    options: [
      { text: 'We log in and check separate bank account balances once a week or month.', score: 1 },
      { text: 'The finance team checks all bank balances and makes an Excel summary every morning.', score: 2 },
      { text: 'We use a single dashboard that shows daily total balances and pending payouts.', score: 3 },
      { text: 'An automated treasury system tracks live cash across all banks, predicts future cash needs, and moves funds automatically.', score: 4 },
    ],
    glossary: [],
  },

  // ===== Supply Chain, Logistics & Distribution =====
  {
    domain: 'supply-chain-logistics', pillar: 'Operations',
    text: 'How do you track stock levels and material locations in your godown or warehouse?',
    options: [
      { text: 'Workers rely on paper registers, whiteboards, or memory to find and count items.', score: 1 },
      { text: 'We enter stock quantities in Excel or simple billing software and update rack locations by hand.', score: 2 },
      { text: 'We use dedicated WMS (Warehouse Management System) software with barcode scanners to track shelf bins and stock in real time.', score: 3 },
      { text: 'Our warehouse uses RFID (Radio-Frequency Identification) tags and smart systems to locate and move stock automatically.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'WMS', fullForm: 'Warehouse Management System' },
      { abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' },
    ],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Operations',
    text: 'How does your godown team pick and pack goods for dispatch?',
    options: [
      { text: 'Helpers walk around with printed delivery challans or kachha slips, packing one order at a time.', score: 1 },
      { text: 'The godown supervisor groups orders manually on an Excel sheet and gives printed picking lists to workers.', score: 2 },
      { text: 'Software groups orders automatically and guides helpers along the fastest walking path using barcode scanners.', score: 3 },
      { text: 'We use automated conveyor systems and electronic weight-check packing tables to pack orders with zero manual error.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Finances',
    text: 'How do you book trucks, tempos, and transport companies for your dispatches?',
    options: [
      { text: 'We call local transport brokers or Transport Nagar agents daily on the phone to negotiate market spot rates.', score: 1 },
      { text: 'We maintain fixed transporter rate cards in Excel and book dispatches by calling or using individual courier websites.', score: 2 },
      { text: 'A TMS (Transportation Management System) automatically assigns loads to approved transporters based on lowest cost and committed delivery times.', score: 3 },
      { text: 'Our system connects directly via APIs (Application Programming Interfaces) to online freight platforms for instant truck booking and live market bidding.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'TMS', fullForm: 'Transportation Management System' },
      { abbreviation: 'API', fullForm: 'Application Programming Interface' },
    ],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Technology',
    text: 'How do you track the live transit location and delivery status of your goods?',
    options: [
      { text: 'We call the truck driver or transport broker on mobile to ask where the vehicle has reached.', score: 1 },
      { text: 'Staff manually opens transporter tracking websites, copies the status, and updates clients over WhatsApp or email.', score: 2 },
      { text: 'Transporter systems send automated status updates directly to our software, triggering alerts if a shipment is delayed.', score: 3 },
      { text: 'We use live GPS (Global Positioning System) vehicle trackers and IoT (Internet of Things) sensors to get real-time ETA (Estimated Time of Arrival) updates.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'GPS', fullForm: 'Global Positioning System' },
      { abbreviation: 'IoT', fullForm: 'Internet of Things' },
      { abbreviation: 'ETA', fullForm: 'Estimated Time of Arrival' },
    ],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Strategy',
    text: 'How do you decide when to reorder raw materials or finished goods?',
    options: [
      { text: 'We place purchase orders only after godown workers notice that stocks or bins are running out.', score: 1 },
      { text: 'We manually calculate reorder quantities in Excel once a month based on past sales averages.', score: 2 },
      { text: 'Our ERP (Enterprise Resource Planning) software automatically calculates safety stock levels and creates purchase orders based on seasonal demand.', score: 3 },
      { text: 'Smart AI (Artificial Intelligence) software tracks live market sales, supplier delivery delays, and factory capacity to automate purchase orders.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'ERP', fullForm: 'Enterprise Resource Planning' },
      { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
    ],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Operations',
    text: 'How do you plan local and last-mile delivery routes for your drivers?',
    options: [
      { text: 'Drivers look at address slips or invoices and decide their own driving routes based on their personal memory.', score: 1 },
      { text: 'Dispatchers divide deliveries into fixed geographic areas and assign fixed delivery days for each zone.', score: 2 },
      { text: 'Route-planning software creates daily optimized vehicle delivery routes to reduce fuel costs and travel time.', score: 3 },
      { text: 'Software recalculates delivery routes in real time based on live traffic jams and sends live SMS (Short Message Service) tracking links to buyers.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'SMS', fullForm: 'Short Message Service' },
    ],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Operations',
    text: 'How do you monitor temperature for sensitive or cold-chain items (like pharma, food, or dairy)?',
    options: [
      { text: 'Drivers check manual dial thermometers only during truck loading and final unloading.', score: 1 },
      { text: 'We put simple digital temperature data-loggers inside boxes and download the readings after delivery is complete.', score: 2 },
      { text: 'Refrigerated vehicles (Reefer trucks) have digital sensors that sound an alarm if the compartment temperature crosses safe limits.', score: 3 },
      { text: 'Wireless IoT sensors stream live temperature and humidity to a cloud dashboard 24/7, sending instant mobile alerts if cooling drops.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Operations',
    text: 'How does your facility process customer returns and damaged goods?',
    options: [
      { text: 'Returned stock is dumped in a corner of the godown and checked only when staff has free time.', score: 1 },
      { text: 'Staff checks returns against physical paper bills, updates stock in Excel, and raises credit notes by hand.', score: 2 },
      { text: 'A standard RMA (Return Merchandise Authorization) process uses barcode scanning to sort returns into restock, repair, or scrap bins.', score: 3 },
      { text: 'Automated return stations inspect and grade returned items immediately, restocking good units and issuing digital credit notes automatically.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RMA', fullForm: 'Return Merchandise Authorization' },
    ],
  },
  {
    domain: 'supply-chain-logistics', pillar: 'Finances',
    text: 'How do you audit transporter freight bills and clear payments?',
    options: [
      { text: 'Accounts clears transport bills against purchase orders directly without checking weight or trip charges line-by-line.', score: 1 },
      { text: 'Accounts staff manually matches paper transport bills against original quotation slips and delivery challans.', score: 2 },
      { text: 'Automated software verifies transport bills against agreed freight rate cards and signed LR (Lorry Receipt) / POD (Proof of Delivery) copies.', score: 3 },
      { text: 'An automated system checks freight invoices digitally, flags incorrect weight or detention charges instantly, and clears verified payments through the ERP.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'LR', fullForm: 'Lorry Receipt' },
      { abbreviation: 'POD', fullForm: 'Proof of Delivery' },
    ],
  },

  // ===== Professional Services & Consulting =====
  {
    domain: 'professional_services', pillar: 'People',
    text: 'How do you assign team members to client projects and manage their workload?',
    options: [
      { text: 'Project leads book consultants informally through personal phone calls or WhatsApp messages.', score: 1 },
      { text: 'Partner and manager teams review team availability once a week using a shared Excel sheet.', score: 2 },
      { text: 'A centralized resource planning tool tracks each consultant\'s skills, ongoing client commitments, and future availability.', score: 3 },
      { text: 'Smart software automatically matches consultant skills, career goals, and profit margin targets to project requirements.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'professional_services', pillar: 'Operations',
    text: 'How do your consultants log daily work hours and track billable time?',
    options: [
      { text: 'Team members guess hours from memory at the end of the month and email Excel timesheets to accounts.', score: 1 },
      { text: 'Staff fills out weekly digital timesheets that project managers check and approve manually.', score: 2 },
      { text: 'A PSA (Professional Services Automation) tool tracks daily billable vs. non-billable hours against project codes.', score: 3 },
      { text: 'Automated software tracks calendar meetings and document work in the background, showing live staff utilization and budget burn-rate alerts.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PSA', fullForm: 'Professional Services Automation' },
    ],
  },
  {
    domain: 'professional_services', pillar: 'Strategy',
    text: 'How do you track project scope, milestones, and deliverable deadlines?',
    options: [
      { text: 'Deliverables and deadlines are agreed informally over email, and extra client requests are handled without formal pricing changes.', score: 1 },
      { text: 'Project managers track task schedules in Excel and manually prepare written change requests when scope increases.', score: 2 },
      { text: 'Dedicated project software tracks task dependencies, deliverable dates, and budget spending against the signed SOW (Statement of Work).', score: 3 },
      { text: 'Delivery tracking software analyzes daily completion speed to alert leadership about deadline risks and profit margin drops weeks in advance.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'SOW', fullForm: 'Statement of Work' },
    ],
  },
  {
    domain: 'professional_services', pillar: 'Technology',
    text: 'How does your firm save and reuse past project reports, templates, and frameworks?',
    options: [
      { text: 'Past presentations, proposals, and deliverables remain saved on individual consultants\' personal laptops.', score: 1 },
      { text: 'Staff searches through unorganized Google Drive or shared folders to find old templates.', score: 2 },
      { text: 'A central digital knowledge base organizes standard project frameworks, proposal templates, and industry benchmarks.', score: 3 },
      { text: 'An AI (Artificial Intelligence) search engine indexes all past deliverables, automatically suggesting relevant case studies and drafting new proposals.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
    ],
  },
  {
    domain: 'professional_services', pillar: 'Finances',
    text: 'How are client invoices prepared, sent, and matched with completed work?',
    options: [
      { text: 'Accounts types Word document invoices manually weeks after project work or milestones are finished.', score: 1 },
      { text: 'Finance enters billable hours from timesheets into basic accounting software (like Tally) at month-end.', score: 2 },
      { text: 'Invoices are generated automatically from approved PSA timesheets, expenses, and fixed-fee milestone sign-offs.', score: 3 },
      { text: 'Automated billing software tracks real-time WIP (Work-In-Progress), provides client online approval portals, and manages digital payment collections.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'WIP', fullForm: 'Work-In-Progress' },
    ],
  },
  {
    domain: 'professional_services', pillar: 'Marketing',
    text: 'How do you prepare proposals, pitch presentations, and tender responses for new clients?',
    options: [
      { text: 'Every client pitch or proposal is created from scratch in PowerPoint with rough pricing estimates.', score: 1 },
      { text: 'Team members copy-paste content and slides from previous successful client decks saved on their systems.', score: 2 },
      { text: 'Proposal software provides a centralized library of approved case studies, team bios, standardized rate cards, and legal terms.', score: 3 },
      { text: 'A smart proposal platform analyzes past win-loss data to recommend the most profitable project team structure, pricing, and custom content.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'professional_services', pillar: 'Operations',
    text: 'How do you onboard new clients and execute legal contracts, service agreements, and confidentiality agreements?',
    options: [
      { text: 'Standard contracts are printed on letterhead/stamp paper, signed by hand, scanned, and emailed back and forth.', score: 1 },
      { text: 'Contract PDFs (Portable Document Formats) are sent using basic e-signature tools, with dates tracked manually.', score: 2 },
      { text: 'Automated digital workflows handle standard NDA (Non-Disclosure Agreement) and MSA (Master Services Agreement) generation, digital signing, and client project setup.', score: 3 },
      { text: 'A fully automated onboarding portal manages contract signing, conflict-of-interest checks, team access permissions, and billing setup with zero manual delay.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
      { abbreviation: 'NDA', fullForm: 'Non-Disclosure Agreement' },
      { abbreviation: 'MSA', fullForm: 'Master Services Agreement' },
    ],
  },
  {
    domain: 'professional_services', pillar: 'Marketing',
    text: 'How do you collect client feedback and measure satisfaction during and after a project?',
    options: [
      { text: 'Feedback is collected informally only when a client is unhappy, complains, or threatens to hold payments.', score: 1 },
      { text: 'Senior partners make informal phone calls to the client sponsor after the project is completed.', score: 2 },
      { text: 'Automated NPS (Net Promoter Score) and CSAT (Customer Satisfaction) surveys are sent to key client stakeholders at set project milestones.', score: 3 },
      { text: 'A real-time client feedback platform tracks survey scores, email communication speed, and milestone approvals to give a live account health score.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'NPS', fullForm: 'Net Promoter Score' },
      { abbreviation: 'CSAT', fullForm: 'Customer Satisfaction' },
    ],
  },
  {
    domain: 'professional_services', pillar: 'People',
    text: 'How do you manage freelance consultants, subject matter experts, and partner agencies?',
    options: [
      { text: 'Freelancers and external experts are hired through verbal agreements with variable, ad-hoc payment terms.', score: 1 },
      { text: 'Contractor contact details and rates are kept in an Excel sheet, and bills are collected manually.', score: 2 },
      { text: 'A vendor portal tracks contractor compliance, standard hourly rates, signed NDAs, and approved timesheets.', score: 3 },
      { text: 'An online talent platform manages automated background verification, skill matching, digital contract onboarding, time tracking, and payouts.', score: 4 },
    ],
    glossary: [],
  },

  // ===== Retail & E-Commerce =====
  {
    domain: 'retail-e-commerce', pillar: 'Operations',
    text: 'How do you update stock availability across your retail shops, website, and marketplaces (like Amazon, Flipkart, or Myntra)?',
    options: [
      { text: 'We track stock in separate, disconnected registers or software for each shop and sales channel.', score: 1 },
      { text: 'Staff manually updates stock quantities between store billing software and our website once or twice a day in Excel.', score: 2 },
      { text: 'A centralized inventory system automatically updates stock levels across all online and offline channels on a fixed schedule.', score: 3 },
      { text: 'A real-time DOM (Distributed Order Management) system maintains a single shared stock pool, automatically dispatching orders from the nearest shop or godown.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'DOM', fullForm: 'Distributed Order Management' },
    ],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Marketing',
    text: 'How do you manage product descriptions, photos, and size charts across all selling platforms?',
    options: [
      { text: 'Product details and photos are stored in basic folders and Excel sheets, and uploaded to each channel by hand.', score: 1 },
      { text: 'Shop staff and digital marketing teams create product listings separately in store billing and website portals.', score: 2 },
      { text: 'A dedicated PIM (Product Information Management) system sends standardized product catalogs, images, and prices to all channels.', score: 3 },
      { text: 'An automated PIM system uses AI (Artificial Intelligence) to write product copy, optimize SEO (Search Engine Optimization) tags, and publish listings to marketplaces instantly.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PIM', fullForm: 'Product Information Management' },
      { abbreviation: 'SEO', fullForm: 'Search Engine Optimization' },
      { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
    ],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Strategy',
    text: 'How do you manage product selling prices, festive discounts, and promotional offers?',
    options: [
      { text: 'Prices and discounts are changed manually on each website channel and by reprinting paper price tags in physical stores.', score: 1 },
      { text: 'Marketing staff sets up promo coupon codes separately in store billing software and on the e-commerce website.', score: 2 },
      { text: 'A central pricing engine applies scheduled discount rules, seasonal sale prices, and regional pricing across all billing points automatically.', score: 3 },
      { text: 'Smart pricing algorithms track competitor pricing on marketplaces and stock clearance speeds to adjust prices automatically in real time.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Technology',
    text: 'What payment options do online customers see during checkout on your website or app?',
    options: [
      { text: 'A basic multi-step checkout page that only accepts standard debit/credit card details.', score: 1 },
      { text: 'A checkout page supporting cards, Net Banking, and basic COD (Cash On Delivery) verification.', score: 2 },
      { text: 'A quick one-page checkout offering UPI (Unified Payments Interface), digital wallets (Google Pay, PhonePe, Paytm), and BNPL (Buy Now Pay Later) options.', score: 3 },
      { text: 'A seamless one-click checkout with automatic UPI intent routing, automated COD-to-prepaid conversion prompts, and instant payment fraud checks.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'COD', fullForm: 'Cash On Delivery' },
      { abbreviation: 'UPI', fullForm: 'Unified Payments Interface' },
      { abbreviation: 'BNPL', fullForm: 'Buy Now Pay Later' },
    ],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Marketing',
    text: 'How do you run customer loyalty programs and encourage repeat purchases?',
    options: [
      { text: 'We use physical paper stamp cards or do not have any formal customer loyalty system.', score: 1 },
      { text: 'Cashiers collect customer mobile numbers and email IDs at billing to send occasional WhatsApp/SMS festive greetings.', score: 2 },
      { text: 'An integrated loyalty software tracks reward points across both physical store billing counters and online website orders.', score: 3 },
      { text: 'A personalized customer retention system sends automated, customized discount vouchers and product suggestions based on past buying history.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Operations',
    text: 'How do your physical retail stores help fulfill online website or app orders?',
    options: [
      { text: 'Retail stores do not handle web orders; all online deliveries ship only from a central main godown.', score: 1 },
      { text: 'Store staff prints online order slips when free, manually packing items from shop shelves without special tools.', score: 2 },
      { text: 'Store staff uses a mobile app to pick and pack orders for customer store pickups—BOPIS (Buy Online, Pick Up In Store) or local parcel handover.', score: 3 },
      { text: 'The system routes online orders automatically to the nearest store with available stock for same-day local delivery via bike couriers (e.g., Dunzo, Porter, Shadowfax).', score: 4 },
    ],
    glossary: [
      { abbreviation: 'BOPIS', fullForm: 'Buy Online, Pick Up In Store' },
    ],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Operations',
    text: 'How do customers initiate and complete product returns and size exchanges?',
    options: [
      { text: 'Customers must call or email support for approval and courier the returned product back at their own expense.', score: 1 },
      { text: 'Staff checks return requests manually on email/WhatsApp, arranges courier pickup, and transfers bank refunds by hand.', score: 2 },
      { text: 'A self-service returns page on the website lets customers request reverse pickups and track replacement shipments automatically.', score: 3 },
      { text: 'An integrated return system enables instant drop-off at any physical retail store for online orders, instant exchanges, and instant UPI refunds.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Marketing',
    text: 'How do you plan store shelf displays, product visual placement, and counter assortments?',
    options: [
      { text: 'Store managers and floor staff arrange shelves and window mannequins based on personal taste.', score: 1 },
      { text: 'Head office sends PDF (Portable Document Format) display guidelines and photos for store staff to follow each season.', score: 2 },
      { text: 'Digital display layout software (Planogram) guides shelf arrangements, with store managers uploading photo proof through a mobile app.', score: 3 },
      { text: 'Sales data software analyzes local store billing speed and walk-in foot traffic to recommend exact shelf placement for high-margin products.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
      { abbreviation: 'Planogram', fullForm: 'Planogram' },
    ],
  },
  {
    domain: 'retail-e-commerce', pillar: 'Marketing',
    text: 'How do you test and improve your website sales conversion rate?',
    options: [
      { text: 'Our website layout is fixed and changes only when we do a complete website redesign.', score: 1 },
      { text: 'Design changes and banner updates are made based on internal team opinions without reviewing user click data.', score: 2 },
      { text: 'We run structured A/B Testing (split testing) on product pages, Add-to-Cart buttons, and checkout banners to improve sales conversions.', score: 3 },
      { text: 'Real-time AI tools automatically change homepage banners, search results, and recommended items tailored to each shopper\'s browsing behavior.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'A/B Testing', fullForm: 'A/B Testing' },
    ],
  },

  // ===== Franchise & Multi-Unit Chains =====
  {
    domain: 'franchise-multi-unit', pillar: 'Operations',
    text: 'How do you share standard operating rules and daily guidelines across all your franchise outlets or branches?',
    options: [
      { text: 'Physical paper files and printed registers are kept in the store office and updated by hand when new rules are issued.', score: 1 },
      { text: 'PDF (Portable Document Format) rulebooks and policy updates are emailed or shared on Google Drive / WhatsApp groups.', score: 2 },
      { text: 'A central digital operations app shares updated SOPs (Standard Operating Procedures), opening/closing checklists, and video training with read confirmation.', score: 3 },
      { text: 'An interactive operations app embeds micro-training directly into daily billing/staff workflows and automatically verifies store compliance.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
      { abbreviation: 'SOPs', fullForm: 'Standard Operating Procedures' },
    ],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Operations',
    text: 'How do area managers or audit teams conduct store quality and brand inspections?',
    options: [
      { text: 'Area managers conduct surprise informal visits without fixed inspection scorecards or standard grading checklists.', score: 1 },
      { text: 'Field supervisors use paper or Excel checklists and email summary reports back to the head office at week-end.', score: 2 },
      { text: 'Auditors use a mobile audit app with mandatory geo-tagged photos, time-stamping, and automated compliance scoring.', score: 3 },
      { text: 'A centralized quality platform links digital audit scores, customer feedback, and store device logs into automated corrective action plans.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Finances',
    text: 'How are franchisee royalty fees, central marketing fund cuts, and monthly billings managed?',
    options: [
      { text: 'Franchise owners report their monthly sales numbers over email/phone, and head office raises manual GST bills for royalty.', score: 1 },
      { text: 'Head office staff compiles store sales in Excel sheets manually and arranges bank transfers/cheque collections at month-end.', score: 2 },
      { text: 'Store billing software (POS) links directly to head office to calculate royalty and marketing cuts automatically based on verified sales.', score: 3 },
      { text: 'An automated portal tracks store-level unit economics live, executes automated bank auto-debits (NACH), and benchmarks net outlet margins.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'POS', fullForm: 'Point of Sale' },
      { abbreviation: 'NACH', fullForm: 'National Automated Clearing House' },
    ],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Operations',
    text: 'How are raw materials, ingredients, packing boxes, and store supplies procured across your network?',
    options: [
      { text: 'Individual outlet owners buy raw materials and supplies independently from their own local market vendors.', score: 1 },
      { text: 'Head office provides a list of approved vendors, but franchise owners place and manage purchase orders on their own.', score: 2 },
      { text: 'A central procurement portal requires all outlets to order through negotiated corporate vendor contracts and company depots.', score: 3 },
      { text: 'An automated supply network links store billing (POS) sales directly to central warehouses for predictive, JIT (Just-In-Time) replenishment.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'JIT', fullForm: 'Just-In-Time' },
    ],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Strategy',
    text: 'How do you compare and benchmark operational performance across different store locations?',
    options: [
      { text: 'Outlets operate in silos with no visibility into how they perform compared to other stores in the network.', score: 1 },
      { text: 'Head office shares a monthly ranking sheet on email/WhatsApp showing sales figures of top-performing stores.', score: 2 },
      { text: 'Standard digital dashboards let store managers view monthly rankings on sales, staff costs, and customer billing speed.', score: 3 },
      { text: 'Real-time business dashboards allow owners to compare hourly bill counts, staff productivity, and customer ratings against chain-wide averages.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Marketing',
    text: 'How do individual stores run local promotions while protecting brand consistency?',
    options: [
      { text: 'Store owners design and print their own banners, flyers, and social media posts without head office approval.', score: 1 },
      { text: 'Head office provides basic image templates and PDF creatives that store managers print or circulate locally.', score: 2 },
      { text: 'A brand marketing portal lets franchise owners customize pre-approved ad designs with their local address within strict brand rules.', score: 3 },
      { text: 'A central ad platform automates localized digital ad spend (Meta, Google Ads) and local WhatsApp campaigns tailored to each store\'s catchment radius.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Operations',
    text: 'How do you manage site selection, store interior fit-out, and project setup for new outlets?',
    options: [
      { text: 'New store openings are managed informally through phone calls and WhatsApp groups, frequently leading to launch delays.', score: 1 },
      { text: 'Project engineers track civil work, equipment purchasing, and staff recruitment using a master Excel checklist.', score: 2 },
      { text: 'Dedicated project software coordinates key milestones across commercial leasing, local government licensing (FSSAI / Trade License), civil work, and staff hiring.', score: 3 },
      { text: 'An automated critical-path tracking tool manages all internal teams and contractors, predicting opening delays and automating machine setup.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'FSSAI', fullForm: 'Food Safety and Standards Authority of India' },
    ],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'People',
    text: 'How do you onboard and train frontline floor staff, cooks, and cashiers across your outlets?',
    options: [
      { text: 'New hires shadow existing staff on the floor without structured training modules, checklists, or tests.', score: 1 },
      { text: 'Training is conducted using paper employee manuals and occasional in-person visits by a regional trainer.', score: 2 },
      { text: 'A mobile LMS (Learning Management System) delivers video training modules and tracks mandatory staff certifications.', score: 3 },
      { text: 'A gamified mobile app links with the staff biometric/face-attendance machine, requiring cleared skill modules before allowing shift punch-in.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'LMS', fullForm: 'Learning Management System' },
    ],
  },
  {
    domain: 'franchise-multi-unit', pillar: 'Marketing',
    text: 'How do you monitor and respond to online customer reviews (Google Maps, Swiggy, Zomato) across all branches?',
    options: [
      { text: 'Individual store managers check and reply to Google or food-delivery reviews only if and when they feel like it.', score: 1 },
      { text: 'Head office staff compiles customer complaints and review scores into a monthly report for regional heads.', score: 2 },
      { text: 'A central review management tool aggregates online ratings across all store locations and enforces a mandatory 24-hour reply policy.', score: 3 },
      { text: 'An AI (Artificial Intelligence) sentiment tool tracks review keywords in real time, automatically alerting field supervisors if food quality or hygiene issues spike at any branch.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
    ],
  },

  // ===== Hospitality, Food & Beverage =====
  {
    domain: 'hospitality_food_beverage', pillar: 'Operations',
    text: 'How do you manage table bookings, guest seating, and table turnover during busy meal times?',
    options: [
      { text: 'Floor staff writes bookings in a physical paper diary and assigns tables manually when guests arrive.', score: 1 },
      { text: 'We use an online reservation app (like Zomato or Dineout/Swiggy SteppinOut), but it is not linked to our billing counter.', score: 2 },
      { text: 'An integrated POS (Point of Sale) and table management system tracks live occupied tables, bill print times, and captain sections.', score: 3 },
      { text: 'Smart table management software manages table turnover live, predicts wait times, and reserves best tables based on guest spending history.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'POS', fullForm: 'Point of Sale' },
    ],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Finances',
    text: 'How do you track food raw material costs, recipe margins, and ingredient portions?',
    options: [
      { text: 'Food cost is roughly guessed at month-end based on total cash in bank and weekly sabzi/mandi/grocery bills.', score: 1 },
      { text: 'We calculate recipe costs in Excel sheets and update them only when major ingredient prices shoot up.', score: 2 },
      { text: 'Recipe management software connects with purchase bills to show theoretical consumption vs. actual raw material usage.', score: 3 },
      { text: 'The system reduces raw ingredient stock live as dishes are billed on the POS, automatically flagging kitchen prep wastage and vendor rate hikes.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Operations',
    text: 'How does kitchen staff receive and prioritize incoming food orders during rush hours?',
    options: [
      { text: 'Paper KOT (Kitchen Order Ticket) slips print at one counter and are clipped manually on a wire rail or wheel.', score: 1 },
      { text: 'Separate printers print paper KOT slips at specific stations (e.g., Tandoor, Curry, Chinese, and Bar counters).', score: 2 },
      { text: 'Digital KDS (Kitchen Display System) screens at every cook station show live order prep timers and pending items.', score: 3 },
      { text: 'A smart KDS coordinates cooking times across all stations automatically so starters and mains finish at the exact same moment without delay.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'KOT', fullForm: 'Kitchen Order Ticket' },
      { abbreviation: 'KDS', fullForm: 'Kitchen Display System' },
    ],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'People',
    text: 'How do you create staff duty rosters and control daily kitchen/service staff costs?',
    options: [
      { text: 'Duty rosters are handwritten on a paper chart and stuck on the kitchen staff notice board once a week.', score: 1 },
      { text: 'Managers make shift schedules in Excel sheets and share them via WhatsApp messages or printouts.', score: 2 },
      { text: 'A mobile staff scheduling app allows staff to view shifts and swap duties, tracking daily labor cost percentage against daily sales.', score: 3 },
      { text: 'Roster software predicts hourly dining rush using past sales trends and festival dates to build optimized staff rosters automatically.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Operations',
    text: 'How do you monitor refrigerator temperatures and maintain food safety and hygiene logs?',
    options: [
      { text: 'Staff fills out paper temperature log registers irregularly or from memory when health/food safety inspectors visit.', score: 1 },
      { text: 'Kitchen supervisors use manual digital thermometers and type temperatures into a tablet or register once or twice a day.', score: 2 },
      { text: 'Bluetooth digital probes record food and fridge temperatures directly into an FSSAI (Food Safety and Standards Authority of India) compliance app.', score: 3 },
      { text: '24/7 wireless IoT (Internet of Things) sensors track deep freezers and cold rooms, sending instant phone alerts if cooling drops.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'FSSAI', fullForm: 'Food Safety and Standards Authority of India' },
      { abbreviation: 'IoT', fullForm: 'Internet of Things' },
    ],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Marketing',
    text: 'How do you track regular guest preferences, food allergies, and VIP customers?',
    options: [
      { text: 'Customer preferences and likes/dislikes are remembered only by experienced captains or restaurant managers.', score: 1 },
      { text: 'Staff manually types notes (like "less spicy" or "Jain preparation") into customer remarks in the billing machine.', score: 2 },
      { text: 'A central guest database tags guest birthdays, anniversaries, spice preferences, allergies, and total billing history.', score: 3 },
      { text: 'A centralized CRM (Customer Relationship Management) tracks guest spend across all branches, sending automated dining follow-ups and personalized offers.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'CRM', fullForm: 'Customer Relationship Management' },
    ],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Finances',
    text: 'How do you manage bar inventory, open liquor bottles, and draft beer kegs?',
    options: [
      { text: 'Bartenders and managers visually guess the liquid left in open bottles by holding them up at closing time.', score: 1 },
      { text: 'Staff conducts weekly physical bottle counts and logs them manually in an excise stock register or Excel sheet.', score: 2 },
      { text: 'Barcode scanners and digital bottle-weighing scales compare actual liquid used against total drink pegs billed on the POS.', score: 3 },
      { text: 'Smart flow meters on beer taps and electronic bottle pourers measure exact millilitres poured and reconcile every drop directly with billed sales.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Technology',
    text: 'How do you handle online delivery orders from platforms like Swiggy and Zomato?',
    options: [
      { text: 'Staff keeps multiple separate tablets for each delivery app and punches orders manually into the main billing POS.', score: 1 },
      { text: 'A single aggregator tablet collects all orders, but staff still types the final bill into the store POS by hand.', score: 2 },
      { text: 'Direct API (Application Programming Interface) integrations push all Swiggy and Zomato orders straight into the POS and kitchen printers.', score: 3 },
      { text: 'An integrated delivery platform syncs live menu item availability, pauses online orders automatically during restaurant rush, and adjusts menu prices across apps.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'API', fullForm: 'Application Programming Interface' },
    ],
  },
  {
    domain: 'hospitality_food_beverage', pillar: 'Operations',
    text: 'How do you track and reduce kitchen food waste and raw vegetable/meat spoilage?',
    options: [
      { text: 'Spoiled raw materials and leftover customer food are thrown in the dustbin without measuring or recording.', score: 1 },
      { text: 'Cooks write down burned dishes, dropped plates, or expired items on a daily paper wastage sheet.', score: 2 },
      { text: 'Staff weighs food prep scrap on a digital scale and enters reason codes into the inventory system.', score: 3 },
      { text: 'An AI (Artificial Intelligence) food waste system scans discarded items, calculates the lost food profit margin, and adjusts daily kitchen prep quantities automatically.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'AI', fullForm: 'Artificial Intelligence' },
    ],
  },

  // ===== Fitness, Gym & Wellness Operations =====
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Finances',
    text: 'How do you collect monthly/annual membership fees and handle payment renewals?',
    options: [
      { text: 'Front desk staff collects cash, UPI transfers, or credit card swipes manually at the counter each month.', score: 1 },
      { text: 'Members are charged through basic recurring online payment links without automated tools to retry failed cards or payments.', score: 2 },
      { text: 'Gym management software handles automated e-NACH (electronic National Automated Clearing House) mandates, card billing, and automated payment reminder SMS (Short Message Service).', score: 3 },
      { text: 'An automated billing engine uses predictive retry logic and smart bank routing to collect failed membership payments without front-desk staff intervention.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'e-NACH', fullForm: 'electronic National Automated Clearing House' },
      { abbreviation: 'SMS', fullForm: 'Short Message Service' },
    ],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Operations',
    text: 'How do members book group classes (Zumba, CrossFit, Yoga, Spinning) and manage waitlists?',
    options: [
      { text: 'Members write their names in a physical register at the reception counter or join on a first-come, first-served walk-in basis.', score: 1 },
      { text: 'Class slots are booked through Google Forms or WhatsApp messages, and staff confirms seat availability manually.', score: 2 },
      { text: 'A branded gym mobile app lets members view slot schedules, book spots, join waitlists, and receive instant confirmation messages.', score: 3 },
      { text: 'A dynamic booking engine automatically moves waitlisted members into cancelled spots, enforces cancellation rules, and adjusts slot availability based on peak-hour demand.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Technology',
    text: 'How do members check in and enter your gym or fitness club?',
    options: [
      { text: 'Reception staff checks member names off a printed paper daily attendance register.', score: 1 },
      { text: 'Reception staff scans a physical plastic barcode card/key tag to confirm valid membership before allowing entry.', score: 2 },
      { text: 'Turnstiles or glass doors with RFID (Radio-Frequency Identification) cards, key fobs, or biometric fingerprint scanners log entry directly into the member database.', score: 3 },
      { text: 'Members enter using mobile app QR (Quick Response) codes, NFC (Near Field Communication), or facial recognition scanners that automatically block expired accounts and track live gym occupancy.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' },
      { abbreviation: 'QR', fullForm: 'Quick Response' },
      { abbreviation: 'NFC', fullForm: 'Near Field Communication' },
    ],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'People',
    text: 'How are Personal Training (PT) sessions, packages, and trainer timetables managed?',
    options: [
      { text: 'Personal trainers schedule workout sessions directly with clients over phone calls or WhatsApp without central management oversight.', score: 1 },
      { text: 'Front desk staff tracks trainer availability and booked client slots using a shared paper calendar or Excel sheet.', score: 2 },
      { text: 'Members book PT (Personal Training) packages and time slots through a self-service app that syncs with trainer calendars and deducts completed sessions.', score: 3 },
      { text: 'A smart scheduling engine matches client fitness goals with certified trainer specialties, balances floor hours, and automatically calculates trainer incentive commissions.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'PT', fullForm: 'Personal Training' },
    ],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Marketing',
    text: 'How do you onboard new gym members during their first 30 to 90 days to ensure they don\'t drop out?',
    options: [
      { text: 'New members receive their entry access and locker key with no structured follow-up, fitness assessment, or workout plan.', score: 1 },
      { text: 'General trainers offer a one-time verbal tour of gym equipment and cardio machines on the first day.', score: 2 },
      { text: 'New members enter an automated onboarding sequence with scheduled digital check-ins, diet guidance, and complimentary BMI (Body Mass Index) body-composition assessments.', score: 3 },
      { text: 'An automated app tracks member attendance frequency in real time, alerting floor coaches to intervene immediately if a member\'s weekly visits drop within the first 30 days.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'BMI', fullForm: 'Body Mass Index' },
    ],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Marketing',
    text: 'How do you track membership inquiry leads and convert trial passes into paid admissions?',
    options: [
      { text: 'Walk-in inquiry details are written on paper slips or register clipboards at the reception desk, and staff makes occasional follow-up calls.', score: 1 },
      { text: 'Walk-in and online lead contact numbers are saved in an Excel sheet, and sales staff sends manual WhatsApp messages and calls.', score: 2 },
      { text: 'A specialized fitness CRM (Customer Relationship Management) captures website and social media leads, triggering automated SMS and WhatsApp follow-up sequences.', score: 3 },
      { text: 'A multi-channel sales pipeline scores lead purchase intent, assigns high-potential walk-ins instantly to membership counselors, and tracks conversion ratios in real time.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'CRM', fullForm: 'Customer Relationship Management' },
    ],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Operations',
    text: 'How do you manage gym equipment maintenance, machine breakdowns, and service checks?',
    options: [
      { text: 'Treadmills, cables, or weight machines are repaired only after members complain that equipment is broken or noisy.', score: 1 },
      { text: 'Staff sticks a paper "Under Maintenance" sign on the machine and notes needed repairs in a manager\'s diary.', score: 2 },
      { text: 'Equipment has QR code stickers that members or staff can scan to report issues, logging repair tickets into a digital asset tracker.', score: 3 },
      { text: 'Smart connected cardio/strength machines stream live usage hours and error codes to maintenance teams for scheduled preventive part replacement before machines fail.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Technology',
    text: 'How do you track member workout progress, body transformations, and community challenges?',
    options: [
      { text: 'We do not offer digital workout tracking, transformation records, or club fitness challenges beyond occasional posters on the notice board.', score: 1 },
      { text: 'Trainers share general workout and diet tips through a monthly WhatsApp broadcast or email newsletter.', score: 2 },
      { text: 'A branded gym mobile app lets members log daily workout weights, track personal lifting records, and participate in monthly club leaderboard challenges.', score: 3 },
      { text: 'Connected smart watches and heart-rate straps feed real-time workout performance onto gym video screens, automatically awarding digital badges and reward points in the member app.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'fitness_gym_wellness_operations', pillar: 'Marketing',
    text: 'How do you identify members who are about to stop coming and manage membership cancellations?',
    options: [
      { text: 'Members stop coming without notice or sign physical paper cancellation forms, and reasons for leaving are not recorded.', score: 1 },
      { text: 'Management reviews monthly inactive member lists in Excel to see how many people dropped out.', score: 2 },
      { text: 'Automated workflows send feedback surveys to cancelling members and launch automated win-back WhatsApp discount offers after 45–60 days of non-attendance.', score: 3 },
      { text: 'Predictive retention software tracks declining visit patterns (e.g., visits dropping from 4 days a week to 1) to alert managers before the member decides to quit.', score: 4 },
    ],
    glossary: [],
  },

  // ===== Healthcare & Life Sciences Operations =====
  {
    domain: 'healthcare_life_sciences', pillar: 'Technology',
    text: 'How are patient medical case files, doctor prescriptions, and clinical histories maintained?',
    options: [
      { text: 'Physical paper files and OPD (Outpatient Department) slips are stored in record rooms/cabinets and pulled out manually for each visit.', score: 1 },
      { text: 'Scanned PDF (Portable Document Format) case records and doctor notes are saved in computer folders across local clinic desktop computers.', score: 2 },
      { text: 'A cloud-based EHR (Electronic Health Record) system manages clinical case sheets, diagnosis history, and digital e-prescriptions.', score: 3 },
      { text: 'An interoperable ABDM (Ayushman Bharat Digital Mission) compliant EHR system uses voice-to-text clinical notes and enables instant health data sharing across hospital networks.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'OPD', fullForm: 'Outpatient Department' },
      { abbreviation: 'PDF', fullForm: 'Portable Document Format' },
      { abbreviation: 'EHR', fullForm: 'Electronic Health Record' },
      { abbreviation: 'ABDM', fullForm: 'Ayushman Bharat Digital Mission' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Operations',
    text: 'How do patients book doctor appointments and complete reception registration?',
    options: [
      { text: 'Patients book appointments strictly by calling reception landlines/mobiles and fill out paper registration forms in the waiting area.', score: 1 },
      { text: 'Patients request appointments through a website contact form or WhatsApp, followed by staff confirmation phone calls.', score: 2 },
      { text: 'An online patient portal/app enables self-booking, sends automated SMS (Short Message Service) reminders, and collects pre-visit digital registration details.', score: 3 },
      { text: 'An automated scheduling platform manages doctor queue tokens live, handles dynamic waitlists, and runs instant TPA (Third-Party Administrator) insurance eligibility checks before arrival.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'SMS', fullForm: 'Short Message Service' },
      { abbreviation: 'TPA', fullForm: 'Third-Party Administrator' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Finances',
    text: 'How do you process medical insurance claims, cashless approvals, and claim rejections?',
    options: [
      { text: 'Staff fills physical claim forms by hand, couriers paper documents to insurance companies/TPAs, and tracks payments in manual registers.', score: 1 },
      { text: 'Claims are uploaded to separate TPA web portals manually, and rejected claims are tracked and followed up in Excel sheets.', score: 2 },
      { text: 'Specialized RCM (Revenue Cycle Management) software checks medical diagnosis codes (ICD-10) for billing errors before submission and tracks electronic payment settlements.', score: 3 },
      { text: 'An automated RCM engine predicts claim rejection risks prior to submission, automates pre-authorizations, and auto-generates appeal packages for common claim deductions.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RCM', fullForm: 'Revenue Cycle Management' },
      { abbreviation: 'ICD-10', fullForm: 'International Classification of Diseases, 10th Revision' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Technology',
    text: 'How do you protect patient medical privacy and maintain healthcare legal compliance?',
    options: [
      { text: 'Common, shared passwords are used across reception and nursing computers, and physical paper files are left accessible on desks.', score: 1 },
      { text: 'Staff attends annual data privacy training, and hospital computers have basic local login passwords and antivirus protection.', score: 2 },
      { text: 'Role-based login access (RBAC), encrypted digital databases, and activity access logs ensure strict patient record confidentiality.', score: 3 },
      { text: 'Real-time compliance monitoring software tracks network access 24/7, enforces zero-trust security permissions, and maintains immutable digital audit trails for every file opened.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RBAC', fullForm: 'Role-Based Access Control' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Technology',
    text: 'How do you deliver online doctor video consultations and telemedicine services?',
    options: [
      { text: 'Doctor consultations are conducted over regular phone calls or consumer WhatsApp voice calls without structured clinical notes.', score: 1 },
      { text: 'Doctors use standard consumer video apps (e.g., Google Meet, Zoom) that are disconnected from the patient\'s official hospital medical file.', score: 2 },
      { text: 'A secure, compliant telemedicine platform integrates video calls directly with doctor appointment calendars and digital e-prescription writing tools.', score: 3 },
      { text: 'A comprehensive virtual care system connects RPM (Remote Patient Monitoring) smart medical devices (BP, ECG, glucose) directly to automated doctor emergency alert screens.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RPM', fullForm: 'Remote Patient Monitoring' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Operations',
    text: 'How are diagnostic lab tests, pathology orders, and medical reports managed?',
    options: [
      { text: 'Staff writes paper lab test requisition slips by hand, and printed physical reports are collected and stapled into paper case sheets.', score: 1 },
      { text: 'Staff logs into third-party diagnostic lab portals to order tests and manually downloads PDF reports to email to patients.', score: 2 },
      { text: 'A two-way digital LIS (Laboratory Information System) pushes test orders automatically and attaches structured lab reports directly to the patient\'s digital file.', score: 3 },
      { text: 'An integrated lab system automatically flags abnormal critical test values, sends instant mobile alerts to attending doctors, and suggests follow-up clinical tests.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'LIS', fullForm: 'Laboratory Information System' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Operations',
    text: 'How do care teams follow up with patients after discharge, surgery, or major treatments?',
    options: [
      { text: 'Discharge summaries are given on printed papers verbally, with no systematic follow-up system or reminder calls.', score: 1 },
      { text: 'Ward nurses make manual follow-up phone calls to select high-risk post-surgery patients when daily hospital shifts allow.', score: 2 },
      { text: 'An automated patient portal delivers digital discharge summaries, test results, and sends automated SMS / WhatsApp recovery surveys.', score: 3 },
      { text: 'Automated digital recovery pathways deliver daily post-op care steps, track daily medicine adherence, and triage reported pain/fever symptoms for immediate doctor review.', score: 4 },
    ],
    glossary: [],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Operations',
    text: 'How do you manage in-house pharmacy medicines, surgical consumables, and vaccine stock?',
    options: [
      { text: 'Staff visually checks medicine cupboards/shelves and places replacement purchase orders only when stocks look empty.', score: 1 },
      { text: 'Staff manually writes medicine batch numbers, received quantities, and expiry dates in paper registers or Excel spreadsheets.', score: 2 },
      { text: 'Barcode-driven hospital pharmacy software tracks minimum safety stock levels, monitors batch expiry dates, and raises purchase orders automatically.', score: 3 },
      { text: 'Smart RFID (Radio-Frequency Identification) medicine cabinets and automated dispensing units track real-time drug consumption, maintain strict chain-of-custody, and prevent expired lot issuance.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'RFID', fullForm: 'Radio-Frequency Identification' },
    ],
  },
  {
    domain: 'healthcare_life_sciences', pillar: 'Operations',
    text: 'How are clinical errors, medical near-misses, and hospital quality standards (like NABH) tracked?',
    options: [
      { text: 'Accidental clinical errors and medicine near-misses are discussed verbally in meetings without any formal digital incident register.', score: 1 },
      { text: 'Staff fills out paper incident report sheets that are reviewed during monthly hospital management meetings.', score: 2 },
      { text: 'A digital incident management system tracks clinical adverse events, conducts root-cause reviews, and logs standard quality metrics for NABH (National Accreditation Board for Hospitals & Healthcare Providers) compliance.', score: 3 },
      { text: 'Real-time clinical surveillance software monitors patient vitals and lab trends automatically to flag clinical safety risks early and benchmark hospital quality scores live.', score: 4 },
    ],
    glossary: [
      { abbreviation: 'NABH', fullForm: 'National Accreditation Board for Hospitals & Healthcare Providers' },
    ],
  },
];

export { DATA, PILLAR_TO_CATEGORY };
