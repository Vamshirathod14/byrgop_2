import { readSheet, InvalidInputError, InvalidSpreadsheetError } from 'read-excel-file/node';
import writeExcelFile from 'write-excel-file/node';
import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';
import Domain from '../models/Domain.js';
import BusinessType from '../models/BusinessType.js';
import KYCategory from '../models/KYCategory.js';
import { logAudit, auditFrom } from '../services/auditService.js';

const TEMPLATE_COLUMNS = [
  'Domain',
  'Question',
  'Option A',
  'Score A',
  'Option B',
  'Score B',
  'Option C',
  'Score C',
  'Option D',
  'Score D',
  'Active',
  'Category',
  'Business Type',
];

const BUSINESS_TYPE_KEYS = ['service', 'product', 'ngo'];

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function parseScore(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 4) return null;
  return num;
}

function parseActive(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toUpperCase();
    if (v === 'TRUE' || v === 'YES' || v === '1') return true;
    if (v === 'FALSE' || v === 'NO' || v === '0') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

function cell(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

// GET /admin/know-yourself/template – generates BYRGOP_Question_Template.xlsx
export async function downloadKYQuestionTemplate(_req, res) {
  const domains = await Domain.find({}).lean();
  const categories = await KYCategory.find({ active: true }).lean();
  const domainNames = domains.slice(0, 5).map((d) => d.name);
  const catName = categories.length > 0 ? categories[0].name : 'Strategic Direction';

  const EXAMPLE_ROWS = [
    [
      '',
      'Do you have a documented long-term strategy?',
      'Yes, reviewed quarterly', 4,
      'Defined but rarely revisited', 3,
      'Informal, in leadership heads', 2,
      'No defined strategy', 1,
      'TRUE', catName, '',
    ],
    [
      domainNames[0] || 'Manufacturing & Industrial Operations',
      'How well do you track cash flow for this domain?',
      'Monthly with accurate forecasts', 4,
      'Quarterly with rough estimates', 3,
      'About once a year', 2,
      'Not tracked systematically', 1,
      'TRUE', catName, '',
    ],
    [
      domainNames[0] || 'Manufacturing & Industrial Operations',
      'How effective is your sales pipeline in this market?',
      'Predictable pipeline with consistent conversion', 4,
      'Active pipeline but uneven conversion', 3,
      'Reactive, mostly referrals', 2,
      'No structured sales process', 1,
      'TRUE', catName, '',
    ],
  ];

  const sheetData = [TEMPLATE_COLUMNS, ...EXAMPLE_ROWS];
  const buffer = await writeExcelFile(sheetData, {
    sheet: 'Questions',
    columns: [
      { width: 36 }, { width: 60 }, { width: 40 }, { width: 8 }, { width: 40 },
      { width: 8 }, { width: 40 }, { width: 8 }, { width: 40 }, { width: 8 },
      { width: 8 }, { width: 24 }, { width: 16 },
    ],
  }).toBuffer();
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="BYRGOP_Know_Yourself_Questions_Template.xlsx"'
  );
  res.send(buffer);
}

async function processWorkbook(fileBuffer, { dryRun }) {
  // Reads the first sheet — same first-sheet behavior as the previous reader.
  const rows = await readSheet(fileBuffer);

  if (rows.length < 2) {
    return {
      preview: dryRun,
      importable: false,
      totalRows: 0,
      valid: 0,
      invalid: 0,
      rows: [],
      errors: ['Excel file has no data rows (header only or empty).'],
    };
  }

  // Map column names to indices (case-insensitive)
  const headerMap = rows[0].map((h) => cell(h).toLowerCase());
  const getIndex = (name) => headerMap.indexOf(name.toLowerCase());

  const colDomain = getIndex('domain');
  const colQuestion = getIndex('question');
  const colOptionA = getIndex('option a');
  const colScoreA = getIndex('score a');
  const colOptionB = getIndex('option b');
  const colScoreB = getIndex('score b');
  const colOptionC = getIndex('option c');
  const colScoreC = getIndex('score c');
  const colOptionD = getIndex('option d');
  const colScoreD = getIndex('score d');
  const colActive = getIndex('active');
  const colCategory = getIndex('category');
  const colBusinessType = getIndex('business type');

  if (colQuestion < 0 || colOptionA < 0 || colOptionB < 0 || colOptionC < 0 || colOptionD < 0) {
    return {
      preview: dryRun,
      importable: false,
      totalRows: 0,
      valid: 0,
      invalid: rows.length - 1,
      rows: [],
      errors: [
        'Missing required column(s). Expected headers: Domain, Question, Option A, Score A, Option B, Score B, Option C, Score C, Option D, Score D, Active.',
      ],
    };
  }

  // Domains always come from the Domains collection (admin-managed), never a
  // hardcoded list. Match by slug or by display name, case-insensitive.
  const domainDocs = await Domain.find({}).lean();
  const bySlug = new Map();
  const byName = new Map();
  for (const d of domainDocs) {
    bySlug.set(d.slug.trim().toLowerCase(), d);
    byName.set(d.name.trim().toLowerCase(), d);
  }

  function resolveDomain(raw) {
    const value = cell(raw);
    if (!value) return { slug: null };
    const doc = bySlug.get(value.toLowerCase()) || byName.get(value.toLowerCase());
    if (!doc) return { error: value };
    return { slug: doc.slug };
  }

  // Categories come from the managed KYCategory configuration (never hardcoded).
  const categoryDocs = await KYCategory.find({}).lean();
  const catByKey = new Map(categoryDocs.map((c) => [c.key.toLowerCase(), c]));
  const catByName = new Map(categoryDocs.map((c) => [c.name.trim().toLowerCase(), c]));

  function resolveCategory(raw) {
    const value = cell(raw);
    if (!value) return { key: null }; // optional column
    const doc = catByKey.get(value.toLowerCase()) || catByName.get(value.toLowerCase());
    if (!doc) return { error: value };
    return { key: doc.key };
  }

  function resolveBusinessType(raw) {
    const value = cell(raw).toLowerCase();
    if (!value) return { value: null };
    if (BUSINESS_TYPE_KEYS.includes(value)) return { value };
    return { error: value };
  }

  // Build domain→businessType lookup for hierarchy validation.
  const domainBtMap = new Map(
    domainDocs.map((d) => [d.slug, d.businessTypeId ? String(d.businessTypeId) : null])
  );
  const btDocs = await BusinessType.find({}).lean();
  const btById = new Map(btDocs.map((b) => [String(b._id), b]));

  // Existing active questions are used for duplicate detection only – they are
  // never modified by an import.
  const existingQuestions = await KnowYourselfQuestion.find({ active: true }).lean();
  const existingKeys = new Set(
    existingQuestions.map((q) => `${q.domain || 'generic'}|${q.text.trim().toLowerCase()}`)
  );

  const errors = [];
  const parsedRows = [];
  const validRows = [];
  const fileKeys = new Set();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const isEmpty = row.every((c) => c == null || cell(c) === '');
    if (isEmpty) continue;

    const questionText = cell(row[colQuestion]);
    const domainCell = colDomain >= 0 ? row[colDomain] : undefined;
    const activeValue = colActive >= 0 ? row[colActive] : undefined;

    const optionA = cell(row[colOptionA]);
    const optionB = cell(row[colOptionB]);
    const optionC = cell(row[colOptionC]);
    const optionD = cell(row[colOptionD]);

    const scoreAValue = parseScore(colScoreA >= 0 ? row[colScoreA] : undefined);
    const scoreBValue = parseScore(colScoreB >= 0 ? row[colScoreB] : undefined);
    const scoreCValue = parseScore(colScoreC >= 0 ? row[colScoreC] : undefined);
    const scoreDValue = parseScore(colScoreD >= 0 ? row[colScoreD] : undefined);

    const issues = [];

    if (!questionText) issues.push('Question text is required');

    let domainSlug = null;
    let questionType = 'generic';
    const resolved = resolveDomain(domainCell);
    if (resolved.error) {
      issues.push(
        `Unknown domain "${resolved.error}". Use a domain slug from Admin → Domains (e.g. ${[...bySlug.keys()].slice(0, 3).join(', ')})`
      );
    } else if (resolved.slug) {
      domainSlug = resolved.slug;
      questionType = 'domain';
    }

    let categoryKey = null;
    const resolvedCategory = resolveCategory(colCategory >= 0 ? row[colCategory] : undefined);
    if (resolvedCategory.error) {
      issues.push(`Unknown category "${resolvedCategory.error}". Use one from Admin → KY Result Categories.`);
    } else if (resolvedCategory.key) {
      categoryKey = resolvedCategory.key;
    }

    let rowBusinessType = null;
    const resolvedBt = resolveBusinessType(colBusinessType >= 0 ? row[colBusinessType] : undefined);
    if (resolvedBt.error) {
      issues.push(`Invalid business type "${resolvedBt.error}". Use service, product or ngo.`);
    } else if (resolvedBt.value) {
      rowBusinessType = resolvedBt.value;
    }

    // Hierarchy check: domain questions with a business type must belong to it.
    if (domainSlug && rowBusinessType && domainBtMap.has(domainSlug)) {
      const domainBtId = domainBtMap.get(domainSlug);
      if (domainBtId) {
        const domainBtDoc = btById.get(domainBtId);
        if (domainBtDoc && domainBtDoc.key !== rowBusinessType) {
          issues.push(
            `Domain "${domainSlug}" belongs to "${domainBtDoc.name}", not "${rowBusinessType}".`
          );
        }
      }
    }

    const optionChecks = [
      ['Option A', optionA, scoreAValue],
      ['Option B', optionB, scoreBValue],
      ['Option C', optionC, scoreCValue],
      ['Option D', optionD, scoreDValue],
    ];
    for (const [label, text, score] of optionChecks) {
      if (!text) issues.push(`${label} text is required`);
      else if (score === null) issues.push(`Score ${label.slice(-1)} must be an integer 1-4`);
    }

    if (!issues.length) {
      const key = `${domainSlug || 'generic'}|${questionText.toLowerCase()}`;
      if (existingKeys.has(key) || fileKeys.has(key)) {
        issues.push('Duplicate question (already exists or repeated in this file)');
      } else {
        fileKeys.add(key);
      }
    }

    const parsedRow = {
      row: rowNum,
      domain: domainSlug,
      type: questionType,
      question: questionText,
      ok: issues.length === 0,
      issues,
    };
    parsedRows.push(parsedRow);

    if (issues.length === 0) {
      validRows.push({
        text: questionText,
        type: questionType,
        domain: domainSlug,
        category: categoryKey,
        businessType: rowBusinessType,
        active: parseActive(activeValue),
        options: optionChecks.map(([label, text, score]) => ({
          text,
          score,
          active: true,
          _label: label,
        })),
      });
    } else {
      errors.push({ row: rowNum, issues });
    }
  }

  const importedCount = validRows.length;
  const invalidCount = errors.length;

  // Any invalid row blocks the whole import (atomic).
  if (dryRun || invalidCount > 0) {
    return {
      preview: true,
      importable: invalidCount === 0 && importedCount > 0,
      totalRows: parsedRows.length,
      valid: importedCount,
      invalid: invalidCount,
      rows: parsedRows,
      errors,
      ...(invalidCount > 0
        ? { message: `${invalidCount} invalid row(s). Nothing was imported.` }
        : {}),
    };
  }

  const questionsToInsert = validRows.map((q) =>
    KnowYourselfQuestion({
      text: q.text,
      type: q.type,
      domain: q.domain,
      category: q.category,
      businessType: q.businessType,
      options: q.options.map(({ _label, ...o }) => o),
      active: q.active,
    })
  );

  try {
    await KnowYourselfQuestion.insertMany(questionsToInsert, { ordered: false });
    return {
      imported: importedCount,
      valid: importedCount,
      invalid: 0,
      message: `${importedCount} question(s) imported successfully`,
    };
  } catch (err) {
    return {
      imported: 0,
      valid: 0,
      invalid: importedCount,
      errors: [{ row: 0, issues: [err.message || 'Failed to import questions'] }],
      message: 'Failed to import questions',
    };
  }
}

// POST /admin/know-yourself/bulk-upload (multipart, field "file")
//   ?preview=true → validate + return parsed rows without importing
export async function bulkUploadKnowYourselfQuestions(req, res, next) {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res
        .status(400)
        .json({ error: 'No Excel file uploaded. Attach the .xlsx file as the "file" field.' });
    }
    const dryRun = req.query.preview === 'true';
    const result = await processWorkbook(req.file.buffer, { dryRun });
    if (!dryRun && result.imported > 0) {
      await logAudit({
        ...auditFrom(req),
        action: 'ky_question.bulk_imported',
        entity: 'ky_question',
        metadata: { imported: result.imported, fileName: req.file.originalname },
      });
    }
    res.json(result);
  } catch (err) {
    // The Excel reader throws InvalidInputError / InvalidSpreadsheetError on
    // corrupt or non-.xlsx files; surface those as a 400 with guidance.
    if (
      err instanceof InvalidInputError ||
      err instanceof InvalidSpreadsheetError ||
      /Cannot read|corrupt|invalid/i.test(err.message || '')
    ) {
      return res.status(400).json({ error: 'Could not read the Excel file. Please use the template as a guide.' });
    }
    next(err);
  }
}
