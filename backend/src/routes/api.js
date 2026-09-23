import { Router } from 'express';
import multer from 'multer';
import { startAssessment, nextQuestion, recordQuestionTimeout, answerQuestion, assessmentResult } from '../controllers/assessmentController.js';
import { getOnboardingConfig } from '../controllers/onboardingController.js';
import { requireAdminAuth, requirePermission, isSuperAdmin } from '../middleware/adminAuth.js';
import { login, logout, me, loginRateLimiter } from '../controllers/adminAuthController.js';
import { listAdmins, getAdmin, createAdmin, updateAdmin, setAdminStatus, setAdminPermissions, deleteAdmin } from '../controllers/adminController.js';
import { dashboard } from '../controllers/dashboardController.js';
import { listActivity } from '../controllers/activityController.js';
import { analytics } from '../controllers/analyticsController.js';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { listStages, getStage, createStage, updateStage, deleteStage } from '../controllers/stageController.js';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  setQuestionActive,
  deleteQuestion,
} from '../controllers/onboardingQuestionController.js';
import { listResults, createResult, updateResult, deleteResult } from '../controllers/resultController.js';
import { listSessions, getSession, sessionStats } from '../controllers/sessionController.js';
import { listKYQuestions, getKYQuestion, createKYQuestion, updateKYQuestion, deleteKYQuestion, listKYDomains } from '../controllers/knowYourselfController.js';
import { startKYSession, startKYAssignment, resumeKYAssignment, getKYQuestion as getKYSessionQuestion, submitKYAnswer, getKYResult, submitKYContact, submitKYEmail, submitKYProBono, submitKYReportRequest, listKYSessions, getKYMeta } from '../controllers/knowYourselfSessionController.js';
import { listKYCategories, createKYCategory, updateKYCategory, reorderKYCategories, deleteKYCategory } from '../controllers/kyCategoryController.js';
import { listActiveDomains, listAdminDomains, getAdminDomain, createDomain, updateDomain, deleteDomain } from '../controllers/domainController.js';
import { listBusinessTypes, getBusinessType, createBusinessType, updateBusinessType, deleteBusinessType } from '../controllers/businessTypeController.js';
import { submitContact, listContacts } from '../controllers/contactController.js';
import { adminListVisitors, adminVisitorDetail } from '../controllers/visitorController.js';
import visitorRoutes from './visitorRoutes.js';
import { bulkUploadKnowYourselfQuestions, downloadKYQuestionTemplate } from '../controllers/bulkUploadController.js';

const router = Router();

// Know Yourself bulk upload – Excel files are held in memory only
const kyExcelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okName = /\.xlsx$/i.test(file.originalname || '');
    const okMime =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/octet-stream' ||
      file.mimetype === '';
    if (okName && okMime) return cb(null, true);
    const err = new Error('Only .xlsx Excel files are allowed');
    err.status = 400;
    cb(err);
  },
});

// ─── Public endpoints ─────────────────────────────────────
router.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

router.post('/assessments', startAssessment);
router.get('/assessments/onboarding', getOnboardingConfig);
router.get('/assessments/:sessionId/next/:category', nextQuestion);
router.post('/assessments/:sessionId/timeout', recordQuestionTimeout);
router.post('/assessments/:sessionId/answer', answerQuestion);
router.get('/assessments/:sessionId/result', assessmentResult);

// Know Yourself – public assessment
router.get('/domains', listActiveDomains);
router.get('/know-yourself/domains', listKYDomains);
router.get('/know-yourself/meta', getKYMeta);
router.post('/know-yourself', startKYSession);
router.post('/know-yourself/assignment', startKYAssignment);
router.get('/know-yourself/resume', resumeKYAssignment);
router.get('/know-yourself/:sessionId/question/:index', getKYSessionQuestion);
router.post('/know-yourself/:sessionId/answer', submitKYAnswer);
router.post('/know-yourself/:sessionId/contact', submitKYContact);
router.post('/know-yourself/:sessionId/email', submitKYEmail);
router.post('/know-yourself/:sessionId/pro-bono', submitKYProBono);
router.post('/know-yourself/:sessionId/report-request', submitKYReportRequest);
router.get('/know-yourself/:sessionId/result', getKYResult);

// General website contact (independent of any assessment session)
router.post('/contact', submitContact);

// Visitor registration + QR check-in (12th Anniversary). Public registration
// lives here; token resolution + attendance are guarded inside visitorRoutes.
router.use('/visitors', visitorRoutes);

// ─── Admin auth (public) ──────────────────────────────────
router.post('/admin/auth/login', loginRateLimiter, login);
router.post('/admin/auth/logout', requireAdminAuth, logout);
router.get('/admin/auth/me', requireAdminAuth, me);

// ─── Admin backend (JWT protected) ──────────────────────
// Everything below requireAdminAuth runs through the guard.
router.use(['/admin'], requireAdminAuth);

// Overview
router.get('/admin/dashboard', requirePermission('dashboard.view'), dashboard);
router.get('/admin/analytics', requirePermission('dashboard.view'), analytics);
router.get('/admin/activity', requirePermission('audit.view'), listActivity);

