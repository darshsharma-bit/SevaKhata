/**
 * SevaKhata — shared validation rules & form schemas.
 *
 * Written as a UMD module so the SAME rules run in the browser (inline,
 * real-time errors) and in server.js (authoritative re-validation).
 *
 * A rule returns null when the value is fine, or { key, en } when it is not.
 *   key -> i18n message key (translated in the browser by js/i18n.js)
 *   en  -> English fallback (used by the server and when no translation exists)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SKValidate = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PHONE_RE = /^[6-9]\d{9}$/;                       // Indian mobile number
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;   // letters (incl. Devanagari), spaces, . ' -

  const CATEGORIES = ['cook', 'maid', 'driver', 'caregiver', 'gardener', 'other'];
  const RATE_TYPES = ['daily', 'monthly'];
  const ID_TYPES = ['aadhaar', 'voter', 'dl', 'pan'];
  const ID_PATTERNS = {
    aadhaar: { re: /^[2-9]\d{11}$/, en: 'Aadhaar must be 12 digits and cannot start with 0 or 1.' },
    voter: { re: /^[A-Z]{3}\d{7}$/, en: 'Voter ID looks like ABC1234567.' },
    dl: { re: /^[A-Z]{2}\d{2}\s?\d{11}$/, en: 'Driving licence looks like HR0620110012345.' },
    pan: { re: /^[A-Z]{5}\d{4}[A-Z]$/, en: 'PAN looks like ABCDE1234F.' }
  };
  const LEDGER_TYPES = ['attendance', 'payment', 'advance', 'bonus'];
  const ATTENDANCE_KINDS = ['full', 'half', 'extra', 'absent'];
  const LEDGER_STATUSES = ['pending', 'confirmed', 'disputed'];
  const FEEDBACK_KINDS = ['support', 'feedback', 'verification'];
  const REQUEST_KINDS = ['new', 'existing'];

  /* ------------------------------ rule builders ------------------------------ */
  const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || v === false;

  const required = (key = 'v.required', en = 'This field is required.') =>
    (v) => (isBlank(v) ? { key, en } : null);

  const minLen = (n) => (v) =>
    isBlank(v) || String(v).trim().length >= n ? null : { key: 'v.minLen', en: `Please enter at least ${n} characters.`, params: { n } };

  const maxLen = (n) => (v) =>
    isBlank(v) || String(v).trim().length <= n ? null : { key: 'v.maxLen', en: `Please keep this under ${n} characters.`, params: { n } };

  const pattern = (re, key, en) => (v) => (isBlank(v) || re.test(String(v).trim()) ? null : { key, en });

  const phone = () => pattern(PHONE_RE, 'v.phone', 'Enter a valid 10-digit Indian mobile number (starts with 6–9).');
  const email = () => pattern(EMAIL_RE, 'v.email', 'Enter a valid email address.');
  const personName = () => pattern(NAME_RE, 'v.name', 'Use letters and spaces only.');

  const number = (opts = {}) => (v) => {
    if (isBlank(v)) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return { key: 'v.number', en: 'Enter a valid number.' };
    if (opts.positive && !(n > 0)) return { key: 'v.positive', en: 'Enter an amount greater than 0.' };
    if (opts.min !== undefined && n < opts.min) return { key: 'v.min', en: `Value must be at least ${opts.min}.`, params: { n: opts.min } };
    if (opts.max !== undefined && n > opts.max) return { key: 'v.max', en: `Value must be at most ${opts.max}.`, params: { n: opts.max } };
    return null;
  };

  const oneOf = (list) => (v) => (isBlank(v) || list.includes(v) ? null : { key: 'v.choice', en: 'Please choose a valid option.' });

  const isoDate = (opts = {}) => (v) => {
    if (isBlank(v)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) return { key: 'v.date', en: 'Enter a valid date.' };
    if (opts.notFuture) {
      const today = new Date(); today.setHours(23, 59, 59, 999);
      if (new Date(v + 'T00:00:00') > today) return { key: 'v.dateFuture', en: 'Date cannot be in the future.' };
    }
    if (opts.notPast) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(v + 'T00:00:00') < today) return { key: 'v.datePast', en: 'Date cannot be in the past.' };
    }
    return null;
  };

  const custom = (fn) => fn;

  /* --------------------------------- engine ---------------------------------- */
  function validateField(schema, name, value, all) {
    const rules = schema[name];
    if (!rules) return null;
    const list = typeof rules === 'function' ? rules(all || {}) : rules;
    for (const rule of list) {
      const res = rule(value, all || {});
      if (res) return res;
    }
    return null;
  }

  function validate(schema, values) {
    const errors = {};
    for (const name of Object.keys(schema)) {
      const err = validateField(schema, name, values[name], values);
      if (err) errors[name] = err;
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  /* --------------------------------- schemas --------------------------------- */
  const SCHEMAS = {
    /** Browser form for worker onboarding (includes the ID number, which is never sent). */
    workerForm: {
      name: [required(), minLen(3), maxLen(60), personName()],
      phone: [required(), phone()],
      email: [email()],
      category: [required(), oneOf(CATEGORIES)],
      skills: [required(), minLen(2), maxLen(120)],
      experienceYears: [required(), number({ min: 0, max: 50 })],
      location: [required(), minLen(3), maxLen(80)],
      rateType: [required(), oneOf(RATE_TYPES)],
      rate: (all) => [required(), number({ positive: true, min: all.rateType === 'monthly' ? 1000 : 100, max: all.rateType === 'monthly' ? 100000 : 5000 })],
      idType: [required(), oneOf(ID_TYPES)],
      idNumber: (all) => {
        const p = ID_PATTERNS[all.idType];
        return [required(), (v) => {
          if (isBlank(v) || !p) return null;
          const clean = String(v).replace(/\s+/g, '').toUpperCase();
          const candidate = all.idType === 'dl' ? String(v).toUpperCase() : clean;
          return p.re.test(candidate) ? null : { key: 'v.id.' + all.idType, en: p.en };
        }];
      },
      about: [maxLen(300)],
      consent: [required('v.consent', 'Please agree before submitting.')]
    },

    /** Payload actually stored for a worker (Aadhaar/ID number is reduced to its last 4 characters). */
    worker: {
      name: [required(), minLen(3), maxLen(60), personName()],
      phone: [required(), phone()],
      email: [email()],
      category: [required(), oneOf(CATEGORIES)],
      skills: [required()],
      experienceYears: [required(), number({ min: 0, max: 50 })],
      location: [required(), minLen(3), maxLen(80)],
      rateType: [required(), oneOf(RATE_TYPES)],
      rate: [required(), number({ positive: true, max: 100000 })],
      idType: [required(), oneOf(ID_TYPES)],
      idLast4: [required(), pattern(/^[A-Z0-9]{4}$/, 'v.idLast4', 'ID reference must be exactly 4 letters/digits.')],
      about: [maxLen(300)]
    },

    booking: {
      requestKind: [required(), oneOf(REQUEST_KINDS)],
      householdName: [required(), minLen(3), maxLen(60)],
      contactName: [required(), minLen(3), maxLen(60), personName()],
      phone: [required(), phone()],
      email: [email()],
      category: [required(), oneOf(CATEGORIES)],
      workerId: (all) => (all.requestKind === 'existing' ? [required('v.chooseWorker', 'Please pick the helper.')] : []),
      location: [required(), minLen(3), maxLen(80)],
      startDate: [required(), isoDate()],
      schedule: [required(), maxLen(80)],
      offeredRate: [number({ positive: true, max: 100000 })],
      notes: [maxLen(400)]
    },

    ledger: {
      workerId: [required('v.chooseWorker', 'Please pick the helper.')],
      type: [required(), oneOf(LEDGER_TYPES)],
      attendanceKind: (all) => (all.type === 'attendance' ? [required(), oneOf(ATTENDANCE_KINDS)] : []),
      days: (all) => (all.type === 'attendance' && all.attendanceKind !== 'extra' ? [required(), number({ positive: true, max: 31 })] : []),
      date: [required(), isoDate({ notFuture: true })],
      amount: (all) => (all.type === 'attendance' && all.attendanceKind === 'absent'
        ? [number({ min: 0, max: 0 })]
        : [required(), number({ positive: true, max: 1000000 })]),
      note: [maxLen(160)]
    },

    dispute: {
      reason: [required(), minLen(10), maxLen(200)]
    },

    feedback: {
      kind: [required(), oneOf(FEEDBACK_KINDS)],
      name: [required(), minLen(3), maxLen(60), personName()],
      phone: [phone()],
      email: [required(), email()],
      subject: [required(), minLen(5), maxLen(100)],
      message: [required(), minLen(20), maxLen(1000)],
      rating: (all) => (all.kind === 'feedback' ? [required('v.rating', 'Please give a rating.'), number({ min: 1, max: 5 })] : [number({ min: 1, max: 5 })])
    }
  };

  return {
    validate, validateField, SCHEMAS,
    rules: { required, minLen, maxLen, pattern, phone, email, number, oneOf, isoDate, custom },
    CONST: { CATEGORIES, RATE_TYPES, ID_TYPES, ID_PATTERNS, LEDGER_TYPES, ATTENDANCE_KINDS, LEDGER_STATUSES, FEEDBACK_KINDS, REQUEST_KINDS, PHONE_RE, EMAIL_RE }
  };
});
