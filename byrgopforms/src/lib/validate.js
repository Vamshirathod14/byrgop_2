// Per-visitor validation helpers shared by the registration form.
export const PHONE_RE = /^[+]?[0-9\s()-]{7,15}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(value) {
  const v = (value || '').trim();
  const digits = v.replace(/\D/g, '');
  if (!v) return 'Phone is required';
  if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number';
  return '';
}

export function validateEmail(value) {
  const v = (value || '').trim();
  if (!v) return ''; // optional
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
}

export function validateName(value) {
  return (value || '').trim() ? '' : 'Name is required';
}

export function validateBusiness(value) {
  return (value || '').trim() ? '' : 'Business name is required';
}

export function validateCategory(value) {
  return (value || '').trim() ? '' : 'Category is required';
}

export function validateVisitor(v) {
  return {
    name: validateName(v.name),
    phone: validatePhone(v.phone),
    email: validateEmail(v.email),
    businessName: validateBusiness(v.businessName),
    category: validateCategory(v.category),
  };
}

export function isVisitorValid(v) {
  const e = validateVisitor(v);
  return !Object.values(e).some(Boolean);
}

export function blankVisitor() {
  return { name: '', phone: '', email: '', businessName: '', category: '' };
}

// Sanitizes a visitor name into a safe single-line PNG file name.
export function safePngName(name) {
  const base = (name || '')
    .trim()
    .replace(/[^\p{L}\p{N} _-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'Visitor';
}