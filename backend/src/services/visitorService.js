import crypto from 'node:crypto';
import VisitorRegistration from '../models/VisitorRegistration.js';
import { EVENT_START_AT, EVENT_END_AT, eventWindowStatus } from '../config/visitorEvent.js';

// Member directory mirroring the byrgopforms app (key → name + company). This is
// the backend source of truth used to denormalize member + company onto every
// saved registration, so the admin view never depends on client input for them.
export const MEMBERS = {
  vamshi: { name: 'Vamshi', company: 'V Soft' },
};

export function memberByKey(key) {
  return MEMBERS[key] || null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_BUSINESS = 200;
const MAX_CATEGORY = 120;
const MAX_PHONE = 20;

export class VisitorError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function randToken(bytes, prefix) {
  return `${prefix}${crypto.randomBytes(bytes).toString('base64url')}`;
}

function normalizePhone(input) {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) throw new VisitorError(400, 'A valid phone number is required for every visitor');
  if (trimmed.length > MAX_PHONE) throw new VisitorError(400, 'Phone number is too long');
  const plus = trimmed.startsWith('+') ? '+' : '';
  return `${plus}${digits}`;
}

function validateVisitorInput(input, index) {
  if (!input || typeof input !== 'object') throw new VisitorError(400, 'Visitor details are required');

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new VisitorError(400, `Visitor ${index + 1}: name is required`);
  if (name.length > MAX_NAME) throw new VisitorError(400, `Visitor ${index + 1}: name is too long`);

  const phone = normalizePhone(input.phone);

  let email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (email && !EMAIL_RE.test(email)) {
    throw new VisitorError(400, `Visitor ${index + 1}: a valid email address is required when provided`);
  }

  const businessName = typeof input.businessName === 'string' ? input.businessName.trim() : '';
  if (!businessName) throw new VisitorError(400, `Visitor ${index + 1}: business name is required`);
  if (businessName.length > MAX_BUSINESS) throw new VisitorError(400, `Visitor ${index + 1}: business name is too long`);

  const category = typeof input.category === 'string' ? input.category.trim() : '';
  if (!category) throw new VisitorError(400, `Visitor ${index + 1}: category is required`);
  if (category.length > MAX_CATEGORY) throw new VisitorError(400, `Visitor ${index + 1}: category is too long`);

  return { name, phone, email, businessName, category };
}

function eventBoundaryError(status) {
  if (status === 'closed') return new VisitorError(403, 'Visitor registration for the event has closed');
  if (status === 'not_started') return new VisitorError(403, 'Visitor registration has not opened yet');
  return null;
}

function qrStatusFor(visitor, now = new Date()) {
  if (now < EVENT_START_AT) return 'not_yet_valid';
  if (now > visitor.qrExpiresAt) return 'expired';
  return 'valid';
}

export async function registerVisitor({ memberKey, visitors: visitorsInput }) {
  const member = memberByKey(memberKey);
  if (!member) throw new VisitorError(400, 'Please choose a valid member');

  const status = eventWindowStatus();
  const boundaryErr = eventBoundaryError(status);
  if (boundaryErr) throw boundaryErr;

  if (!Array.isArray(visitorsInput) || visitorsInput.length < 1 || visitorsInput.length > 9) {
    throw new VisitorError(400, 'Register between 1 and 9 visitors at a time');
  }

  const now = new Date();
  const visitors = visitorsInput.map((v, i) => {
    const fields = validateVisitorInput(v, i);
    return {
      ...fields,
      visitorId: randToken(4, 'VIS-'),
      qrToken: randToken(24, ''),
      qrIssuedAt: now,
      qrExpiresAt: EVENT_END_AT,
      attendanceStatus: 'not_attended',
      attendedAt: null,
    };
  });

  const payload = {
    registrationId: randToken(4, 'REG-'),
    memberKey: memberKey,
    memberName: member.name,
    companyName: member.company,
    visitors,
    registeredAt: now,
  };

  // Unique-index collisions (crypto tokens) are vanishingly rare; retry once.
  try {
    const saved = await VisitorRegistration.create(payload);
    return saved;
  } catch (err) {
    if (err && err.code === 11000) {
      try {
        return await VisitorRegistration.create({
          ...payload,
          registrationId: randToken(4, 'REG-'),
          visitors: payload.visitors.map((v) => ({
            ...v,
            visitorId: randToken(4, 'VIS-'),
            qrToken: randToken(24, ''),
          })),
        });
      } catch (_) {
        throw new VisitorError(500, 'Could not save the registration — please try again');
      }
    }
    throw err;
  }
}

function toPublicVisitor(registration, visitor) {
  return {
    registrationId: registration.registrationId,
    memberKey: registration.memberKey,
    memberName: registration.memberName,
    companyName: registration.companyName,
    visitorId: visitor.visitorId,
    name: visitor.name,
    phone: visitor.phone,
    email: visitor.email || '',
    businessName: visitor.businessName,
    category: visitor.category,
    qrToken: visitor.qrToken,
    qrIssuedAt: visitor.qrIssuedAt,
    qrExpiresAt: visitor.qrExpiresAt,
    qrStatus: qrStatusFor(visitor),
    attendanceStatus: visitor.attendanceStatus,
    attendedAt: visitor.attendedAt,
  };
}

export function toRegistrationPublic(registration) {
  return {
    registrationId: registration.registrationId,
    memberKey: registration.memberKey,
    memberName: registration.memberName,
    companyName: registration.companyName,
    registeredAt: registration.registeredAt,
    visitors: registration.visitors.map((v) => toPublicVisitor(registration, v)),
  };
}