// Admin management (SUPER_ADMIN only)
router.get('/admin/admins', isSuperAdmin, listAdmins);
router.get('/admin/admins/:id', isSuperAdmin, getAdmin);
router.post('/admin/admins', isSuperAdmin, createAdmin);
router.put('/admin/admins/:id', isSuperAdmin, updateAdmin);
router.patch('/admin/admins/:id/status', isSuperAdmin, setAdminStatus);
router.patch('/admin/admins/:id/permissions', isSuperAdmin, setAdminPermissions);
router.delete('/admin/admins/:id', isSuperAdmin, deleteAdmin);

// Stats
router.get('/admin/stats', requirePermission('dashboard.view'), sessionStats);
router.get('/admin/sessions', requirePermission('sessions.view'), listSessions);
router.get('/admin/sessions/:id', requirePermission('sessions.view'), getSession);

router.get('/admin/categories', requirePermission('domains.view'), listCategories);
router.get('/admin/categories/:id', requirePermission('domains.view'), getCategory);
router.post('/admin/categories', requirePermission('domains.manage'), createCategory);
router.put('/admin/categories/:id', requirePermission('domains.manage'), updateCategory);
router.delete('/admin/categories/:id', requirePermission('domains.manage'), deleteCategory);

// Domains – Know Yourself business domains
router.get('/admin/domains', requirePermission('domains.view'), listAdminDomains);
router.get('/admin/domains/:id', requirePermission('domains.view'), getAdminDomain);
router.post('/admin/domains', requirePermission('domains.manage'), createDomain);
router.put('/admin/domains/:id', requirePermission('domains.manage'), updateDomain);
router.delete('/admin/domains/:id', requirePermission('domains.manage'), deleteDomain);

// Business types – hierarchy root (BusinessType → Domain → Question)
router.get('/admin/business-types', requirePermission('domains.view'), listBusinessTypes);
router.get('/admin/business-types/:id', requirePermission('domains.view'), getBusinessType);
router.post('/admin/business-types', requirePermission('domains.manage'), createBusinessType);
router.put('/admin/business-types/:id', requirePermission('domains.manage'), updateBusinessType);
router.delete('/admin/business-types/:id', requirePermission('domains.manage'), deleteBusinessType);

router.get('/admin/stages', requirePermission('stages.manage'), listStages);
router.get('/admin/stages/:id', requirePermission('stages.manage'), getStage);
router.post('/admin/stages', requirePermission('stages.manage'), createStage);
router.put('/admin/stages/:id', requirePermission('stages.manage'), updateStage);
router.delete('/admin/stages/:id', requirePermission('stages.manage'), deleteStage);

// Intro onboarding question bank (dedicated endpoints, strictly businessType-scoped).
// All list/CRUD operations require an explicit ?businessType= / body businessType
// so onboarding questions are managed, and served, per business type only.
router.get('/admin/onboarding-questions', requirePermission('questions.view'), listQuestions);
router.get('/admin/onboarding-questions/:id', requirePermission('questions.view'), getQuestion);
router.post('/admin/onboarding-questions', requirePermission('questions.create'), createQuestion);
router.put('/admin/onboarding-questions/:id', requirePermission('questions.edit'), updateQuestion);
router.patch('/admin/onboarding-questions/:id/status', requirePermission('questions.edit'), setQuestionActive);
router.delete('/admin/onboarding-questions/:id', requirePermission('questions.delete'), deleteQuestion);

router.get('/admin/results', requirePermission('results.manage'), listResults);
router.post('/admin/results', requirePermission('results.manage'), createResult);
router.put('/admin/results/:id', requirePermission('results.manage'), updateResult);
router.delete('/admin/results/:id', requirePermission('results.manage'), deleteResult);

// Know Yourself – admin CRUD
router.get('/admin/know-yourself/sessions', requirePermission('contacts.view'), listKYSessions);
router.get('/admin/know-yourself/template', requirePermission('questions.view'), downloadKYQuestionTemplate);
router.get('/admin/contacts', requirePermission('contacts.view'), listContacts);
// NOTE: literal paths must be registered before "/admin/know-yourself/:id"
router.get('/admin/know-yourself/categories', requirePermission('questions.view'), listKYCategories);
router.post('/admin/know-yourself/categories', requirePermission('results.manage'), createKYCategory);
router.put('/admin/know-yourself/categories/reorder', requirePermission('results.manage'), reorderKYCategories);
router.put('/admin/know-yourself/categories/:id', requirePermission('results.manage'), updateKYCategory);
router.delete('/admin/know-yourself/categories/:id', requirePermission('results.manage'), deleteKYCategory);
router.get('/admin/know-yourself', requirePermission('questions.view'), listKYQuestions);
router.get('/admin/know-yourself/:id', requirePermission('questions.view'), getKYQuestion);
router.post('/admin/know-yourself', requirePermission('questions.create'), createKYQuestion);
router.put('/admin/know-yourself/:id', requirePermission('questions.edit'), updateKYQuestion);
router.delete('/admin/know-yourself/:id', requirePermission('questions.delete'), deleteKYQuestion);

// Bulk upload Excel for Know Yourself questions (admin only)
// multipart/form-data with field name "file"; add ?preview=true to validate without importing
router.post(
  '/admin/know-yourself/bulk-upload',
  requirePermission('questions.bulk_upload'),
  kyExcelUpload.single('file'),
  bulkUploadKnowYourselfQuestions
);

// Visitors (12th Anniversary) – admin list + detail
router.get('/admin/visitors', requirePermission('contacts.view'), adminListVisitors);
router.get('/admin/visitors/:visitorId', requirePermission('contacts.view'), adminVisitorDetail);

export default router;