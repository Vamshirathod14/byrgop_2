import { useMemo, useState } from 'react';
import { visitorApi } from '../lib/api.js';
import { MEMBERS } from '../lib/members.js';
import {
  blankVisitor,
  isVisitorValid,
  validateVisitor,
} from '../lib/validate.js';
import Field from '../components/Field.jsx';

const COUNT_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 1);

export default function RegistrationScreen({ onRegistered }) {
  const [memberKey, setMemberKey] = useState('');
  const [count, setCount] = useState('');
  const [visitors, setVisitors] = useState([blankVisitor()]);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const member = useMemo(() => MEMBERS.find((m) => m.key === memberKey) || null, [memberKey]);

  // Derived validity for every row; recomputed on each render so the submit
  // button stays disabled until the entire form is clean.
  const rowErrors = useMemo(() => visitors.map(validateVisitor), [visitors]);
  const allValid = visitors.every((v) => isVisitorValid(v));

  const setVisitorValue = (index, key, value) => {
    setVisitors((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));
  };

  const onCountChange = (e) => {
    const next = Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 9);
    setCount(next);
    setVisitors((prev) => {
      const copy = prev.slice(0, next);
      while (copy.length < next) copy.push(blankVisitor());
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttempted(true);
    if (!allValid || !member || !count) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        memberKey: member.key,
        memberEmail: member.email,
        visitors: visitors.map((v) => ({
          name: v.name.trim(),
          phone: v.phone.trim(),
          email: v.email.trim() || undefined,
          businessName: v.businessName.trim(),
          category: v.category.trim(),
        })),
      };
      const data = await visitorApi.register(payload);
      onRegistered(data);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showError = (index, field) => attempted || (visitors[index]?.[field] || '').trim() !== '';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="card">
        <Field label="Member" required htmlFor="member">
          <select
            id="member"
            className="select"
            value={memberKey}
            onChange={(e) => setMemberKey(e.target.value)}
          >
            <option value="" disabled>
              Select BNI Member
            </option>
            {MEMBERS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name} → {m.company}
              </option>
            ))}
          </select>
          {member && (
            <div className="help">
              Company: <strong>{member.company}</strong>
            </div>
          )}
          {member?.email && (
            <div className="help">
              Registered member email: <strong>{member.email}</strong>
            </div>
          )}
        </Field>

        <Field
          label="How many visitors?"
          required
          htmlFor="visitor-count"
          help="Select the number of visitors you are registering together (1–9)."
        >
          <select id="visitor-count" className="select" value={count} onChange={onCountChange}>
            <option value="" disabled>
              Select Number of Visitors
            </option>
            {COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'visitor' : 'visitors'}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {visitors.map((v, index) => {
        const errors = rowErrors[index];
        return (
          <div key={index} className="card">
            <div className="visitor-title">
              <h3>Visitor {index + 1}</h3>
              <span className="visitor-count-badge">{count ? `${index + 1} of ${count}` : `${index + 1}`}</span>
            </div>

            <Field label="Name" required htmlFor={`v${index}-name`} error={showError(index, 'name') ? errors.name : ''}>
              <input
                id={`v${index}-name`}
                className={`input ${showError(index, 'name') && errors.name ? 'invalid' : ''}`}
                value={v.name}
                onChange={(e) => setVisitorValue(index, 'name', e.target.value)}
                placeholder="Full name"
                autoComplete="name"
              />
            </Field>

            <Field label="Phone" required htmlFor={`v${index}-phone`} error={showError(index, 'phone') ? errors.phone : ''}>
              <input
                id={`v${index}-phone`}
                className={`input ${showError(index, 'phone') && errors.phone ? 'invalid' : ''}`}
                value={v.phone}
                onChange={(e) => setVisitorValue(index, 'phone', e.target.value)}
                placeholder="e.g. +91 98765 43210"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>

            <Field
              label="Email"
              htmlFor={`v${index}-email`}
              error={showError(index, 'email') ? errors.email : ''}
              help="Optional — QR will be emailed here if provided."
            >
              <input
                id={`v${index}-email`}
                className={`input ${showError(index, 'email') && errors.email ? 'invalid' : ''}`}
                type="email"
                value={v.email}
                onChange={(e) => setVisitorValue(index, 'email', e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Business Name" required htmlFor={`v${index}-business`} error={showError(index, 'businessName') ? errors.businessName : ''}>
              <input
                id={`v${index}-business`}
                className={`input ${showError(index, 'businessName') && errors.businessName ? 'invalid' : ''}`}
                value={v.businessName}
                onChange={(e) => setVisitorValue(index, 'businessName', e.target.value)}
                placeholder="Business / organization name"
              />
            </Field>

            <Field
              label="Category"
              required
              htmlFor={`v${index}-category`}
              error={showError(index, 'category') ? errors.category : ''}
              help="Type the category that best describes this visitor (e.g. Manufacturing, Startup, Supplier)."
            >
              <input
                id={`v${index}-category`}
                className={`input ${showError(index, 'category') && errors.category ? 'invalid' : ''}`}
                value={v.category}
                onChange={(e) => setVisitorValue(index, 'category', e.target.value)}
                placeholder="Enter category"
              />
            </Field>
          </div>
        );
      })}

      {submitError && <div className="banner error">{submitError}</div>}

      <div className="card">
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !allValid || !member || !count}>
          {submitting ? 'Registering…' : 'Submit Registration'}
        </button>
        {attempted && !allValid && (
          <div className="help text-center" style={{ marginTop: 10 }}>
            Please complete all required fields correctly before submitting.
          </div>
        )}
      </div>

      <p className="footer-note">
        Registration is open from <strong>23 Sep</strong> through <strong>1 Oct 2026</strong>.
      </p>
    </form>
  );
}