async function findRegistrationByVisitorSelector(predicate, errorMessage, errorStatus) {
  // Search across the $in of visitorId/qrToken with an aggregation-style lookup.
  // Use a reverse index scan: visitor ids and tokens are indexed at the
  // document level via single-field indexes on the subdocument array.
  const row = await VisitorRegistration.findOne({
    $or: [{ 'visitors.visitorId': predicate }, { 'visitors.qrToken': predicate }],
  });
  if (!row) throw new VisitorError(errorStatus || 404, errorMessage || 'Visitor not found');
  const visitor = row.visitors.find((v) => v.visitorId === predicate || v.qrToken === predicate);
  return { registration: row, visitor };
}

export async function getVisitorByVisitorId(visitorId) {
  const { registration, visitor } = await findRegistrationByVisitorSelector(visitorId, 'Visitor not found');
  return toPublicVisitor(registration, visitor);
}

export async function getVisitorByQrToken(token) {
  if (!token) throw new VisitorError(400, 'A QR token is required');
  const { registration, visitor } = await findRegistrationByVisitorSelector(token, 'Invalid QR code — please check with the registration desk');

  const now = new Date();
  const status = qrStatusFor(visitor, now);
  if (status === 'expired') throw new VisitorError(403, 'QR Code Expired');
  if (status === 'not_yet_valid') throw new VisitorError(403, 'QR Code is not yet valid');

  return toPublicVisitor(registration, visitor);
}

export async function markVisitorAttendance(token) {
  if (!token) throw new VisitorError(400, 'A QR token is required');

  const { registration, visitor } = await findRegistrationByVisitorSelector(token, 'Invalid QR code — please check with the registration desk');

  const now = new Date();
  const status = qrStatusFor(visitor, now);
  if (status === 'expired') throw new VisitorError(403, 'QR Code Expired');
  if (status === 'not_yet_valid') throw new VisitorError(403, 'QR Code is not yet valid');

  if (visitor.attendanceStatus === 'attended') {
    return {
      status: 'already',
      attendedAt: visitor.attendedAt,
      visitor: toPublicVisitor(registration, visitor),
    };
  }

  const updated = await VisitorRegistration.findOneAndUpdate(
    { _id: registration._id, 'visitors.visitorId': visitor.visitorId },
    {
      $set: {
        'visitors.$.attendanceStatus': 'attended',
        'visitors.$.attendedAt': now,
      },
    },
    { new: true }
  );
  if (!updated) throw new VisitorError(409, 'This QR code was already checked in');

  const updatedVisitor = updated.visitors.find((v) => v.visitorId === visitor.visitorId);
  return {
    status: 'success',
    attendedAt: updatedVisitor.attendedAt,
    visitor: toPublicVisitor(updated, updatedVisitor),
  };
}

// ─── Admin list + detail ───────────────────────────────

export async function listVisitorRegistrations({ search, attendance, member, qrValid, from, to, limit = 100, skip = 0 }) {
  const filter = {};
  const now = new Date();

  if (search) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { 'visitors.name': re },
      { 'visitors.phone': re },
      { 'visitors.email': re },
      { 'visitors.businessName': re },
      { 'visitors.category': re },
      { 'visitors.visitorId': re },
      { registrationId: re },
      { memberName: re },
      { companyName: re },
    ];
  }

  if (member) filter.memberKey = member;

  if (attendance === 'attended') filter['visitors.attendanceStatus'] = 'attended';
  else if (attendance === 'not_attended') filter['visitors.attendanceStatus'] = 'not_attended';

  // QR validity is a per-visitor property vs now; match the two boundary cases.
  if (qrValid === 'valid') filter['visitors.qrExpiresAt'] = { $gt: now };
  else if (qrValid === 'expired') filter['visitors.qrExpiresAt'] = { $lte: now };

  if (from || to) {
    filter.registeredAt = {};
    if (from) filter.registeredAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1); // inclusive end-of-day
      filter.registeredAt.$lte = toDate;
    }
  }

  const safeLimit = Math.min(Math.max(Math.floor(Number(limit) || 100), 1), 500);
  const safeSkip = Math.max(Math.floor(Number(skip) || 0), 0);

  const [rows, total] = await Promise.all([
    VisitorRegistration.find(filter)
      .sort({ registeredAt: -1 })
      .skip(safeSkip)
      .limit(safeLimit)
      .lean(),
    VisitorRegistration.countDocuments(filter),
  ]);

  const flattened = rows
    .flatMap((r) =>
      (r.visitors || []).map((v) => ({
        registrationId: r.registrationId,
        memberKey: r.memberKey,
        memberName: r.memberName,
        companyName: r.companyName,
        registeredAt: r.registeredAt,
        visitorId: v.visitorId,
        name: v.name,
        phone: v.phone,
        email: v.email || '',
        businessName: v.businessName,
        category: v.category,
        qrIssuedAt: v.qrIssuedAt,
        qrExpiresAt: v.qrExpiresAt,
        qrStatus: qrStatusFor(v, now),
        attendanceStatus: v.attendanceStatus,
        attendedAt: v.attendedAt,
      }))
    )
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

  return { registrations: flattened, total, limit: safeLimit, skip: safeSkip };
}

export async function getVisitorAdminDetail(visitorId) {
  const { registration, visitor } = await findRegistrationByVisitorSelector(visitorId, 'Visitor not found');
  return {
    registration: {
      registrationId: registration.registrationId,
      memberKey: registration.memberKey,
      memberName: registration.memberName,
      companyName: registration.companyName,
      registeredAt: registration.registeredAt,
      createdAt: registration.createdAt,
      visitorCount: registration.visitors.length,
      visitors: registration.visitors.map((v) => toPublicVisitor(registration, v)),
    },
    visitor: toPublicVisitor(registration, visitor),
  };
}