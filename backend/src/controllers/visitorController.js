import {
  registerVisitor,
  getVisitorByVisitorId,
  getVisitorByQrToken,
  markVisitorAttendance,
  listVisitorRegistrations,
  getVisitorAdminDetail,
  toRegistrationPublic,
} from '../services/visitorService.js';
import { sendVisitorQrEmails } from '../services/visitorEmailService.js';

// Public registration — self-serve by the guest at the venue.
export async function submitVisitorRegistration(req, res, next) {
  try {
    const registration = await registerVisitor(req.body || {});
    // QR emails are best-effort and isolated: they must never fail or slow the
    // response. Log quietly so delivery issues are observable.
    sendVisitorQrEmails({ registration })
      .then((results) => {
        const failed = results.filter((r) => r.skipped && r.reason === 'SMTP not configured');
        const sentCount = results.filter((r) => r.sent).length;
        if (sentCount) console.log(`[visitor-mail] QR emails sent: ${sentCount}`);
        if (failed.length) console.log('[visitor-mail] SMTP not configured — QR emails skipped');
      })
      .catch((err) => console.error('[visitor-mail] unexpected error:', err.message));

    res.status(201).json(toRegistrationPublic(registration));
  } catch (err) {
    next(err);
  }
}

// Look up a single visitor by visitorId (admin/staff only).
export async function getVisitor(req, res, next) {
  try {
    const visitor = await getVisitorByVisitorId(req.params.visitorId);
    res.json({ visitor });
  } catch (err) {
    next(err);
  }
}

// Resolve a QR token to visitor details (staff check-in app only).
export async function resolveQr(req, res, next) {
  try {
    const visitor = await getVisitorByQrToken(req.params.token);
    res.json({ visitor });
  } catch (err) {
    next(err);
  }
}

// Mark attendance for a valid QR token (staff check-in app only).
export async function attendance(req, res, next) {
  try {
    const result = await markVisitorAttendance(req.params.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Admin list with filters + pagination.
export async function adminListVisitors(req, res, next) {
  try {
    const data = await listVisitorRegistrations({
      search: req.query.search,
      attendance: req.query.attendance,
      member: req.query.member,
      qrValid: req.query.qrValid,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
      skip: req.query.skip,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Admin detail for a single visitor.
export async function adminVisitorDetail(req, res, next) {
  try {
    const detail = await getVisitorAdminDetail(req.params.visitorId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}