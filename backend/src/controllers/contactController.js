import Contact from '../models/Contact.js';
import { asyncHandler } from '../middleware/errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  const plus = /^\+/.test(input.trim()) ? '+' : '';
  return `${plus}${digits}`;
}

export const submitContact = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'A valid phone number is required' });
    }
    const contact = await Contact.create({
      email: normalizedEmail,
      phone: normalizedPhone,
      submittedAt: new Date(),
    });
    res.status(201).json({
      submitted: true,
      submittedAt: contact.submittedAt,
    });
  } catch (err) { next(err); }
};

export const listContacts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const contacts = await Contact.find({})
    .sort({ submittedAt: -1 })
    .limit(limit)
    .select('email phone submittedAt');
  res.json(contacts);
});
